# Solomonic Clock / True Vine OS GitHub Pipeline Handoff

This project now follows the same controlled image deployment model as the other fortress-managed apps.

## Deployment flow

1. Push to `main` in `Solomonic_Seals`.
2. GitHub Actions runs `.github/workflows/build-solomonic-clock.yml`.
3. The workflow validates the dataset, builds the container, smokes `http://127.0.0.1:18086/api/clock`, and pushes:
   - `ghcr.io/benlagrone/solomonic-seals:sha-<commit>`
   - `ghcr.io/benlagrone/solomonic-seals:latest`
4. On successful `main` pushes, the build workflow dispatches the fortress deploy workflow.
5. Fortress deploys only the `solomonic-clock` service inside the existing Pericope compose stack on Contabo.

## GitHub workflows

- Source build workflow:
  - `.github/workflows/build-solomonic-clock.yml`
- Fortress deploy workflow:
  - `fortress-phronesis/.github/workflows/deploy-solomonic-clock.yml`

## Runtime contract

- Compose project on server: `fortress-phronesis`
- Compose file on server: `docker-compose.pericope.yml`
- Service name: `solomonic-clock`
- Internal host port: `127.0.0.1:8086`
- Public URL: `https://truevineos.cloud/`

The Pericope stack contract stays intact:
- same compose project
- same service name
- same host port
- same internal network relationship to `augustine-corpus-live`

Only the deploy source changes from local `build:` to a pinned GHCR image override during deploy.

## Secrets

### In `Solomonic_Seals`

- `FORTRESS_WORKFLOW_TOKEN`
  - fine-grained token that can dispatch fortress workflows

### In `fortress-phronesis` environment `prod`

- `SOLOMONIC_CLOCK_DEPLOY_HOST`
- `SOLOMONIC_CLOCK_DEPLOY_USER`
- `SOLOMONIC_CLOCK_DEPLOY_ROOT`
- `SOLOMONIC_CLOCK_DEPLOY_SSH_KEY`
- `SOLOMONIC_CLOCK_DEPLOY_KNOWN_HOSTS`
- `SOLOMONIC_CLOCK_GHCR_READ_TOKEN`

## Manual deployment

If needed, run fortress workflow manually:

- workflow: `Deploy Solomonic Clock`
- inputs:
  - `source_sha=<commit sha>`
  - `environment=prod`

## Rollback

Redeploy an earlier green SHA by manually running the fortress workflow with the older `source_sha`.

## Current gate set

This project does not yet have a dedicated automated test suite. The active release gates are:

- Python syntax compile for `src/`
- dataset generation
- dataset validation via `src/validate_json.py`
- container smoke against `/api/clock`
- public smoke after deploy against `https://truevineos.cloud/` and `https://truevineos.cloud/api/clock`
