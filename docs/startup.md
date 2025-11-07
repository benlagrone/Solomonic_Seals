Perfect — here’s how to hand off your Solomonic Clock JSON project to GPT Codex (inside VS Code) so it can auto-generate and extend the data, build scripts, or visualize it.
Below is a startup.md hand-off file you can drop straight into your repo for Codex to read.

⸻

🧠 Solomonic Clock of Spheres – Codex Handoff

Project Goal

Build a structured JSON data generator and visualizer for the Solomonic Clock of Spheres — a symbolic calendar that layers:
	1.	1 Master Seal – fixed hub (center)
	2.	9 Celestial Seals – slow cycle (ages / aeons)
	3.	44 Planetary Pentacles – weekly / hourly cycle
	4.	72 Spirit Seals – yearly / zodiacal cycle

Total: 126 nodes, rendered in a radial clock with concentric rotation.

⸻

Deliverables

Task	Output	Description
generate_full_dataset.py	JSON file (solomonic_clock_full.json)	Script that expands the sample JSON to all 72 zodiac sectors and 44 planetary pentacles.
validate_json.py	Console output	Confirms node counts, field completeness, and valid JSON structure.
clock_visualizer.html	Interactive D3.js radial graph	Loads the JSON and animates rotations of each layer according to relative speeds.
readme.md	Documentation	Explains data structure, color coding, rotation rules, and how to extend or theme the visual.


⸻

Starting Files

Place these in /src/ before Codex starts generating:
	1.	solomonic_seed.json
Contains the partial structure (the “pattern you can keep extending”).
Codex will clone and expand it to full 126-node data.
	2.	startup.md (this file).
Gives Codex its working brief.

⸻

Codex Instructions

Prompt to use in VS Code:

You are GPT Codex.  
Goal: Expand the Solomonic Clock dataset and build visualization scaffolding.  
1. Read ./src/solomonic_seed.json  
2. Generate ./src/generate_full_dataset.py that:
   - loops through 12 zodiac signs × 6 sectors = 72 spirit sectors
   - populates each with sector number, zodiac, 5° range, and placeholder spirit name
   - writes result to ./data/solomonic_clock_full.json
3. Create ./src/validate_json.py to count total objects and verify integrity.
4. Create ./web/clock_visualizer.html + ./web/clock.js using D3.js
   - Draw concentric circles for layers (core, celestial, planetary, spirit)
   - Animate rotation speeds: 0, 0.001, 0.1, 1 radians/sec
   - Highlight the current active seal per layer based on system time.
5. Update README with how to run:  
   `python generate_full_dataset.py && python validate_json.py`  
   then open `web/clock_visualizer.html` in browser.


⸻

Repository Layout

solomonic-clock/
│
├── data/
│   └── solomonic_clock_full.json
│
├── src/
│   ├── solomonic_seed.json
│   ├── generate_full_dataset.py
│   ├── validate_json.py
│   └── startup.md   ← (this file)
│
└── web/
    ├── clock_visualizer.html
    └── clock.js


⸻

Notes for Codex
	•	Use plain JSON, no external APIs.
	•	The visualization should be static (runs locally in browser).
	•	Rotation speeds and colors come from JSON metadata.
	•	Provide commented code for clarity; no esoteric frameworks.

⸻

Would you like me to include the actual Python seed-expansion script inside this handoff (so Codex can run and see expected logic immediately)?

## Docker deployment

1. Ensure the external network exists: `docker network create fortress-phronesis-net` (skip if already present).
2. Build the image: `docker compose build`.
3. Start the container: `docker compose up -d`.
4. Visit `http://localhost:8085/web/clock_visualizer.html` to view the clock (the container serves the repository at `/app`).
5. Regenerate the dataset manually (optional): `docker compose run --rm solomonic-clock python src/generate_full_dataset.py`.
