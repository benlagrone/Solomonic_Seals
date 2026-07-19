# Manuscript Clock Execution Plan

Created: 2026-07-19

Purpose: apply the richer medieval manuscript visual language to the Solomonic Clock without burying the instrument under decoration. The style should make the deep reading surfaces feel like illuminated wisdom texts while keeping the live clock legible and controllable.

## Design Principle

Use manuscript treatment by depth:

- Full reading surfaces get the richest treatment.
- Counsel and pentacle detail get framed manuscript panels and marginalia.
- The live clock face gets restrained active-state cues only.
- Controls stay functional and modern enough to scan quickly.

## Priority Order

1. Fix content completeness first: Psalm and Proverb tabs must receive full reader text before visual polish is evaluated.
2. Apply manuscript style to Psalm and Proverb reader pages.
3. Apply manuscript frame treatment to Counsel and active pentacle detail.
4. Add restrained manuscript cues to the clock readout and selected clock elements.
5. Refine drawer marginalia and section hierarchy.
6. Validate across desktop, mobile drawer, Fold-style widths, and TV/large display modes.

## Phase 1: Reading Pages

Target files:

- `web/clock_visualizer.html`
- `web/style.css`
- `web/clock.js`

Work:

- Keep `.scripture-illumination`, `.illuminated-initial`, `.illuminated-heading`, and `scriptorium-initials/v1/frame-gold.svg` as the base system.
- Make Psalm and Proverb tabs render as manuscript reading pages:
  - full passage body,
  - illuminated first letter,
  - readable serif text,
  - rubric reference line,
  - quiet parchment/dark-vellum panel,
  - no nested scroll inside the reader when the drawer itself scrolls.
- Add verse-number styling only if the source text preserves verse markers reliably.
- Keep `Speak` and `Study Passage` as plain controls below the reading, not decorative manuscript blocks.

Acceptance:

- Psalm tab visibly contains the full selected Psalm.
- Proverb tab visibly contains the full selected proverb chapter or configured long wisdom passage.
- The first letter treatment appears once per reading, not on every paragraph.
- Mobile text remains readable without horizontal overflow.

## Phase 2: Counsel And Pentacle Panels

Target files:

- `web/clock_visualizer.html`
- `web/style.css`
- `web/clock.js`
- `data/pentacles.json`

Work:

- Introduce shared classes:
  - `.manuscript-panel`
  - `.manuscript-cartouche`
  - `.manuscript-rubric`
  - `.manuscript-marginalia`
  - `.manuscript-source-note`
- Apply `.manuscript-panel` to the Counsel meditation block.
- Treat the active pentacle as a framed source note:
  - title,
  - planet,
  - pentacle number,
  - purpose/focus,
  - source/provenance line,
  - optional seal preview when available.
- Use marginalia styling for explanatory notes such as why a citation or pentacle was selected.

Acceptance:

- Counsel feels more like a discovered wisdom page than a dashboard card.
- Pentacle detail is visually important but does not compete with the main clock.
- Notes are quieter than the primary counsel.

## Phase 3: Live Clock Accents

Target files:

- `web/style.css`
- `web/clock.js`

Work:

- Apply a compact manuscript cartouche to `.clock-readout`.
- Use small rubric/gold accents for:
  - current day/planet,
  - active planetary hour,
  - active pentacle title,
  - selected ring/sector label.
- Do not illuminate every SVG ring label.
- Do not add ornate frames inside the SVG geometry except for active/selected emphasis.

Acceptance:

- The clock remains readable at a glance.
- Selected state is enhanced, not visually noisy.
- The primary clock geometry still reads as an instrument.

## Phase 4: Drawer Hierarchy

Target files:

- `web/clock_visualizer.html`
- `web/style.css`

Work:

- Keep top drawer tabs as clear controls.
- Use manuscript heading treatments for important section headers only.
- Convert secondary explanatory prose into marginalia blocks with left border/rubric accents.
- Avoid using illuminated initials on buttons, chips, tab labels, or dense metadata.

Acceptance:

- Visual hierarchy is top controls, primary reading/counsel, secondary notes, then actions.
- The drawer no longer reads as a stack of equal-weight cards.
- No scroll-within-scroll is introduced.

## Phase 5: Validation

Required checks:

- Contract tests for presence of manuscript classes on intended surfaces.
- Browser screenshots for:
  - desktop drawer open on Counsel,
  - desktop drawer open on Psalm,
  - desktop drawer open on Proverb,
  - mobile drawer open on Psalm,
  - mobile drawer open on Counsel.
- Text fit checks:
  - no overlapping clock labels,
  - no clipped button text,
  - no horizontal overflow in reader panels.
- Content checks:
  - Psalm and Proverb readers contain more than the anchor sentence,
  - Speak reads the active full reader content, not only the excerpt.

## Non-Goals

- Do not redesign the whole drawer again before content completeness is fixed.
- Do not make controls look like manuscript headings.
- Do not put ornate illuminated initials on every small label.
- Do not add heavy visual frames directly to every SVG clock sector.

## Implementation Notes

- Prefer class-based styling over inline styles.
- Reuse the existing `frame-gold.svg` asset.
- Keep color palette balanced: gold/rubric/lapis accents over the existing dark clock surface.
- Preserve accessibility: semantic headings, readable contrast, visible focus states, and conventional controls.
