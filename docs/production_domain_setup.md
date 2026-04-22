# Production Domain Setup

Target environment:
- host: Contabo VPS
- public domain: `truevineos.cloud`
- application upstream: loopback-bound Docker container on `127.0.0.1:8086`
- public ingress: host nginx with Let's Encrypt

This repo does not contain host-level provisioning. The files below are the production deployment artifacts:
- `docker-compose.prod.yml`
- `.env.prod.example`
- `deploy/nginx/truevineos.cloud.http-only.conf`
- `deploy/nginx/truevineos.cloud.conf`

## 1. Prepare the host

Install:
- Docker Engine with Compose plugin
- nginx
- certbot
- `python3-certbot-nginx` or use the `--webroot` flow below

Create the shared network once:

```bash
docker network create fortress-phronesis-net
```

If the Pericope corpus container runs on a different Docker network in production, change `SOLOMONIC_SHARED_NETWORK` in `.env.prod`.

## 2. Create the production env file

```bash
cp .env.prod.example .env.prod
```

Recommended contents for `truevineos.cloud`:

```dotenv
SOLOMONIC_HOST_PORT=8086
SOLOMONIC_SHARED_NETWORK=fortress-phronesis-net
SOLOMONIC_GUIDED_PROMPTS_API_KEY=<shared-secret-if-used>
SOLOMONIC_PSALM_SOURCE_MODE=pericope_first
SOLOMONIC_PERICOPE_API_BASE=http://augustine-corpus-live:8001
```

Notes:
- Keep `SOLOMONIC_HOST_PORT` on loopback only. nginx is the public edge.
- If guided prompts are not in use yet, the shared secret can remain blank.
- The production image includes `docs/source_texts/Psalms.txt`, so `SOLOMONIC_PSALM_SOURCE_MODE=pericope_first` can fall back to local English Psalms when the Pericope corpus route is unavailable.

## 3. Start the application container

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Verify the app before wiring nginx:

```bash
curl -sS http://127.0.0.1:8086/api/clock | head
```

## 4. Install the bootstrap nginx site

Create the ACME webroot:

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

Install the HTTP-only bootstrap site:

```bash
sudo cp deploy/nginx/truevineos.cloud.http-only.conf /etc/nginx/sites-available/truevineos.cloud.conf
sudo ln -sf /etc/nginx/sites-available/truevineos.cloud.conf /etc/nginx/sites-enabled/truevineos.cloud.conf
sudo nginx -t
sudo systemctl reload nginx
```

At this point:
- `http://truevineos.cloud` should proxy to the clock
- `http://www.truevineos.cloud` should redirect to apex

## 5. Issue the TLS certificate

Webroot flow:

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d truevineos.cloud \
  -d www.truevineos.cloud
```

## 6. Switch nginx to the TLS site

```bash
sudo cp deploy/nginx/truevineos.cloud.conf /etc/nginx/sites-available/truevineos.cloud.conf
sudo nginx -t
sudo systemctl reload nginx
```

Result:
- `https://truevineos.cloud` serves the app
- `https://www.truevineos.cloud` redirects to apex
- all public traffic terminates at nginx and proxies to `127.0.0.1:8086`

## 7. DNS expectations

At the registrar or DNS provider:
- `A` record: `truevineos.cloud` -> your Contabo VPS IPv4
- `A` record: `www.truevineos.cloud` -> same IPv4 or CNAME to apex
- optional `AAAA` records if the VPS has IPv6 configured end-to-end

## 8. Operational commands

Deploy updated app code:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Check container status:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

Tail app logs:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f solomonic-clock
```

Renew certificates:

```bash
sudo certbot renew --dry-run
```

## 9. Verification checklist

- `curl -I http://truevineos.cloud` returns `200` during bootstrap or `301` after TLS cutover
- `curl -I https://truevineos.cloud` returns `200`
- `curl -I https://www.truevineos.cloud` returns `301` to apex
- `curl -sS https://truevineos.cloud/api/clock | head` returns JSON
- browser loads `https://truevineos.cloud/web/clock_visualizer.html`

## 10. Reverse proxy contract

The nginx config assumes:
- app container listens on `8080`
- prod compose publishes it to `127.0.0.1:8086`
- nginx and Docker run on the same host

If you later move nginx into Docker or put Cloudflare in front, update the upstream and TLS strategy instead of exposing the app container directly.
