# Solomonic Clock Combined Roadmap

Last combined: 2026-06-22

This is the canonical execution roadmap for the Solomonic Clock / Solomonic Seals work. It combines:

- `docs/roadmap.md`
- `docs/mvp_mobile_app_roadmap.md`
- `docs/source_texts_indexing_plan.md`
- `docs/solomonic_clock_schema.md`
- `docs/solomonic_clock_runtime_engine.md`
- `docs/solomonic_calendar_expansion_guide.md`
- `docs/lens_differentiation_pass.md`
- `docs/harmonic_time_scale_content_plan.md`
- `docs/pericope_ai_scope.md`
- `docs/life_os_architecture.md`
- related Pericope handoff and contract docs

The detailed source documents remain useful for domain specifics. This document owns the combined order of work.

## Current Baseline

- The product is now a clock-centered web experience with drawer-owned guidance, controls, scripture, ritual, history, and journey-track details.
- Lenses exist for `Base`, `Scripture`, `Ritual`, `Esoteric`, and `History`.
- Daily guidance, weekly arc, scripture reader, daily bundle, explainability panels, and journey-track practice/reflection state exist.
- Guests use browser-local daily history; account users can sync through the existing history path.
- Source texts are indexed through `data/source_texts_index.json`.
- Scripture and source-text APIs exist in `src/webserver.py`.
- Initial read-only SVG seal sprite rendering exists.
- The product still needs a live runtime state engine, schema normalization, stronger validation, mobile readiness, and a structured guidance backend.

## Immediate Next Milestone

Finish the Foundation to Experience MVP bridge.

1. Fix Psalm and Proverb reader completeness as a high-priority experience blocker:
   - the Psalm tab must show the complete selected Psalm, not only the anchor sentence or citation verse,
   - the Proverb tab must show the complete selected proverb chapter or configured long wisdom passage,
   - `/api/clock/content-bundle` should carry both the selected anchor (`ref` / `text`) and the full reader body (`chapter_ref` / `full_text`) so the drawer does not depend on a second lookup with different Psalm numbering,
   - the drawer reader should render the full body by default while preserving the anchor verse in explainability and selection rationale,
   - add regression tests that assert the reader contains later verses from the same Psalm/Proverb, not just the opening sentence.
2. Adopt the harmonic time-scale model in `docs/harmonic_time_scale_content_plan.md`:
   - keep `now` fixed as the center of ordinary interaction,
   - resolve minute, hour, day, week, month/lunation, season, year, and later life scales into one moment vector,
   - compare the current `MomentVector` with an optional private `BirthVector` without reducing Chinese, Western, or other enabled traditions to interchangeable labels,
   - let signed-in users create a private Personal Time Profile with birth-date/time precision, birth location, separate current location, enabled traditions, consented observation fields, export, recalculation, and deletion,
   - make every integrated reading produce an explainable practice, restraint, timing boundary, and examination with adopt/adapt/defer/reject states,
   - distinguish measured physical influence, supported biological timing, mixed associations, historical symbolism, and generated personal meaning so governing weight follows evidence,
   - separate solar-cycle, flare, particle, CME, solar-wind, global geomagnetic, and local magnetic signals, with a consented observation path for testing personal sleep/HRV associations,
   - make ring interaction explain the active moment instead of swapping unrelated titles,
   - preserve provenance across monastic, Solomonic, alchemical, musical, Taoist, astronomical, and modern formation content.
3. Apply the medieval manuscript visual language to the clock through `docs/manuscript_clock_execution_plan.md`:
   - make Psalm and Proverb reader pages the richest illuminated surfaces,
   - treat drawer counsel and pentacle detail as manuscript marginalia and framed source notes,
   - use restrained manuscript cues on the live clock face so labels stay legible,
   - keep controls functional rather than decorative,
   - add visual regression checks for desktop and mobile drawer states before publishing.
4. Make `web/clock.js` consume `/api/clock` dynamically instead of relying on bundled JSON.
5. Treat `data/solomonic_clock_full.json` as symbolic lookup data, not as the runtime source of truth.
6. Start the real-time runtime engine:
   - local time,
   - sunrise and sunset,
   - planetary day,
   - planetary hour,
   - solar longitude,
   - zodiac sign and degree,
   - five-degree Solomonic sector resolution.
