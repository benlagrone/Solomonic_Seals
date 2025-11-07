#!/bin/sh
set -e

# Rebuild the dataset on each container start so the JSON stays up to date.
python src/generate_full_dataset.py

PORT="${PORT:-8080}"
exec python -m http.server "$PORT" --directory /app
