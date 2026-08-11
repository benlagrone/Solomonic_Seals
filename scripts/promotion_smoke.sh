#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/promotion_smoke.sh <local|lan|public>

Runs the required smoke checks for the True Vine OS promotion path:
  local  -> http://truevineos.local
  lan    -> http://truevineos.lan
  public -> https://truevineos.cloud
EOF
}

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 2
fi

stage="$1"

case "$stage" in
  local)
    base_url="http://truevineos.local"
    ;;
  lan)
    base_url="http://truevineos.lan"
    ;;
  public)
    base_url="https://truevineos.cloud"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

echo "==> Smoke: $stage ($base_url)"

status="$(curl -sS -o /tmp/truevineos-smoke-root.$$ -w '%{http_code}' --max-time 15 "$base_url/")"
if [[ "$status" != "200" ]]; then
  echo "Root check failed: expected HTTP 200, got HTTP $status" >&2
  cat /tmp/truevineos-smoke-root.$$ >&2 || true
  rm -f /tmp/truevineos-smoke-root.$$
  exit 1
fi
rm -f /tmp/truevineos-smoke-root.$$

clock_html="$(curl -sS --max-time 15 "$base_url/clock")"
for expected in \
  'class="daily-meditation drawer-section"' \
  'class="meditation-source-notes manuscript-source-note"' \
  'data-drawer-tab="proverb"' \
  'data-drawer-tab="psalm"' \
  '/web/vendor/d3.v7.min.js'
do
  if ! grep -Fq "$expected" <<<"$clock_html"; then
    echo "Clock page check failed: expected deployed /clock to include $expected" >&2
    exit 1
  fi
done

style_css="$(curl -sS --max-time 15 "$base_url/web/style.css")"
for expected in \
  '@media (max-width: 640px)' \
  '@media (max-width: 380px) and (min-height: 700px)' \
  '@media (min-width: 700px) and (max-width: 1180px) and (min-height: 600px)' \
  '@media (min-width: 1280px) and (min-height: 700px) and (hover: none)' \
  '.meditation-source-excerpt'
do
  if ! grep -Fq "$expected" <<<"$style_css"; then
    echo "Responsive CE-5 style check failed: expected deployed CSS to include $expected" >&2
    exit 1
  fi
done

d3_status="$(curl -sS -o /tmp/truevineos-smoke-d3.$$ -w '%{http_code}' --max-time 15 "$base_url/web/vendor/d3.v7.min.js")"
if [[ "$d3_status" != "200" ]] || [[ ! -s /tmp/truevineos-smoke-d3.$$ ]]; then
  echo "D3 fallback check failed: expected deployed local D3 asset to return HTTP 200 with a body." >&2
  rm -f /tmp/truevineos-smoke-d3.$$
  exit 1
fi
rm -f /tmp/truevineos-smoke-d3.$$

clock_json="$(curl -sS --max-time 15 "$base_url/api/clock")"
if ! grep -q '"title"[[:space:]]*:[[:space:]]*"True Vine OS"' <<<"$clock_json"; then
  echo "Clock API check failed: expected title \"True Vine OS\"." >&2
  printf '%s\n' "$clock_json" | head -40 >&2
  exit 1
fi

generated_at="$(printf '%s' "$clock_json" | sed -n 's/.*"generated_at"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

context_check="$(curl -sS --max-time 15 \
  -H 'content-type: application/json' \
  -d '{}' \
  "$base_url/api/clock/context" \
  | python3 -c 'import json, sys
payload = json.load(sys.stdin)
cited = [work for work in payload.get("cited_works", []) if work.get("kind") == "cited_work"]
if len(cited) < 1:
    raise SystemExit("expected at least one cited_work record")
if not any((work.get("relation_to_moment") or {}).get("why_now") for work in cited):
    raise SystemExit("expected cited_work relation_to_moment.why_now")
print(f"cited_work_records={len(cited)}")')"

echo "OK: $base_url/"
echo "OK: $base_url/clock"
echo "OK: $base_url/api/clock"
echo "OK: $base_url/api/clock/context ($context_check)"
if [[ -n "$generated_at" ]]; then
  echo "generated_at=$generated_at"
fi
