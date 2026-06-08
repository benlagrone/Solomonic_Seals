#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/vibevoice_smoke.sh [base-url] [expected-engine]

Examples:
  scripts/vibevoice_smoke.sh https://truevineos.cloud
  scripts/vibevoice_smoke.sh https://truevineos.cloud azure-speech
  scripts/vibevoice_smoke.sh http://truevineos.lan mock

This is a client-side smoke test for True Vine OS Speak. It does not touch
Fortress host services. It verifies:
  - GET /api/vibevoice/health exposes the proxy configuration boundary
  - POST /api/vibevoice/tts/jobs creates or completes a speech job
  - GET /api/vibevoice/tts/jobs/{job_id} can read the job
  - GET /api/vibevoice/audio?... returns a non-empty WAV/audio response
EOF
}

base_url="${1:-https://truevineos.cloud}"
expected_engine="${2:-}"

case "${base_url}" in
  http://*|https://*)
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

base_url="${base_url%/}"
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/truevineos-vibevoice-smoke.XXXXXX")"
trap 'rm -rf "${tmp_dir}"' EXIT

job_json="${tmp_dir}/job.json"
health_json="${tmp_dir}/health.json"
status_json="${tmp_dir}/status.json"
audio_file="${tmp_dir}/speech.wav"
headers_file="${tmp_dir}/audio.headers"

echo "==> Speak smoke: ${base_url}"

curl -fsS --max-time 15 "${base_url}/api/vibevoice/health" -o "${health_json}"
health_status="$(python3 - "$health_json" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    data = json.load(handle)
print(data.get("status", ""))
PY
)"
if [[ "${health_status}" != "configured" ]]; then
  echo "Speak smoke failed: /api/vibevoice/health status is ${health_status:-<empty>}." >&2
  cat "${health_json}" >&2
  exit 1
fi

curl -fsS --max-time 45 \
  -H "Content-Type: application/json" \
  -X POST "${base_url}/api/vibevoice/tts/jobs" \
  -d '{"text":"True Vine OS Speak smoke test."}' \
  -o "${job_json}"

read_job_field() {
  python3 - "$job_json" "$1" <<'PY'
import json
import sys

path, field = sys.argv[1], sys.argv[2]
with open(path, "r", encoding="utf-8") as handle:
    data = json.load(handle)
value = data.get(field, "")
print(value if value is not None else "")
PY
}

job_id="$(read_job_field job_id)"
engine="$(read_job_field engine)"
status="$(read_job_field status)"
proxy_audio_url="$(read_job_field proxy_audio_url)"

if [[ -z "${job_id}" ]]; then
  echo "Speak smoke failed: response did not include job_id." >&2
  cat "${job_json}" >&2
  exit 1
fi

if [[ -n "${expected_engine}" && "${engine}" != "${expected_engine}" ]]; then
  echo "Speak smoke failed: expected engine ${expected_engine}, got ${engine:-<empty>}." >&2
  cat "${job_json}" >&2
  exit 1
fi

if [[ "${status}" != "completed" ]]; then
  for _attempt in $(seq 1 20); do
    sleep 3
    curl -fsS --max-time 15 "${base_url}/api/vibevoice/tts/jobs/${job_id}" -o "${status_json}"
    status="$(python3 - "$status_json" <<'PY'
import json
import sys
with open(sys.argv[1], "r", encoding="utf-8") as handle:
    print(json.load(handle).get("status", ""))
PY
)"
    if [[ "${status}" == "completed" || "${status}" == "failed" ]]; then
      break
    fi
  done
  cp "${status_json}" "${job_json}"
  proxy_audio_url="$(read_job_field proxy_audio_url)"
fi

if [[ "${status}" != "completed" ]]; then
  echo "Speak smoke failed: job ${job_id} ended with status ${status:-<empty>}." >&2
  cat "${job_json}" >&2
  exit 1
fi

if [[ -z "${proxy_audio_url}" ]]; then
  echo "Speak smoke failed: completed job did not include proxy_audio_url." >&2
  cat "${job_json}" >&2
  exit 1
fi

curl -fsS --max-time 45 \
  -D "${headers_file}" \
  "${base_url}${proxy_audio_url}" \
  -o "${audio_file}"

audio_bytes="$(wc -c < "${audio_file}" | tr -d '[:space:]')"
content_type="$(awk 'BEGIN{IGNORECASE=1} /^content-type:/ {print $2; exit}' "${headers_file}" | tr -d '\r')"

if [[ "${audio_bytes}" -le 44 ]]; then
  echo "Speak smoke failed: audio response is too small (${audio_bytes} bytes)." >&2
  exit 1
fi

case "${content_type}" in
  audio/*|application/octet-stream)
    ;;
  *)
    echo "Speak smoke failed: expected audio content type, got ${content_type:-<empty>}." >&2
    cat "${headers_file}" >&2
    exit 1
    ;;
esac

echo "OK: job_id=${job_id}"
echo "OK: engine=${engine:-unknown}"
echo "OK: health=${health_status}"
echo "OK: status=${status}"
echo "OK: audio_bytes=${audio_bytes}"