7. Run the data consistency pass:
   - resolve the 43-vs-44 pentacle tradition mismatch,
   - fix verse parsing for lists, ranges, and legacy shorthand,
   - add tradition profiles or choose one canonical tradition,
   - clean source indexing artifacts,
   - add validation for pentacle/scripture/schema joins.
8. Strengthen the current product surface:
   - deepen `History` from preview arc toward a Providence-style outer band,
   - keep lens differentiation visible past the first screen,
   - preserve drawer ownership while keeping the radial clock primary.
9. Begin mobile web readiness in parallel:
   - phone,
   - Samsung Fold cover,
   - Samsung Fold inner screen,
   - Android TV / remote focus.

## Phase 1: Foundation

Goal: make data, scripture, contracts, and service ownership stable enough for live runtime and guidance work.

Deliverables:

- Complete the scripture mapping baseline.
- Normalize Psalm numbering across Vulgate and Hebrew references.
- Preserve missing canonical Psalm slots instead of hiding them behind derived correspondences.
- Add Latin/Vulgate excerpts for expanded mappings.
- Optionally add a `Secrets of the Psalms` CSV for side-by-side comparison.
- Keep Pericope-first runtime scripture access with file fallback.
- Clean indexed source text artifacts and strip archive boilerplate.
- Normalize `data/solomonic_clock_full.json` toward:
  - `metadata`
  - `planets`
  - `zodiac`
  - `sectors`
  - `pentacles`
  - `scripture`
  - `canonicalHours`
  - `lifeDomains`
  - `virtues`
  - `practiceLibrary`
  - `wisdomGraph`
  - `wisdomIndex`
  - `narrativeTemplates`
  - `mentors`
- Keep compatibility shims until `web/clock.js` and related scripts no longer depend on `layers.*`.
- Add validation for:
  - 72 sector continuity,
  - 12 zodiac spans,
  - 6 sectors per sign,
  - sector-to-pentacle joins,
  - scripture reference existence,
  - canonical-hour coverage,
  - life-domain coverage,
  - virtue reference validity,
  - practice-library coverage,
  - wisdom-graph edge validity,
  - wisdom-index coverage,
  - Pericope chunk metadata completeness.
- Define explicit service boundaries:
  - Clock Service,
  - Virtue Engine,
  - Wisdom Service / PericopeAI,
  - Guidance Service,
  - History Service.

## Phase 2: Experience MVP

Goal: make the clock a live instrument and make the current experience reliable across desktop and mobile-class surfaces.

Deliverables:

- Ship the real-time clock engine.
- Add runtime modules:
  - `planetary_day_engine`,
  - `planetary_hour_engine`,
  - `solar_event_engine`,
  - `solar_longitude_engine`,
  - `sector_resolver`,
  - `clock_state_builder`.
- Use sunrise/sunset to calculate day and night planetary hours.
- Use solar longitude to resolve zodiac sign, degree, and active five-degree sector.
- Build a compact runtime state object for the UI, guidance engine, election engine, oracle generator, and Pericope context injection.
- Refresh runtime state on a fixed cadence while keeping visual motion separate from symbolic lookup resolution.
- Add instrument-style animation:
  - slow solar rotation,
  - stepped canonical-hour movement,
  - active-sector glow,
  - subtle center-seal pulse.
- Add daily profile card.
- Add reading depth toggle: `Short`, `Medium`, `Long`.
- Add explainability baseline.
- Add local long-read support.
- Continue lens differentiation:
  - `Base` is operational and practice-oriented,
  - `Scripture` is anchor-text and study-oriented,
  - `Ritual` is timing and enactment-oriented,
  - `Esoteric` is correspondence and provenance-oriented,
  - `History` is continuity and pattern-oriented.
- Deepen `History` with better recorded-day summaries, pattern clustering, reflection continuity, and closeout continuity.

Mobile readiness deliverables:

