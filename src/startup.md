# Solomonic Clock of Spheres – Startup Brief

This project packages the Solomonic hierarchy (1 → 9 → 44 → 72) into a single
JSON dataset and an interactive D3.js radial visualiser. Re-run the dataset
builder whenever you tweak spirit names, planetary focuses, or visual
parameters; the web assets consume `data/solomonic_clock_full.json` directly.

## Run instructions

```bash
python src/generate_full_dataset.py
python src/validate_json.py
# then open:
open web/clock_visualizer.html
```
