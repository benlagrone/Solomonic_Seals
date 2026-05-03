# Lens Differentiation Pass

Goal: make `Base`, `Scripture`, `Ritual`, `Esoteric`, and `History` feel like materially different readings of the same clock instead of the same page with relabeled captions.

## Core Rule

Each lens must answer a different primary question:

- `Base`: what should I do today?
- `Scripture`: what does today's text actually say?
- `Ritual`: when and how should I enact this?
- `Esoteric`: what symbolic system maps this day?
- `History`: how has this pattern unfolded over time?

If two lenses show the same first three information blocks, the differentiation pass is not complete.

## Control Model

The interaction model has three axes that need clearer separation:

- `lens` owns interpretation, layout, and ring emphasis.
- `mode` owns action state in the center and daily workflow.
- `presentationMode` stays secondary and should not dilute lens identity.

Practical rule:

- let `lens` drive the first screenful,
- let `mode` modify action behavior,
- do not let `mode` silently collapse all lenses back into one shared surface.

## Phase 1

Objective: make the first screenful unmistakably different by lens.

Implementation targets:

1. Replace the generic surface summary with per-lens surface builders.
2. Add a visible lens contract on the surface:
   - `Question`
   - `Ring`
   - `Action`
   - primary module chips
3. Tighten drawer ownership so each lens exposes a different section stack.
4. Make the lens, not the mode, own focus-ring priority except where `Base` intentionally yields to mode.
5. Add visible ring annotations so the visual changes explain themselves.

Expected outcomes:

- `Base` feels operational and practice-oriented.
- `Scripture` feels anchor-text and study oriented.
- `Ritual` feels timing and enactment oriented.
- `Esoteric` feels correspondence and provenance oriented.
- `History` feels continuity and pattern oriented.

## Phase 2

Objective: deepen the lens-specific content so differentiation survives past the first screenful.

Implementation targets:

1. Give each lens a dedicated primary drawer stack with less shared prose.
2. Make the center overlay text more lens-specific and less generic.
3. Reduce repeated explanatory copy across surface, center, and drawer.
4. Move lens-specific secondary surfaces deeper into the page:
   - study movement for `Scripture`
   - timing sequence for `Ritual`
   - provenance and correspondences for `Esoteric`
   - continuity review for `History`

## History Deepening Follow-On

`History` will still need a second commitment after phase 1:

- more meaningful recorded-day summaries
- pattern clustering across recent days
- stronger continuity with reflections and closeouts
- clearer movement from current day into Providence Map review

## Acceptance

Phase 1 is complete only if all of the following are true:

1. The surface title/body/question/ring/action differ by lens.
2. The visible drawer section sets differ by lens.
3. Ring emphasis is lens-led rather than being broadly overridden by mode.
4. A user can explain what each lens is for without reading documentation.

Phase 2 is complete only if:

1. repeated copy is substantially reduced,
2. the center text and lower-page content also diverge by lens,
3. `History` no longer feels like a weaker variant of `Base`.
