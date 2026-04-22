# Solomonic Clock of Spheres

Structured data and visualization scaffolding for the Solomonic Clock — a symbolic calendar that layers master, celestial, planetary, and spirit seals into one radial display.

## Local Quickstart

1. (Optional) Create a virtual environment: `python3 -m venv .venv && source .venv/bin/activate`
2. Generate/refresh the dataset: `python src/generate_full_dataset.py`
3. Launch the bundled dev server (defaults to port 8080): `python src/webserver.py`
4. Open `http://localhost:8080/` for the public landing page or `http://localhost:8080/clock` for the live instrument. `GET /api/clock` returns the latest JSON (`data/solomonic_clock_full.json`).

Environment variables:

- `PORT` — overrides the listening port (default `8080`)
- `HOST` — overrides the bind address (default `0.0.0.0`)

## Docker

1. Ensure the shared network exists once: `docker network create fortress-phronesis-net`
2. Copy `.env.example` to `.env` if you need a guided-prompts key or want to override the Pericope corpus base.
3. Build and start: `docker compose up -d`
4. Visit `http://localhost:8086/web/clock_visualizer.html`

Optional host port override:

```bash
SOLOMONIC_HOST_PORT=8090 docker compose up -d
```

The container rebuilds the dataset on each start and runs the same lightweight server (`src/webserver.py`), exposing `/api/clock` and serving static assets from `/app`.

Clock-specific envs:

- `SOLOMONIC_GUIDED_PROMPTS_API_KEY` — shared secret for the guided-prompts endpoint
- `SOLOMONIC_PSALM_SOURCE_MODE` — default `pericope_first`
- `SOLOMONIC_PERICOPE_API_BASE` — defaults to `http://host.docker.internal:8001` in the standalone compose file; the control-plane stack uses the internal corpus DNS name instead
- `SOLOMONIC_SITE_URL` — optional canonical site URL for sitemap/canonical metadata (defaults to the incoming request host)

The image also includes `docs/source_texts/Psalms.txt` as a public-domain English Psalms fallback. If Pericope corpus lookup is unavailable, `/api/psalm` and Psalm study expansions still resolve from this local source.

To regenerate the dataset manually inside the container:

```bash
docker compose run --rm solomonic-clock python src/generate_full_dataset.py
```

## Production

Production deployment for `truevineos.cloud` is documented in [docs/production_domain_setup.md](docs/production_domain_setup.md).

Artifacts included in this repo:
- `docker-compose.prod.yml` for the loopback-bound app container
- `.env.prod.example` for production envs
- `deploy/nginx/truevineos.cloud.http-only.conf` for first bootstrap
- `deploy/nginx/truevineos.cloud.conf` for final TLS proxying

Recommended production flow:

```bash
cp .env.prod.example .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## Repository Layout

- `data/` — generated JSON (`solomonic_clock_full.json`)
- `src/` — dataset generator, validator, and dev web server
- `web/` — static visualization (HTML/CSS/JS)
- `docs/` — research notes and project handoff material

## Source Texts From PericopeAI (No Copy)

If your Solomonic texts already live in PericopeAI, index them in place:

```bash
python3 scripts/index_source_texts.py \
  --source-dir /Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts \
  --output data/source_texts_index.json
```

You can also set `SOLOMONIC_SOURCE_TEXTS_DIR` and omit `--source-dir`.

## Next Steps

- Extend `web/clock.js` to fetch `/api/clock` dynamically instead of reading bundled JSON
- Expand `src/webserver.py` with additional API slices (e.g., psalm lookups) as the dataset grows
