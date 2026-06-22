# MVP Mobile App Roadmap

Last updated: 2026-06-06

## Current Baseline

The original mobile plan assumed a simple read + ritual prototype. The product has since moved to a clock-centered web experience with:

- drawer-owned guidance, controls, scripture, ritual, history, and journey-track details;
- lenses for `Base`, `Scripture`, `Ritual`, `Esoteric`, and `History`;
- daily guidance, weekly arc, scripture reader, daily bundle, and explainability panels;
- journey-track practice/reflection state stored under `journeyTracks`;
- guest browser-local history plus account-capable history sync.

The mobile plan should therefore start from the current web architecture instead of treating mobile as a separate first implementation.

## Target Screens

Design and QA should cover four screen families:

| Target | Layout Intent | Primary Constraints |
| --- | --- | --- |
| Regular Android phone | single-column companion | center guidance first, clock second, drawer as full-width bottom/sheet flow |
| Samsung Fold cover screen | narrow phone mode | avoid tiny ring targets, keep drawer actions thumb-friendly, no horizontal overflow |
| Samsung Fold inner screen | compact tablet mode | keep the clock and drawer visible together when space allows; support portrait and landscape |
| Android TV | 10-foot display | large text, remote/focus navigation, no hover-only controls, reduced density, 16:9 composition |

Representative QA viewports:

- phone portrait: `360x740`, `390x844`, `412x915`
- phone landscape: `740x360`, `844x390`
- Fold cover: test as a narrow/tall phone viewport
- Fold inner: test as a square-ish compact tablet viewport such as `720x650`, plus landscape near `915x720`
- Android TV: design at `960x540` dp, verify `1920x1080`, and preserve 4K readiness

Do not hard-code around one physical device resolution. Fold models vary, and browser CSS pixels depend on device scale. Treat these as acceptance classes and verify on the actual Samsung Fold when available.

## Phase 0 — Foundation Status

Status: mostly complete.

- Source texts are present under `docs/source_texts/`.
- `data/source_texts_index.json` exists and should remain the source library handoff artifact.
- Scripture and source-text APIs exist in `src/webserver.py`.
- Remaining work: document exactly which source bundles are required for offline mobile use and prune any source-text artifacts that should not ship to clients.

## Phase 1 — Mobile Web Readiness

Goal: make the existing clock experience reliable on phone-sized screens before choosing a native wrapper or rewrite.

- Prioritize center guidance on mobile.
- Keep the clock visible as the primary instrument.
- Move dense controls into the drawer.
- Support tap-to-select rings, life domains, and history nodes.
- Ensure drawer sections are readable, scrollable, and non-overlapping on narrow screens.
- Add explicit responsive modes for regular phone, Fold cover, Fold inner, and Android TV.
- On Fold inner screens, evaluate a two-pane mode where the clock remains visible while drawer content sits beside it.
- On Android TV, replace drawer-heavy interaction with focusable panels and remote-friendly navigation.
- Verify `Scripture`, `Ritual`, and `History` lenses on mobile viewport sizes.
- Add Playwright coverage for phone, Fold cover, Fold inner, and TV-sized layouts.
- Add focus-order checks for TV/remote navigation.

## Phase 2 — Installable Mobile MVP

Goal: ship a useful mobile companion without duplicating product logic.

- Choose one install path:
  - **PWA** for fastest path if offline reading, installability, and notifications are enough.
  - **Capacitor** if app-store packaging and native notification hooks are needed while keeping the existing web app.
  - **React Native** only if the interaction model needs a full native rebuild.
  - **Flutter** only if a custom native UI rewrite is intentionally preferred over web reuse.
- Package the clock shell, drawer flows, source index, scripture mappings, and fallback Psalm content for offline use.
- Store daily opening, practice, closeout, reflection, and journey-track state locally.
- Sync history when signed in or when the network returns.
- Preserve citation visibility for every reading and source excerpt.
- For Android TV, treat this as a companion display first: today's guidance, weekly arc, scripture anchor, and history review should be readable from a distance before adding full text-entry flows.

## Phase 3 — Mobile Ritual + Formation

Goal: make mobile use feel like a daily companion, not just a smaller website.

- Add daily opening and closeout flows optimized for short sessions.
- Add mobile-friendly reflection entry and review.
- Add gentle reminders for daily opening, midday practice, and evening closeout.
- Add weekly review prompts with carry-forward guidance.
- Add export for user history and reflection logs.
- Keep language formation-oriented rather than percentage/progress-oriented.

## Phase 4 — Expansion

- Offline full-library search.
- Cross-references and thematic maps.
- Audio or guided reading mode.
- Push notification scheduling for selected practices.
- Device-to-device sync.
- Native share cards for daily counsel or scripture anchors.

## Success Criteria

- Users can open the app on a phone and understand today's guidance without opening dense panels first.
- Clock ring selection and drawer navigation work cleanly by touch.
- Fold cover mode behaves like a polished narrow phone layout.
- Fold inner mode uses the extra screen area instead of simply enlarging the phone layout.
- Android TV mode works without a mouse: focus states are visible, remote navigation is predictable, and text is readable from across the room.
- Users can read cited scripture/source excerpts offline.
- Daily practice, reflection, closeout, and journey-track history persist locally and sync when available.
- The mobile build does not fork the product model from the web clock unless a deliberate native rewrite is chosen.
