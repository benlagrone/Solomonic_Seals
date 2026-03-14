# Pericope FE Secure Guided Prompts Proxy Handoff

Purpose:
This handoff is for the Pericope FE Codex chat.

Goal:
Consume the clock-owned guided-prompts API safely from Pericope without exposing the shared secret to browser clients.

Authoritative clock-side contract:
- [clock_guided_prompts_api_handoff.md](/Users/benjaminlagrone/Documents/projects/pericopeai.com/Solomonic_Seals/docs/clock_guided_prompts_api_handoff.md)

Clock-side status:
- `Solomonic_Seals` now exposes `POST /api/pericope/guided-prompts`
- it is protected by a required shared secret
- accepted auth:
  - `X-Solomonic-Clock-Key: <secret>`
  - or `Authorization: Bearer <secret>`
- required env on the clock service:
  - `SOLOMONIC_GUIDED_PROMPTS_API_KEY`

## Core Rule

Do not put the shared secret into:
- `REACT_APP_*`
- browser fetch headers
- compiled JavaScript

The secret must be injected by a server-side proxy only.

## Current FE State

Current relevant files in `AugustineFE`:
- [AugustineFE/src/App.js](/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineFE/src/App.js)
- [AugustineFE/nginx.conf](/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineFE/nginx.conf)
- [AugustineFE/Dockerfile](/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineFE/Dockerfile)

Current behavior:
- React already calls `/api/pericope/guided-prompts`
- nginx currently proxies that path to:
  - `http://host.docker.internal:8086/api/pericope/guided-prompts`

Current problems:
1. No shared-secret header is added.
2. `host.docker.internal` is not safe to assume on Linux prod unless the container has a host-gateway mapping.
3. `nginx.conf` is copied as a static file, so a secret cannot be safely injected at runtime in the current shape.

## Required FE Changes

### 1. Keep React unchanged

React should continue to call:
- `/api/pericope/guided-prompts`

Do not add the secret to `App.js`.

## 2. Convert nginx config to a runtime template

Recommended shape:
- replace static `nginx.conf` usage with an nginx template
- let the nginx runtime substitute environment variables into the proxy config

Because the FE runtime image is `nginx:1.27-alpine`, prefer the built-in template flow:
- put the proxy config in `/etc/nginx/templates/default.conf.template`
- let the stock nginx entrypoint render it from env vars at container start

Recommended env vars for FE:
- `SOLOMONIC_CLOCK_UPSTREAM`
- `SOLOMONIC_CLOCK_GUIDED_PROMPTS_API_KEY`

Example template target for the guided-prompts route:

```nginx
location = /api/pericope/guided-prompts {
    proxy_pass ${SOLOMONIC_CLOCK_UPSTREAM}/api/pericope/guided-prompts;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Solomonic-Clock-Key ${SOLOMONIC_CLOCK_GUIDED_PROMPTS_API_KEY};
}
```

Important:
- the secret is injected by nginx at runtime
- the browser never sees it

### 3. Fix Linux host routing

If the FE container continues to proxy to a host-level clock service on `:8086`, add:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

to the FE service in prod compose.

Relevant file:
- [fortress-phronesis/docker-compose.pericope.yml](/Users/benjaminlagrone/Documents/projects/pericopeai.com/fortress-phronesis/docker-compose.pericope.yml)

Without that, the Linux frontend container may not be able to resolve `host.docker.internal`.

### 4. Keep the secret out of build args

Do not pass the shared secret as:
- Docker build arg
- `REACT_APP_*`
- anything written into the built static bundle

It must be a runtime env var only.

## Recommended Implementation Path

In `AugustineFE`:
1. Replace the copied static nginx config with a runtime template.
2. Add FE runtime env vars for:
   - `SOLOMONIC_CLOCK_UPSTREAM`
   - `SOLOMONIC_CLOCK_GUIDED_PROMPTS_API_KEY`
3. Add `extra_hosts` for `host.docker.internal:host-gateway` in Linux/prod compose if the upstream remains host-bound.
4. Leave React fetch behavior alone.

## Acceptance Criteria

The FE handoff is complete when:
1. Browser requests still go to `/api/pericope/guided-prompts`.
2. The FE proxy adds `X-Solomonic-Clock-Key` server-side.
3. The proxy reaches the clock successfully on Linux prod.
4. No shared secret appears in compiled frontend assets.
5. Empty-chat guided prompts load from the clock when the endpoint is healthy.
6. If the clock API fails, the existing FE fallback behavior still works.

## Verification

Server-side proxy verification:

```bash
curl -i http://localhost:13080/api/pericope/guided-prompts \
  -H 'Content-Type: application/json' \
  -d '{"timezone":"America/Chicago","as_of":"2026-03-13T20:15:00-05:00","limit":4}'
```

Expected:
- `200`
- response body includes `guided_prompts`

Negative check:
- inspect compiled FE assets and confirm the shared secret is not present

## Copy/Paste Prompt For Pericope FE Codex Chat

```text
Implement the Pericope frontend-side secure proxy for the Solomonic clock guided-prompts API.

Requirements:
- Keep React calling `/api/pericope/guided-prompts`
- Do not put the shared secret into browser JS or any REACT_APP_* variable
- Update the FE nginx layer so it proxies `/api/pericope/guided-prompts` to the clock service and injects `X-Solomonic-Clock-Key` server-side
- Use a runtime nginx template, not a static copied nginx.conf, so the secret can come from runtime env vars
- Add Linux-safe host routing if the upstream remains `host.docker.internal:8086` by adding `extra_hosts: ["host.docker.internal:host-gateway"]` in the relevant compose service
- Keep existing FE fallback behavior if the clock API is unavailable

Relevant files:
- AugustineFE/nginx.conf (or replacement template)
- AugustineFE/Dockerfile
- fortress-phronesis/docker-compose.pericope.yml
- AugustineFE/src/App.js

Clock-side auth contract:
- endpoint: POST /api/pericope/guided-prompts
- auth header: X-Solomonic-Clock-Key: <shared-secret>
- env name on clock side: SOLOMONIC_GUIDED_PROMPTS_API_KEY

Deliverables:
1. FE proxy implementation
2. runtime env/template wiring
3. compose change for Linux host routing if needed
4. verification steps
```