- Prioritize center guidance on phone-sized screens.
- Keep the clock visible as the primary instrument.
- Move dense controls into drawer or bottom-sheet flows.
- Support tap-to-select rings, life domains, and history nodes.
- Ensure drawer sections are readable, scrollable, and non-overlapping on narrow screens.
- Add explicit responsive modes for:
  - regular Android phone,
  - Samsung Fold cover,
  - Samsung Fold inner screen,
  - Android TV.
- On Fold inner screens, evaluate two-pane clock plus drawer layout.
- On Android TV, replace drawer-heavy interaction with focusable panels and remote-friendly navigation.
- Add Playwright coverage for phone, Fold, compact tablet, and TV-sized layouts.
- Add focus-order checks for TV / remote navigation.

## Phase 3: Guidance Engine

Goal: turn guidance from prose into a structured, explainable engine.

Deliverables:

- Add guidance layers:
  - context layer: day, hour, sign, degree band, active pentacle, spirit, optional lunar state,
  - domain layer: work, relationships, money, travel, health, home, study, conflict/protection,
  - output layer: `theme`, `do`, `avoid`, `watch_for`, `vow`.
- Add decision strength mechanics:
  - confidence,
  - severity,
  - alignment summary,
  - if/then triggers,
  - conflict warnings.
- Add guidance modes:
  - `Brief`,
  - `Operational`,
  - `Devotional`,
  - `Strategic`.
- Add framing controls:
  - `conservative`,
  - `balanced`,
  - `opportunistic`,
  - `strategic`.
- Add election-window scoring for action categories:
  - travel,
  - negotiation,
  - communication,
  - creative work,
  - relationship repair,
  - financial decisions,
  - study,
  - contemplation.
- Share one scoring model across current guidance, election windows, and forecast bars.
- Add micro-ritual output that can be completed in roughly two minutes.
- Add `today_vow`, closeout state, decision outcome, and emotional tone capture.
- Keep implementation local-first before database work.

Pericope integration deliverables:

- Keep the clock as the temporal and symbolic context source.
- Let Pericope compose final user-facing prompts over time.
- Add a Pericope-side prompt composer that consumes:
  - clock context,
  - selected author,
  - author domain and corpus tags,
  - user/session history,
  - tone and prompt diversity rules.
- Normalize initial mentor profiles.
- Manually tag the initial mentor corpus with virtues and life domains.
- Build `GET /wisdom/virtue/{virtue}`.
- Build `POST /lifeos/guidance`.
- Use scripture-first ranking.
- Avoid graph database requirements for the MVP.
- Recommended initial mentors:
  - Solomon,
  - Augustine,
  - Marcus Aurelius.

## Phase 4: Follow-Through

Goal: make guidance carry through the day instead of ending at the first reading.

Deliverables:

- Add weekly arc mode.
- Add vow selection.
- Add closeout logging with `done`, `not_done`, and `deferred`.
- Add centered guidance cards.
- Add `Why this guidance?` reasoning panels.
- Add light local personalization.
- Store daily and hourly oracle records.
- Add `act`, `delay`, and `prepare` recommendations.
- Add opportunity alerts as optional secondary hooks.
- Add mobile daily opening and closeout flows optimized for short sessions.
- Add mobile-friendly reflection entry and review.
- Add reminders for:
  - daily opening,
  - midday practice,
  - evening closeout.
- Add weekly review prompts with carry-forward guidance.
- Add export for user history and reflection logs.
- Keep language formation-oriented rather than percentage/progress-oriented.

## Phase 5: Assistant And Advanced UI

Goal: make the clock usable as a constrained counsel system and advance the radial interface.

Deliverables:

- Add Ask-the-Clock counsel flows.
- Add guided prompts for:
  - decision,
  - communication,
  - travel,
  - negotiation,
  - clarity,
  - repair.
- Add Pericope clock-context injection.
- Add virtue-index and `POST /lifeos/guidance` endpoints where appropriate.
- Add 24-hour opportunity timeline.
- Add election-window panels and alerts.
- Add oracle publishing routes:
  - stable dated daily pages,
  - hourly mini-oracles,
  - feed/archive reuse.
