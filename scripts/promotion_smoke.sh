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

clock_json="$(curl -sS --max-time 15 "$base_url/api/clock")"
if ! printf '%s' "$clock_json" | grep -q '"title"[[:space:]]*:[[:space:]]*"True Vine OS"'; then
  echo "Clock API check failed: expected title \"True Vine OS\"." >&2
  printf '%s\n' "$clock_json" | head -40 >&2
  exit 1
fi

generated_at="$(printf '%s' "$clock_json" | sed -n 's/.*"generated_at"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"

echo "OK: $base_url/"
echo "OK: $base_url/api/clock"
if [[ -n "$generated_at" ]]; then
  echo "generated_at=$generated_at"
fi

