# VibeVoice Speech Integration

The clock's Scripture Reader and Daily Content Bundle generate speech through the Fortress LAN voice gateway. Browser code never receives the Fortress token. The browser calls this app's same-origin proxy, and `src/webserver.py` forwards the request server-side.

## Runtime Configuration

Set these environment variables before starting the Solomonic server:

```text
SOLOMONIC_VIBEVOICE_API_BASE=http://100.100.97.30:8133
```

For Contabo/IPsec deployments, use:

```text
SOLOMONIC_VIBEVOICE_API_BASE=http://192.168.0.126:8133
SOLOMONIC_VIBEVOICE_FALLBACK_API_BASE=
```

The Fortress LAN gateway is the central voice brain. It owns backend selection across VibeVoice and Azure Voice. Solomonic should not point at `8011` or `8013` directly unless an operator is deliberately bypassing the gateway for emergency diagnostics.

The proxy also accepts `SOLOMONIC_VIBEVOICE_API_TOKEN` or `VIBEVOICE_API_TOKEN` for deployments where the gateway requires a shared private token. Do not configure a direct fallback route in normal production; fallback policy belongs in the Fortress gateway.

## Token Retrieval

Follow the Fortress LAN handoff guide:

```text
/Users/benjaminlagrone/Documents/projects/fortress-lan/docs/voice-api-secrets.md
```

That document says an operator with SSH access retrieves the token from Fortress's server-local `.env`, then provisions it into this app's secret store. Do not commit or paste the real token into source, browser JavaScript, logs, docs, or chat.

## Local Test Command

Start the local server against the gateway:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/solomonic_pycache \
SOLOMONIC_VIBEVOICE_API_BASE=http://100.100.97.30:8133 \
python3 src/webserver.py --host 127.0.0.1 --port 8099
```

If the gateway is configured to require a shared private token, inject
`SOLOMONIC_VIBEVOICE_API_TOKEN` from the approved secret store without printing
the value.

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

`GET /api/vibevoice/health` is a passive client-side diagnostics endpoint. It reports whether the app proxy has token configuration and whether the central voice gateway route is configured. It does not contact, restart, or mutate Fortress services.

Job responses are annotated by the app proxy with:

- `proxy_route`: normally `primary`, meaning the Fortress voice gateway
- `proxy_engine`: inferred or upstream-reported engine, such as `vibevoice`, `mock`, or `azure-speech`
- `proxy_audio_url`: same-origin audio URL safe for browser playback

The Clock UI preserves this metadata and reports the engine in Speak status text, for example `Playing Psalm 40:13 via Azure Speech.`

## Client-Side Production Smoke

Use the smoke script from this repo to verify the True Vine OS client contract without touching Fortress host services:

```bash
scripts/vibevoice_smoke.sh https://truevineos.cloud
```

To assert a specific engine:

```bash
scripts/vibevoice_smoke.sh https://truevineos.cloud vibevoice
scripts/vibevoice_smoke.sh https://truevineos.cloud mock
scripts/vibevoice_smoke.sh https://truevineos.cloud azure-speech
```

The script checks `GET /api/vibevoice/health`, creates a short job through `POST /api/vibevoice/tts/jobs`, polls `GET /api/vibevoice/tts/jobs/{job_id}` when needed, downloads the returned `proxy_audio_url`, and fails if the audio response is missing or empty.

This is the client boundary. Do not reboot or mutate Fortress from this workflow. If the gateway selects Azure Voice, diagnose the Fortress LAN gateway and VibeVoice service there instead of adding app-local fallback logic.

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