- Add energy forecast visualization.
- Add Council-of-Voices persona views over the same state model.
- Add rose-window concentric UI layers:
  - Solomonic sector ring,
  - zodiac ring,
  - Life Wheel / virtue ring,
  - canonical-hour ring,
  - center scripture/guidance panel.
- Align all radial layers to one shared angular reference model.
- Turn the center seal into a six-wedge control surface:
  - `Guidance`,
  - `Practice`,
  - `Reflection`,
  - `Timeline`,
  - `Forecast`,
  - `Mentor`.
- Keep the Guidance Compass inside `Guidance` mode:
  - `Reflect`,
  - `Learn`,
  - `Act`,
  - `Restore`.
- Add Virtue Compass overlay:
  - `Prudence`,
  - `Love`,
  - `Temperance`,
  - `Fortitude`,
  - with `Faith`, `Hope`, and `Justice` as inner modifiers.
- Add Virtue Forecast arc/panel.
- Add dynamic pentacle renderer:
  - driven by data,
  - layered output,
  - responsive to mode,
  - reused in center overlay, study view, and mentor reflection mode.
- Keep support content in tooltips, hover states, accordions, and drawer panels rather than stacked open prose.

## Phase 6: Life OS

Goal: extend the clock from a daily counsel system into a formation-oriented Life OS.

Deliverables:

- Add seven life domains:
  - mind,
  - body,
  - relationships,
  - stewardship,
  - vocation,
  - household,
  - contemplation.
- Implement the Life Wheel as its own radial ring.
- Add domain focus, discipline prompts, and reflection prompts.
- Add Virtue Engine that resolves sector, planet, canonical hour, life domain, and scripture into one virtue vocabulary.
- Add Wisdom Graph connecting:
  - sectors,
  - planets,
  - virtues,
  - domains,
  - scripture,
  - shadows,
  - practices,
  - mentors.
- Keep virtues as the primary graph hub.
- Add Wisdom Index that keeps Christ and Scripture primary while ranking mentors and practices beneath that canonical core.
- Add Life Training Engine.
- Add Rule-of-Life Generator.
- Add Daily Guidance Narrative Engine with `short`, `medium`, and `long` depth modes.
- Add Mentor Layer over the fixed guidance structure.
- Add Daily Opening ritual:
  - reveal day,
  - present mentor reflection,
  - present scripture anchor,
  - capture user intention,
  - seed timeline entry.
- Add moral architecture filter:
  - truth,
  - love,
  - humility,
  - stewardship,
  - justice,
  - discipline,
  - faith.
- Treat AI as advisor rather than authority.
- Add reflection journaling and moral review loops.
- Add formation loops based on wisdom and identity, not shallow gamification.

## Phase 7: Rule Of Life And Long-Range Formation

Goal: make the present moment visible and explainable inside weekly, monthly, seasonal, annual, multi-year, decade, lifespan, and era scales.

Deliverables:

- Implement the shared harmonic time-scale contract and moment vector.
- Keep the ordinary clock anchored to `now`; require an explicit visible mode for historical or forecast offsets.
- Add canonical-hours engine.
- Add 72-sector guidance engine:
  - behavioral archetype,
  - shadow,
  - virtue,
  - correction,
  - scripture mapping.
- Add Life Wheel scoring:
  - event impacts,
  - practice completion,
  - reflection,
  - neglect decay,
  - balance bonuses,
  - alignment multipliers,
  - weekly normalization.
- Keep scoring explainable by cause, impact size, and source.
- Add Providence Timeline:
  - daily guidance,
  - practice,
  - reflection,
  - life-score changes,
  - narrative milestones.
- Add Providence Map:
  - virtue-colored constellation around the clock,
  - orbit bands by age,
  - clustering for long-range history.
- Add Virtue Forecast Engine for:
  - next 6 hours,
  - next 24 hours,
  - next 7 days,
  - weekly virtue-season summaries.
- Add weekly summaries.
- Add monthly pattern detection.
- Add actual lunation, astronomical season, and annual-return layers.
- Add source-bearing content libraries for minute, hour, day, week, month, season, and year.
- Add user-authored multi-year, decade, and lifespan chapter boundaries with editable, private-by-default narrative.
- Add sourced era context without conflating documented history with esoteric age systems.
- Add harmonic resolution across scales:
  - resonance,
  - counterpoint,
  - tension,
  - modulation,
  - return.
