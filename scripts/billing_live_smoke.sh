#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/billing_live_smoke.sh [base-url]

Runs non-destructive live billing checks for True Vine OS:
  - public root and clock page
  - live billing catalog and plan lookup keys
  - unauthenticated entitlement state
  - checkout auth guard
  - Stripe webhook signature guard
  - Keycloak authorization page reachability for the clock redirect

This script does not submit card details or create a paid subscription.
EOF
}

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
esac

base_url="${1:-https://truevineos.cloud}"
base_url="${base_url%/}"

case "${base_url}" in
  http://*|https://*)
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/truevineos-billing-live-smoke.XXXXXX")"
trap 'rm -rf "${tmp_dir}"' EXIT

echo "==> Billing live smoke: ${base_url}"

root_status="$(curl -sS -o "${tmp_dir}/root.html" -w '%{http_code}' --max-time 15 "${base_url}/")"
if [[ "${root_status}" != "200" ]]; then
  echo "Root check failed: expected HTTP 200, got HTTP ${root_status}." >&2
  exit 1
fi

clock_status="$(curl -sS -o "${tmp_dir}/clock.html" -w '%{http_code}' --max-time 15 "${base_url}/clock")"
if [[ "${clock_status}" != "200" ]]; then
  echo "Clock page check failed: expected HTTP 200, got HTTP ${clock_status}." >&2
  exit 1
fi

for expected in \
  'class="action-button account-sign-in"' \
  'data-price-lookup-key="truevineos_starter_monthly"' \
  'data-price-lookup-key="truevineos_pro_monthly"' \
  'data-price-lookup-key="truevineos_org_monthly"'
do
  if ! grep -Fq "${expected}" "${tmp_dir}/clock.html"; then
    echo "Clock billing UI check failed: expected ${expected}." >&2
    exit 1
  fi
done

curl -fsS --max-time 15 "${base_url}/api/billing/catalog" -o "${tmp_dir}/catalog.json"
python3 - "${tmp_dir}/catalog.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    catalog = json.load(handle)

expected = {
    "truevineos_starter_monthly": ("starter", 900),
    "truevineos_pro_monthly": ("pro", 2900),
    "truevineos_org_monthly": ("org", 9900),
}

if catalog.get("project") != "truevineos":
    raise SystemExit(f"unexpected project: {catalog.get('project')!r}")
if catalog.get("environment") != "live":
    raise SystemExit(f"expected live catalog, got {catalog.get('environment')!r}")

plans = {plan.get("lookup_key"): plan for plan in catalog.get("plans", [])}
for lookup_key, (plan_name, amount) in expected.items():
    plan = plans.get(lookup_key)
    if not plan:
        raise SystemExit(f"missing plan {lookup_key}")
    if plan.get("plan") != plan_name:
        raise SystemExit(f"{lookup_key} plan mismatch: {plan.get('plan')!r}")
    if plan.get("unit_amount") != amount:
        raise SystemExit(f"{lookup_key} amount mismatch: {plan.get('unit_amount')!r}")
    if plan.get("currency") != "usd" or plan.get("interval") != "month":
        raise SystemExit(f"{lookup_key} currency/interval mismatch")
PY

curl -fsS --max-time 15 "${base_url}/api/billing/entitlement" -o "${tmp_dir}/entitlement.json"
python3 - "${tmp_dir}/entitlement.json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    entitlement = json.load(handle)

if entitlement.get("service") != "truevineos":
    raise SystemExit(f"unexpected service: {entitlement.get('service')!r}")
if entitlement.get("environment") != "live":
    raise SystemExit(f"expected live entitlement, got {entitlement.get('environment')!r}")
if entitlement.get("authenticated") is not False:
    raise SystemExit("guest entitlement should be unauthenticated")
if entitlement.get("tier") != "guest":
    raise SystemExit(f"expected guest tier, got {entitlement.get('tier')!r}")
PY

checkout_status="$(
  curl -sS -o "${tmp_dir}/checkout.json" -w '%{http_code}' --max-time 15 \
    -X POST "${base_url}/api/billing/checkout" \
    -H 'Content-Type: application/json' \
    --data '{"price_lookup_key":"truevineos_starter_monthly"}'
)"
if [[ "${checkout_status}" != "401" ]]; then
  echo "Checkout guard failed: expected HTTP 401 without auth, got HTTP ${checkout_status}." >&2
  cat "${tmp_dir}/checkout.json" >&2
  exit 1
fi

webhook_status="$(
  curl -sS -o "${tmp_dir}/webhook.json" -w '%{http_code}' --max-time 15 \
    -X POST "${base_url}/api/stripe/webhook" \
    -H 'Content-Type: application/json' \
    --data '{}'
)"
if [[ "${webhook_status}" != "400" ]]; then
  echo "Webhook guard failed: expected HTTP 400 without Stripe-Signature, got HTTP ${webhook_status}." >&2
  cat "${tmp_dir}/webhook.json" >&2
  exit 1
fi

python3 - "${base_url}" <<'PY'
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlencode
from urllib.request import urlopen

base_url = sys.argv[1].rstrip("/")
query = urlencode(
    {
        "client_id": "pericope-web",
        "redirect_uri": f"{base_url}/clock",
        "response_type": "code",
        "scope": "openid profile email",
        "state": "billing-live-smoke",
        "nonce": "billing-live-smoke",
    }
)
url = f"https://auth.pericopeai.com/realms/pericope/protocol/openid-connect/auth?{query}"
with urlopen(url, timeout=15) as response:
    body = response.read().decode("utf-8", errors="replace")
    status = response.status

if status != 200:
    raise SystemExit(f"expected Keycloak login HTTP 200, got {status}")
if "pericope-web" not in body and not re.search(r"name=[\"']username[\"']", body, re.I):
    raise SystemExit("Keycloak login page did not include expected login markup")

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag != "a":
            return
        attr_map = dict(attrs)
        href = attr_map.get("href", "")
        text_id = " ".join(str(attr_map.get(key, "")) for key in ("id", "class", "aria-label"))
        self.links.append((href, text_id))

parser = LinkParser()
parser.feed(body)
has_register = any("registration" in href.lower() or "register" in meta.lower() for href, meta in parser.links)
if not has_register and "registration" not in body.lower() and "register" not in body.lower():
    raise SystemExit("Keycloak login page did not expose registration-related markup")
PY

echo "OK: ${base_url}/"
echo "OK: ${base_url}/clock"
echo "OK: ${base_url}/api/billing/catalog is live"
echo "OK: ${base_url}/api/billing/entitlement is live guest"
echo "OK: checkout requires a signed-in user"
echo "OK: webhook requires Stripe signature"
echo "OK: Keycloak auth page accepts ${base_url}/clock redirect"
