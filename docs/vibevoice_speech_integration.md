# VibeVoice Speech Integration

The clock's Scripture Reader and Daily Content Bundle generate speech through the Fortress LAN VibeVoice API. Browser code never receives the Fortress token. The browser calls this app's same-origin proxy, and `src/webserver.py` adds the token server-side.

## Runtime Configuration

Set these environment variables before starting the Solomonic server:

```text
SOLOMONIC_VIBEVOICE_API_BASE=http://100.100.97.30:8011
SOLOMONIC_VIBEVOICE_API_TOKEN=<shared Fortress voice token>
```

For Contabo/IPsec deployments, use:

```text
SOLOMONIC_VIBEVOICE_API_BASE=http://192.168.0.126:8011
SOLOMONIC_VIBEVOICE_FALLBACK_API_BASE=http://192.168.0.126:8013
```

The proxy also accepts `VIBEVOICE_API_TOKEN` as a fallback token env var. If the GPU-backed VibeVoice service on `8011` is unavailable, the server falls back to the Fortress Azure Voice service on `8013`, which uses the same job and audio URL contract.

## Token Retrieval

Follow the Fortress LAN handoff guide:

```text
/Users/benjaminlagrone/Documents/projects/fortress-lan/docs/voice-api-secrets.md
```

That document says an operator with SSH access retrieves the token from Fortress's server-local `.env`, then provisions it into this app's secret store. Do not commit or paste the real token into source, browser JavaScript, logs, docs, or chat.

## Local Test Command

Start the local server with the token injected from Fortress without printing it:

```bash
TOKEN=$(ssh -o BatchMode=yes -o ConnectTimeout=10 master-benjamin@100.100.97.30 \
  "cd /home/master-benjamin/Projects/fortress-lan && sed -n 's/^VIBEVOICE_API_TOKEN=//p' .env")

PYTHONPYCACHEPREFIX=/private/tmp/solomonic_pycache \
SOLOMONIC_VIBEVOICE_API_BASE=http://100.100.97.30:8011 \
SOLOMONIC_VIBEVOICE_API_TOKEN="$TOKEN" \
python3 src/webserver.py --host 127.0.0.1 --port 8099
```

Then open:

```text
http://127.0.0.1:8099/clock
```

Press `Speak` in the Scripture Reader or Daily Content Bundle.

## Proxy Endpoints

- `GET /api/vibevoice/health`
- `POST /api/vibevoice/tts/jobs`
- `GET /api/vibevoice/tts/jobs/{job_id}`
- `GET /api/vibevoice/audio?url=<encoded /files/... URL>`

The frontend sends only text. The backend constructs the Fortress payload with:

- `project_id`: `solomonic-seals`
- `mode`: `single`
- `speaker_name`: `Carter`
- `cfg_scale`: `1.5`
- `output_subdir`: `audio/vibevoice`

`GET /api/vibevoice/health` is a passive client-side diagnostics endpoint. It reports whether the app proxy has token configuration, whether primary/fallback routes are configured, and the expected primary/fallback engines. It does not contact, restart, or mutate Fortress services.

Job responses are annotated by the app proxy with:

- `proxy_route`: `primary` or `fallback`
- `proxy_engine`: inferred or upstream-reported engine, such as `official`, `mock`, or `azure-speech`
- `proxy_audio_url`: same-origin audio URL safe for browser playback

The Clock UI preserves this metadata and reports the engine in Speak status text, for example `Playing Psalm 40:13 via Azure Speech.`

## Client-Side Production Smoke

Use the smoke script from this repo to verify the True Vine OS client contract without touching Fortress host services:

```bash
scripts/vibevoice_smoke.sh https://truevineos.cloud
```

To assert a specific engine:

```bash
scripts/vibevoice_smoke.sh https://truevineos.cloud azure-speech
scripts/vibevoice_smoke.sh https://truevineos.cloud mock
scripts/vibevoice_smoke.sh https://truevineos.cloud official
```

The script checks `GET /api/vibevoice/health`, creates a short job through `POST /api/vibevoice/tts/jobs`, polls `GET /api/vibevoice/tts/jobs/{job_id}` when needed, downloads the returned `proxy_audio_url`, and fails if the audio response is missing or empty.

This is the client boundary. Do not reboot or mutate Fortress from this workflow. If primary VibeVoice on `8011` is unavailable, write or update a Fortress LAN handoff and keep production using the configured fallback until Fortress-side investigation resolves it.

## Verified Result

On 2026-06-07 UTC, production smoke testing succeeded through the public True Vine OS endpoint:

- Base URL: `https://truevineos.cloud`
- Created job: `azv-20260607-020349-83ca`
- Engine: `azure-speech`
- Status: `completed`
- Audio bytes: `211246`

On 2026-05-23, local proxy testing succeeded through the Tailscale route:

- Created job: `vv-20260523-160229-18c4`
- Status: `completed`
- Audio proxy response: `200 OK`
- Content type: `audio/x-wav`
- Content length: `153644`
