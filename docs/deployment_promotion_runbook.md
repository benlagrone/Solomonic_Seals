# True Vine OS Deployment Promotion Runbook

Promotion order is fixed:

```text
local -> lan -> public
```

Do not promote a build to a later stage until the previous stage has passed its
smoke checks for the same intended code state.

## Stage 1: Local

Purpose: prove the app starts and serves the current workspace build before it
touches shared infrastructure.

Canonical target:
- URL: `http://truevineos.local/`
- Fallback URL: `http://127.0.0.1:8086/`
- Compose file: `Solomonic_Seals/docker-compose.yml`
- Local router compose file: `Solomonic_Seals/docker-compose.local-router.yml`
- Service: `solomonic-clock`
- Router service: `truevineos-local-router`

Deploy:

```bash
cd /path/to/Solomonic_Clocks
docker compose -f docker-compose.yml up -d --build
docker compose -f docker-compose.local-router.yml up -d
```

The local router binds `127.0.0.1:80` and proxies `truevineos.local` to the app
on host port `8086`. Ensure `/etc/hosts` contains:

```text
127.0.0.1 truevineos.local
```

Smoke:

```bash
scripts/promotion_smoke.sh local
```

Manual checks:

```bash
curl -I http://truevineos.local/
curl -sS http://truevineos.local/api/clock | head
```

Gate:
- `/` returns HTTP 200.
- `/api/clock` returns JSON with `"title": "True Vine OS"`.
- Browser loads `http://truevineos.local/`.

## Stage 2: LAN

Purpose: prove the build on the Fortress LAN staging host before public
promotion.

Canonical target:
- URL: `http://truevineos.lan/`
- Host: `fortress.lan`
- Workspace: `/home/master-benjamin/Projects/pericopeai.com`
- Compose root: `/home/master-benjamin/Projects/pericopeai.com/fortress-phronesis`
- Compose project: `fortress-phronesis`
- Compose file: `docker-compose.pericope.yml`
- Service: `solomonic-clock`
- LAN edge proxy: `homeassistant-proxy`

Deploy:

```bash
ssh fortress.lan '
  set -e
  cd /home/master-benjamin/Projects/Solomonic_Clocks
  git fetch origin main
  git checkout main
  git pull --ff-only origin main

  cd /home/master-benjamin/Projects/pericopeai.com/fortress-phronesis
  docker compose -p fortress-phronesis -f docker-compose.pericope.yml \
    up -d --build solomonic-clock
'
```

Smoke from the developer machine:

```bash
scripts/promotion_smoke.sh lan
```

Server health:

```bash
ssh fortress.lan '
  cd /home/master-benjamin/Projects/pericopeai.com/fortress-phronesis
  docker compose -p fortress-phronesis -f docker-compose.pericope.yml \
    ps solomonic-clock augustine-corpus-live
'
```

Gate:
- `http://truevineos.lan/` returns HTTP 200.
- `http://truevineos.lan/api/clock` returns JSON with `"title": "True Vine OS"`.
- `fortress-phronesis-solomonic-clock-1` is Docker `healthy`.
- `fortress-phronesis-augustine-corpus-live-1` is Docker `healthy`.

## Stage 3: Public

Purpose: expose only a build already proven locally and on LAN.

Canonical target:
- URL: `https://truevineos.cloud/`
- Compose project on server: `fortress-phronesis`
- Compose file on server: `docker-compose.pericope.yml`
- Service: `solomonic-clock`
- Public edge: nginx + TLS

Public deployment is managed by the Fortress Phronesis control plane. The normal
image path is:

```text
Solomonic_Seals main -> GHCR image -> fortress-phronesis deploy workflow
```

Before triggering public promotion, confirm:

```bash
scripts/promotion_smoke.sh local
scripts/promotion_smoke.sh lan
```

After public deployment:

```bash
scripts/promotion_smoke.sh public
```

Gate:
- `https://truevineos.cloud/` returns HTTP 200.
- `https://truevineos.cloud/api/clock` returns JSON with `"title": "True Vine OS"`.
- Public nginx continues to terminate TLS and proxy to the app service without
  exposing a new public host port.

## Rollback

Rollback follows the reverse blast-radius order:

```text
public -> lan -> local
```

For public rollback, redeploy the last known good image/SHA through the Fortress
deploy workflow.

For LAN rollback:

```bash
ssh fortress.lan '
  cd /home/master-benjamin/Projects/Solomonic_Clocks
  git checkout <known-good-sha>

  cd /home/master-benjamin/Projects/pericopeai.com/fortress-phronesis
  docker compose -p fortress-phronesis -f docker-compose.pericope.yml \
    up -d --build solomonic-clock
'
```

For local rollback, checkout the known good SHA and rerun the local compose
command.
