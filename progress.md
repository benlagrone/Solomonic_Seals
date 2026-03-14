Original prompt: go to next in commitment

2026-03-12
- Added lens architecture to the clock UI with top-bar controls (`Base`, `Scripture`, `Ritual`, `Esoteric`, `History`).
- Moved lens meaning onto the instrument surface via center plaque, lens focus halo, and ring-local annotations.
- Added a collapsible details drawer so the right panel is secondary instead of primary.
- Implemented a true `Scripture` core-ring overlay with curved scripture text and markers.
- Implemented a true `Ritual` planetary-ring overlay with day/hour bands plus a timing dial for current and next hourly windows.
- Implemented an `Esoteric` spirit-ring overlay with active sector text, correspondence banding, and spirit/correspondence/pentacle badges tied to the live state.

Testing / acceptance
- `node --check web/clock.js`
- Acceptance is container-served on `http://127.0.0.1:8086/web/clock_visualizer.html`
- Rebuilt acceptance container via `docker compose -f docker-compose.yml up -d --build solomonic-clock`
- Verified served assets on `:8086` are on `v=20260312-3`
- Verified Ritual lens in a real browser session and captured `output/playwright/.playwright-cli/page-2026-03-12T22-45-49-845Z.png`
- Verified Esoteric lens in a real browser session on asset version `v=20260312-6` and captured `output/playwright/.playwright-cli/page-2026-03-13T00-56-19-210Z.png`

Known residual issues
- Existing 404 for `/favicon.ico`
- The Esoteric overlay is present and testable on the instrument, but its most legible elements are still the correspondence band and badges rather than a heavy symbolic redraw of the spirit ring.

Next likely step
- Strengthen `History` from preview arc toward a more explicit Providence-style outer band.
- Optionally deepen `Esoteric` further with stronger active-sector wedge treatment or glyph-specific correspondences if the current overlay still feels too subtle.