- Use musical ratios and golden-ratio/Fibonacci structures only where their role is explicit; do not fabricate calendar or life-stage boundaries from them.
- Add Life Wheel history views.
- Add domain-targeted scripture selection.
- Add deeper guidance by virtue/domain imbalance.
- Add richer formation loops, mentor personas, narrative life mapping, wisdom-graph traversal, and wisdom-index authority resolution.

## Mobile Roadmap Overlay

Mobile work should follow the web model unless a deliberate native rewrite is chosen.

1. Mobile Web Readiness:
   - phone, Fold cover, Fold inner, Android TV.
2. Installable Mobile MVP:
   - choose PWA, Capacitor, React Native, or Flutter.
   - default preference is PWA or Capacitor unless native interaction needs force a rebuild.
3. Mobile Ritual + Formation:
   - daily opening,
   - closeout,
   - reflection,
   - reminders,
   - weekly review.
4. Expansion:
   - offline full-library search,
   - cross-references,
   - thematic maps,
   - audio / guided reading,
   - push scheduling,
   - device sync,
   - native share cards.

Success criteria:

- Users can open on a phone and understand today's guidance without opening dense panels first.
- Ring selection and drawer navigation work cleanly by touch.
- Fold cover behaves like a polished narrow phone layout.
- Fold inner uses the extra screen area.
- Android TV works without a mouse.
- Cited scripture and source excerpts remain available offline.
- Practice, reflection, closeout, and journey-track history persist locally and sync when available.
- Mobile does not fork the product model unless that decision is explicit.

## Source Text And Scripture Track

This track supports every phase.

- Index directly from the Pericope corpus folder when possible instead of copying text.
- Keep `data/source_texts_index.json` as the source library handoff artifact.
- Export optional CSV for inspection.
- Preserve stable section IDs and character offsets.
- Add search by keyword and phrase.
- Add filtering by source, section, and heading.
- Add cross-references for Psalms and ritual mapping.
- Validate:
  - no content loss around headings,
  - stable IDs across reruns,
  - missing verses,
  - numbering mismatches,
  - range truncation,
  - duplicate Psalm policy.

## Calendar And Ritual Timing Track

This track begins during Phase 2 and matures through Phase 5.

Build order:

1. Data consistency pass:
   - tradition profile,
   - mapping parity,
   - verse parser fix.
2. Planetary-hour engine and live active correspondence endpoint.
3. Rule engine and ritual window finder.
4. Citation drawer and tradition switcher.
5. Decan mode and advanced filters.

Features:

- `traditions` model for 43-vs-44 pentacle variants.
- `correspondences` model for planet/day/hour metadata.
- `calendar_rules` model for event eligibility and recommendations.
- Ritual window finder by intent.
- Source citation drawer for ring segments.
- Tradition switcher.
- Optional decan layer mode.

## Pericope Roadmap Overlay

Pericope should remain the Wisdom Service, not the owner of clock math, timeline persistence, or frontend orchestration.

Phase 1: MVP Integration

- Normalize a small mentor set into profiles.
- Manually tag initial corpus chunks.
- Build `GET /wisdom/virtue/{virtue}`.
- Build `POST /lifeos/guidance`.
- Add scripture-first ranking.
- Avoid graph database dependency.

Phase 2: Scalable Ingestion

- Add automated or reviewer-assisted virtue tagging.
- Build ingestion pipeline for new authors.
- Generate mentor profiles from author descriptors.
- Improve retrieval by virtue, domain, and theme.

Phase 3: Advanced Reasoning

- Add Wisdom Graph-backed traversal.
- Add pattern-aware mentor selection.
- Add graph-native storage only if needed.
- Add richer comparative mentor outputs.

## Publishing Rule

Use this document for roadmap sequencing. Keep the source docs for details, contracts, and implementation notes. When a source roadmap changes, update this combined roadmap in the same pull request so planning does not split again.
