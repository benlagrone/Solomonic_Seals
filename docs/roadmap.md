# Solomonic Clock Unified Roadmap

Goal: build one coherent roadmap for product experience, scripture alignment, and esoteric enrichment so the clock can deliver grounded daily guidance with transparent citations.

## Workstream A: Core Clock Experience

- Canonical text links: reference the Key of Solomon, Ars Goetia, or Psalms per seal and surface citations in tooltips or side panels.
- Liturgical layer: align planetary days with historic devotions or canonical hours to suggest daily meditations.
- Astro-calendar tie-ins: connect zodiac degrees to equinoxes, decans, or notable astronomical events with short blurbs.
- Mystical commentary: curate quotes from grimoires, Sufi cosmology, or Kabbalistic texts and display them when a seal is active.
- Ritual hooks: list recommended intentions, incense, or planetary hour guidance for practical timing.
- Symbol imagery: link each seal to sigil artwork or planetary glyphs to show thumbnails on hover.
- SVG seal rendering: display Solomonic seals directly inside the clock rings via reusable SVG symbols.
- Dynamic pentacle SVG system: generate pentacles procedurally from data so center seals can respond to planet, virtue, scripture, and active mode instead of relying only on static assets.
- Rose-window interface: compose Solomonic sectors, zodiac signs, life domains, canonical hours, and center guidance as concentric SVG layers with Chartres-inspired proportional spacing and fixed ring geometry (`72 / 12 / 7 / 8 / center`) instead of stacked panels.
- Radial-first information architecture: keep the clock as the primary meaning surface and demote verbose explanation into tooltips, hover states, and accordion panels.
- Instrument-style motion: use restrained solar drift, hour-ring stepping, active-sector glow, and a subtle center-seal pulse so the clock feels alive without becoming theatrical.
- Historical timeline: annotate the yearly ring with publication dates, festivals, or related milestones.

### SVG Seal Rendering Track (Advise-Only)

Detailed render handoff: see `docs/pentacle_svg_system.md`.

1. Build canonical seal assets: normalize each seal to a consistent SVG `viewBox` and naming scheme.
2. Ship a sprite system: store seals as `<symbol>` entries and render with `<use>` in `web/clock.js`.
3. Place inside rings: clip seals to pentacle sectors (`clipPath`) and keep linework readable at small sizes.
4. Active seal focus mode: show a larger center/side-panel seal for the currently active pentacle.
5. Interaction modes: support `minimal` (small marks) and `study` (full detail + citations), both read-only.
6. Performance guardrails: reuse symbols, avoid per-frame path regeneration, and animate only opacity/stroke.
7. Add a dynamic pentacle renderer:
   - drive SVG output from pentacle data rather than static files only,
   - support layered output (`outerRing`, `textRing`, `symbolRing`, `centerGeometry`),
   - keep planet, virtue, scripture, and mode available as render inputs.
8. Normalize pentacle render metadata:
   - support `rings`, `centerShape`, `scriptureRing`, and `symbols`,
   - allow the canonical schema or `data/pentacles.json` to remain the source of render truth.
9. Reuse the same renderer in three places:
   - center overlay,
   - expanded guidance/study view,
   - mentor reflection mode.
10. Keep rendering aligned with the center-seal control surface:
   - the renderer should respond to `Guidance`, `Practice`, `Reflection`, `Timeline`, `Forecast`, and `Mentor` modes without becoming a separate UI system.

Status update (March 10, 2026):
- Implemented initial read-only SVG seal sprite rendering in `web/clock.js` (`<symbol>` + `<use>` pattern).
- Implemented in-ring planetary seal marks and active core focus seal preview in `web/clock.js`/`web/style.css`.
- Remaining for this track: canonical hand-traced assets, optional `clipPath` study-mode polish, and the procedural pentacle renderer that can replace static center-focus assets over time.

### Real-Time Clock Engine Track

Detailed notes: see `docs/solomonic_clock_runtime_engine.md`.

1. Stop treating `data/solomonic_clock_full.json` as a precomputed moment-by-moment source; use it as symbolic lookup data.
2. Compute live runtime state from:
   - local time,
   - sunrise / sunset,
   - planetary hour sequence,
   - solar longitude,
   - zodiac sign and degree,
   - five-degree Solomonic sector resolution.
3. Derive `planetaryDay` from local weekday and `planetaryHour` from solar-hour segmentation and Chaldean order.
4. Use solar longitude to compute:
   - current zodiac sign,
   - degree within sign,
   - sector index,
   - matching sector record from the normalized schema.
5. Build a compact runtime state object for the UI, guidance engine, election engine, oracle generator, and Pericope context injection.
6. Refresh runtime state on a fixed cadence (for example every 60 seconds) and keep visual orbital motion separate from symbolic lookup resolution.
7. Animate the UI like an instrument:
   - slow solar rotation for the outer ring,
   - stepped canonical-hour movement,
   - restrained sector glow and center pulse,
   - future domain-wheel feedback only on state changes.

## Workstream B: Daily Experience and Guidance

- Daily profile card: show day ruler, active pentacle, correspondences (color, metal, angel), and suggested focus.
- Reading depth toggle: `Short` (single verse/excerpt), `Medium` (3-5 verses), `Long` (full chapter or extended section).
- Daily content bundle: combine one psalm + one wisdom excerpt (Proverbs/Ecclesiastes/Wisdom) + one Solomonic source excerpt.
- Explainability panel: show why content was selected today (planet/day/hour/sign rule + source citation), but prefer tooltip and accordion presentation over always-open prose.
- Reflection workflow: add one morning intention prompt, one midday practice prompt, and one evening reflection prompt.
- Weekly arc mode: show 7-day progression instead of isolated day cards.
- Phase-gated memory: start read-only, then add optional vow selection and closeout tracking once the guidance engine is stable.
- Consult the Clock panel: offer guided prompts such as decision, communication, travel, negotiation, and clarity instead of starting from blank chat.
- Opportunity timeline: show the next 24 hours of planetary-hour windows so users can compare `now` versus `later`.
- Election windows: rank the next favorable action windows so the clock can answer `when should I act?`, not only `what is happening now?`.
- Presentation modes: support `Observatory`, `Wisdom`, and `Strategic` views over the same clock state.
- Daily Oracle page: generate a dated counsel artifact from the current clock state so each day has a stable, shareable reading.
- Hourly mini-oracle: generate short timing notes for the current and upcoming planetary hours.

### Pericope Prompt Composition Track

The current landing-state guided prompts are a strong start, but the clock should not remain the final prompt writer forever.

Scaling rule:

- clock should provide temporal and symbolic context,
- Pericope should compose the final user-facing prompts.

Reason:

- the clock is good at `what should be foregrounded now`,
- Pericope is better suited for `which question should this user ask this author next`.

Next-phase shape:

1. Keep the clock endpoint as the context source:
   - `daily_guidance`
   - `weekly_arc`
   - `daily_profile`
   - `content_bundle`
   - `guided_prompts` as an initial fallback / starter set
2. Add a Pericope-side prompt composer that consumes clock context plus:
   - selected author
   - author domain and corpus tags
   - user/session history
   - product tone and prompt diversity rules
3. Split the contract conceptually into:
   - `context_from_clock`
   - `prompts_for_user`
4. Let Pericope gradually outgrow raw clock-authored prompts:
   - first for author-specific prompts,
   - then for session-aware prompts,
   - then for richer thematic and doctrinal variation without repetition.

Practical product rule:

- clock remains the arrival cue engine,
- Pericope becomes the long-term prompt composition layer.

### Guidance Engine Expansion Track

1. Structure guidance as an engine, not a paragraph:
   - `context layer`: planetary day, planetary hour, sign, degree band, active pentacle, spirit, and optional lunar state.
   - `domain layer`: score domains such as work, relationships, money, travel, health, home, study, and conflict/protection.
   - `output layer`: emit `theme`, `do`, `avoid`, `watch_for`, and `vow` fields so every reading is actionable and repeatable.
2. Add decision strength mechanics:
   - `confidence`: increase when signals align (for example, Venus day + Venus hour + Taurus segment).
   - `severity`: indicate whether the user should act decisively, proceed lightly, or simply observe.
   - `if/then triggers`: convert abstract tone into concrete rules such as delayed sending, checklist checks, or timing constraints.
   - `alignment summary`: standardize the top-line verdict as `strong`, `mixed`, or `weak`.
3. Add guidance modes over the same engine:
   - `Brief`: three concise bullets.
   - `Operational`: checklist, controls, and failure modes.
   - `Devotional`: psalm, short petition, and one embodied act.
   - `Strategic`: what to signal, what to conceal, and what to secure, framed as ethical power-awareness rather than manipulation.
4. Add framing controls:
   - `decision amplifier`: let the user choose `conservative`, `balanced`, `opportunistic`, or `strategic`.
   - preserve the same clock state while shifting how strongly the system favors caution, timing, leverage, or documentation.
5. Detect internal contradictions:
   - score supportive alignments and cross-signal tensions such as Venus harmony vs. Mercury logistics.
   - surface a `conflict warning` when the day, hour, sign, or pentacle point in different directions.
   - convert that warning into one concrete modification, not just a vague caution.
6. Add election-timing outputs:
   - score the next 24 hours for action categories such as travel, negotiation, communication, creative work, relationship repair, financial decisions, and study.
   - combine `planetary_hour_weight`, `planetary_day_weight`, `pentacle_theme_weight`, and `zodiac_segment_weight` into a simple ranking model.
   - emit a practical verdict of `act`, `delay`, or `prepare` plus the next better window when relevant.
7. Add micro-ritual outputs:
   - produce a `today_alignment_action` that can be completed in roughly two minutes.
   - keep the action behaviorally concrete: send one message, review one route, organize one area, or verify one document.
8. Add follow-through loops:
   - let the user pick a `today_vow`,
   - surface a later `closeout` state (`done`, `not_done`, `deferred`),
   - record decision, outcome, and emotional tone so the system can spot repeated patterns.
9. Recenter the UI around guidance:
   - make `Today's guidance` the visual center of the clock experience,
   - rotate a concise `Daily Counsel` summary in the center so the current moment has an immediate takeaway,
   - keep provenance, psalms, and rationale in the side panel,
   - add a `Why this?` drill-down that exposes contributing signals without forcing it open.
10. Keep implementation low-drama:
   - normalize data into `time_state`, `entities`, `guidance_rules`, and `psalm_map`,
   - use simple scoring to pick the top 1-3 domains,
   - reuse the same scoring layer for election windows, current guidance, and forecast bars,
   - ship local-first vow/closeout storage with `localStorage` before any database work.
   - treat the clock as a constrained counsel system, not an open-ended horoscope generator.

Planetary day guidance should drive recommendations:

- Saturday (`Saturn`): discipline, boundaries, endurance, banishing, serious/long-term work.
- Sunday (`Sun`): vitality, authority, visibility, confidence, recognition work.
- Monday (`Moon`): dreams, intuition, cleansing, home/family, reflective and adaptive work.
- Tuesday (`Mars`): courage, conflict navigation, decisive action, protection, difficult tasks.
- Wednesday (`Mercury`): study, writing, speech, negotiation, planning, analysis.
- Thursday (`Jupiter`): growth, prosperity, justice, leadership, opportunity and generosity.
- Friday (`Venus`): harmony, relationships, beauty, diplomacy, reconciliation and creative work.

## Workstream C: Scripture Mapping and Text Infrastructure

### Source References

- Key of Solomon commentaries (Mathers, Peterson): canonical baseline for pentacle Psalm assignments.
- Secrets of the Psalms (Godfrey Selig): thematic petition tagging (protection, favor, love, etc.).
- Topical concordances: align Proverbs and wisdom literature passages to spirit/pentacle intent.

### Mapping Workflow

1. Create a master sheet keyed by `planet`, `pentacle_index`, and `spirit_sector`.
2. Log Psalm references from grimoires and record dual numbering (Hebrew vs. Vulgate).
3. Tag Proverbs/wisdom references by pentacle or spirit focus (courage, eloquence, reconciliation, etc.).
4. Add optional cross-book commentary for thematic expansion.
5. Distinguish `primary` citations from clearly labeled `derived` correspondences when the source tradition is silent.

### Data Model

Append scripture metadata to each record:

```json
"scripture": {
  "psalm": {
    "ref": "Psalm 72",
    "tradition": "Key of Solomon",
    "note": "Prayer for righteous rulership"
  },
  "proverb": {
    "ref": "Proverbs 16:3",
    "summary": "Commit your works to the Lord"
  }
}
```

Canonical verse mapping object:

```json
"psalm_mapping": {
  "source_edition": "Vulgate",
  "psalm_number_vulgate": 36,
  "psalm_number_hebrew": 37,
  "verse_range": "3-6",
  "text_excerpt": "Delectare in Domino...",
  "translation": "Delight in the Lord...",
  "link_refs": {
    "vulgate_online": "https://vulgate.org/psalm/36",
    "drb_online": "https://drbo.org/chapter/21036.htm"
  }
}
```

Store empty objects where references are pending so validation catches missing coverage.

When a pentacle has no Psalm citation in source tradition, preserve the missing primary slot and attach either a non-Psalm/grimoire citation under `supplemental_references` or a clearly labeled `derived_correspondence` keyed by theme, planet, or virtue. Do not present a derived mapping as canonical.

### Verse Source Tracker (Current State)

- Added `data/scripture_sources/key_of_solomon_pentacles.csv` from `data/pentacle_psalms.json` with source metadata.
- Current coverage: all 43 pentacles have at least one source reference (`psalms` or `supplemental_references`); 17 rely on non-Psalm/grimoire supplemental citations.
- Added `data/psalm_number_map.csv` for full Vulgate-to-Hebrew numbering normalization.
- Expanded `data/scripture_mappings.json` to include all currently referenced pentacle Psalms (28 referenced + 3 prior seed entries).
- Next step: add Latin/Vulgate excerpts for the newly expanded mappings and optionally add a sibling Secrets of the Psalms CSV for side-by-side comparison.

### Canonical Target Editions

| Edition | Use Case | Notes |
| --- | --- | --- |
| Vulgate (Clementine, 1592) | Matches Key of Solomon numbering | Mathers/Peterson baseline |
| Masoretic (Tanakh, Westminster Leningrad) | Hebrew baseline | Needed for Divine Names and gematria |
| Septuagint (Brenton/Rahlfs) | Hellenistic cross-reference | Useful for angelic phonetics |
| King James Version (1611) | English public-domain text | Useful for tooltips |
| Douay-Rheims (1899) | Catholic English paired to Vulgate | Keeps numbering alignment |

### Ingestion and Quality

Source gathering process:

1. Extract Psalm citations from Key of Solomon and Heptameron texts in `docs/source_texts/*.txt`.
2. Normalize numbering with `data/psalm_number_map.csv`.
3. Pull verses/excerpts via scraper.
4. Persist canonical text + translation in `data/scripture_mappings.json`.
5. Surface mappings in `web/clock.js` tooltip and side panel.
6. Serve runtime verse text from local PericopeAI (`/v1/book_partial`) with file fallback via `src/webserver.py`.

Quality controls:

- Validation script `scripts/validate_psalms.py` checks missing verses, numbering mismatches, and range truncation.
- Run `python3 scripts/validate_psalms.py --fail-on-warnings` in CI once coverage targets are met.
- Duplicate verse mappings across pentacles must either be eliminated or explicitly allowed by metadata policy (`metadata.duplicate_psalm_policy`).
- Every mapping records tradition, edition, and citation URL.
- Runtime scripture source mode is explicit and configurable (`SOLOMONIC_PSALM_SOURCE_MODE`).

Primary deliverables:

- `data/scripture_mappings.json`
- `data/psalm_number_map.csv`
- `scripts/extract_psalms.py`
- `docs/scripture_alignment.md`

### Unified Clock Schema Track

Detailed notes: see `docs/solomonic_clock_schema.md`.

1. Normalize `data/solomonic_clock_full.json` from the current `layers.*` model into a canonical schema with:
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
2. Make sector objects the core runtime join point so the system can resolve:
   - zodiac,
   - spirit,
   - planet,
   - pentacle,
   - scripture,
   - virtue,
   - guidance
   from one record.
3. Normalize pentacles and scripture into keyed lookup objects instead of requiring UI scans over grouped arrays.
4. Compute a compact runtime state object (`currentPlanet`, `currentSector`, `currentZodiac`, `currentPentacle`, `canonicalHour`, `lifeDomainFocus`) for the clock UI, guidance engine, Pericope integration, and oracle generator.
5. Add a schema-normalization step and compatibility layer so existing `web/clock.js` consumers can migrate off `layers.core/celestial/planetary/spirit` safely.
6. Expand validation to cover:
   - 72 sectors,
   - 12 zodiac spans,
   - 6 sectors per sign,
   - sector-to-pentacle joins,
   - scripture reference existence,
   - canonical hour coverage,
   - life-domain coverage.
7. Pair the normalized schema with a runtime engine so the symbolic dataset stays static while the current cosmic state is calculated live.

## Workstream D: Esoteric Enrichment

### Planetary Layer Enhancements

| Attribute | Description | Source / Justification |
| --- | --- | --- |
| Planetary Intelligence (Spiritus Bonorum) | Benevolent planetary guardian (e.g., Jophiel for Jupiter, Och in Arbatel) | Heptameron, Arbatel, Clavicula Salomonis |
| Planetary Spirit (Spiritus Malorum) | Chaotic counterpart (e.g., Hismael for Jupiter) | Theurgia-Goetia, Heptameron |
| Metal Association | Gold/Sun, Silver/Moon, Iron/Mars, etc. | Agrippa, Occult Philosophy III:44 |
| Incense / Perfume | Traditional odor offering per planet | Key of Solomon II:11 |
| Color and Gem Correspondence | Planetary colors and gemstones | Agrippa II:22, Book of Correspondences |

### Zodiacal Layer Enhancements

| Attribute | Description | Source / Justification |
| --- | --- | --- |
| Zodiacal Angel / Shemhamphorash Pair | Day/night angels for each 5 degree decan (36 total) | Golden Dawn documents, Liber Hermetica |
| Element and Modality | Elemental triplicity + modality tags | Classical astrology |
| Ruler and Exaltation | Ruler/co-ruler + exalted planet by sign | Tetrabiblos I:17 |
| Decan Image Description | Symbolic decan image for hover text/icons | Picatrix II:11 |

### Temporal and Ritual Layer

| Attribute | Description | Source / Justification |
| --- | --- | --- |
| Planetary Hour Lord (Dynamic) | Algorithmic calculation of active hour ruler | Key of Solomon, Agrippa III:43 |
| Angel of the Day/Night | Weekday planetary angels (e.g., Sachiel for Thursday) | Heptameron |
| Sigillum Planetarium | Display planetary sigils from Key of Solomon plates | Clavicula Salomonis II |
| Magical Square / Kamea Link | Overlay numeric kameas tied to active planet | Agrippa II:22 |
| Cabalistic Sephirah | Map planet to Tree of Life sephirah | Sefer Yetzirah, Kircher |

### Textual Layer Additions

| Attribute | Description | Example |
| --- | --- | --- |
| Psalm Verse Reference | Include full verse text, not only citation | "He shall give thee the desires of thine heart." (Psalm 37:4) |
| Hebrew Divine Name | Divine name associated with planet | El for Jupiter |
| Seal Phrase / Invocation | Short conjuration excerpt per invocation | Clavicula Salomonis II:8 |
| Latin Motto / Keyword | Traditional Hermetic virtue keyword | Magnanimitas (Jupiter), Sapientia (Mercury) |

Suggested visualization upgrades:

- Nested Tree overlay mapping sephiroth onto planetary rings.
- Animated planetary-hour ring showing current hour lord vs. day ruler.
- Hermetic compass mode (elements/directions + royal stars).
- Astrological chart integration for decan verification.
- Energy forecast ring: add a subtle outer gradient keyed to alignment score (`green` constructive, `amber` caution, `red` friction, `blue` contemplative).

Suggested schema extension example:

```json
{
  "weekday": "Thursday",
  "planet": "Jupiter",
  "zodiac_range": "Aquarius 5-10",
  "spirit": "Valac",
  "intelligence": "Jophiel",
  "angel_of_day": "Sachiel",
  "element": "Air",
  "sephirah": "Chesed",
  "metal": "Tin",
  "incense": "Cedar",
  "color": "#4169E1",
  "gemstone": "Amethyst",
  "divine_name": "El",
  "psalm_verse": "Psalm 37:4",
  "motto": "Magnanimitas",
  "decan_image": "Man holding a vessel pouring water",
  "sigil": "sigils/jupiter_valac.svg",
  "hour_ruler": "Jupiter"
}
```

## Workstream E: Search, Intent, and Assistant Layer

- Intent-to-reading map: link intents (health, wealth, power, protection, clarity) to indexed sections with citations.
- Ritual flow template: standardize reading -> prayer -> action -> reflection.
- Search utilities: add CLI or lightweight web search powered by `data/source_texts_index.json`.
- Ask the Clock: constrained question mode for decisions such as sending, negotiating, traveling, or responding.
- Counsel response contract: every answer returns `signal_strength`, `why`, `action`, and `modification_tip` grounded in current clock state.
- Query evaluation inputs: planetary day/hour, sign-degree, active pentacle theme, and conflict/alignment score.
- Daily Counsel mode: produce three concise tiers for `personal conduct`, `work/strategic`, and `hidden risk`.
- Strategic counsel mode: expose leverage, documentation, signaling, and concealment guidance with explicit non-harm boundaries.
- Council of Voices: allow the same clock-grounded question to be answered by multiple personas without changing the underlying state model.
- Constrained LLM layer: if chat is added, require source-grounded reasoning, current-state references, and at least one actionable step; avoid generic freeform chat.

### Pericope Counsel Integration Track

Detailed backend scoping: see `docs/pericope_ai_scope.md`.

1. Treat the clock as a shared context engine:
   - the clock produces runtime state such as `planetary_day`, `planetary_hour`, `zodiac_segment`, `spirit`, `active_pentacle`, and `pentacle_theme`.
   - Pericope consumes that state as live environmental context rather than asking each persona to infer it.
2. Add FastAPI clock endpoints:
   - `GET /clock/context`: return the current clock state plus a compact guidance summary.
   - `GET /clock/guidance`: return structured counsel blocks for the current moment.
   - `GET /clock/forecast?hours=24`: return upcoming alignment windows and caution periods.
3. Inject clock context into chat orchestration:
   - update the chat prompt builder so current clock state is included automatically when `Include Clock Guidance` is enabled.
   - expose a `get_current_clock_state()` tool so the LLM can request fresh state explicitly instead of relying only on static prompt text.
4. Add persona overlays on the same clock:
   - preserve existing Pericope personas and add a `Solomon` persona focused on judgment, order, diplomacy, and kingship.
   - keep the base clock interpretation consistent while allowing Augustine, Freud, Solomon, or future personas to explain the same state through different lenses.
   - make Pericope authors load as modular mentor plug-ins so newly added wisdom authors can immediately become selectable Life OS voices.
   - route new authors through a Wisdom Index that ranks them by virtue coverage and authority tier rather than treating all mentors as flat peers.
5. Normalize the Pericope corpus for Life OS use:
   - add semantic chunk metadata such as `author`, `source`, `virtues`, `themes`, and `lifeDomains` instead of relying on RAG chunks that only know about document position.
   - make virtue-tagged retrieval a first-class capability so Life OS queries can ask for `temperance`, `relationships`, or `restlessness` directly.
6. Add a virtue-tagging pipeline for new authors:
   - process `raw text -> chunking -> virtue classification -> metadata index -> vector storage`.
   - require every newly ingested author to emit virtue and life-domain tags before that author becomes available to the Life OS.
7. Add Wisdom Index and guidance services:
   - expose `GET /wisdom/virtue/{virtue}` so the Life OS can retrieve scripture anchors, mentor candidates, and practices for a virtue.
   - expose `POST /lifeos/guidance` so the clock can request one structured response containing scripture, mentor, reflection, and practice.
8. Standardize mentor rendering:
   - convert chat personas into structured mentor profiles with `style`, `tone`, `virtueFocus`, and authority tier metadata.
   - render Life OS guidance through mentor profiles rather than treating chat prompts as the primary storage format.
9. Standardize decision-answer templates:
   - every decision response should emit `signal_strength`, `relevant_influences`, `recommendation`, and `caution`.
   - use the template for questions about negotiation, travel, confrontation, timing, or repair so the system feels reasoned rather than chatty.
10. Add frontend context plumbing:
   - create a React `ClockContextProvider` that fetches `/clock/context` and injects it into counsel requests.
   - add an `Include Clock Guidance` toggle in chat, guided consultation buttons, and a `Daily Counsel` feed at the top of the Pericope home screen.
   - make `Why this guidance?` a collapsible reasoning panel fed by the same structured explanation data used by the API.
11. Add adaptive memory:
   - store `decision`, `outcome`, `emotional_tone`, `timestamp`, and `clock_state` together.
   - let future counsel reference prior outcomes when similar pentacles, hours, or planetary combinations recur.
12. Keep the mental model clear:
   - Solomonic Clock = visual state engine.
   - Pericope = wisdom corpus and reasoning layer.
   - combined system = interactive decision framework with provenance, memory, structured source selection, and persona-guided reasoning.
13. Keep the backend decomposition small:
   - collapse the full Life OS implementation into five services: `Clock Service`, `Virtue Engine`, `Wisdom Service (PericopeAI)`, `Guidance Service`, and `History Service`.
   - keep PericopeAI scoped as the `Wisdom Service` so corpus growth does not drag clock math, timeline persistence, or frontend orchestration into the Pericope backend.

### Election Timing Track

1. Add an election-window engine:
   - compute the next favorable windows for action types such as travel, negotiation, communication, creative work, relationship repair, financial decisions, and contemplation.
   - prioritize near-term usefulness over astrological complexity; the goal is timing advice that feels clear and actionable.
   - add a parallel Virtue Forecast layer so the same future windows can be summarized as likely virtue challenges or opportunities rather than only action categories.
2. Add an election endpoint:
   - `GET /clock/election?type=communication`: return ranked windows, signal strength, and a `act` / `delay` / `prepare` recommendation.
   - keep the response format small enough for both sidebar UI and chat tool use.
3. Share one scoring model:
   - combine planetary day, planetary hour, pentacle theme, and zodiac segment into a transparent weighted score.
   - expose the strongest contributing factors so users can see why one hour outranks another.
4. Add interface treatments:
   - show an `Upcoming Favorable Windows` panel near guidance with top windows for a few common action types.
   - let the forecast bar highlight the next strong election window rather than only listing raw hour names.
5. Wire election timing into chat:
   - when a user asks whether to send, negotiate, travel, or wait, let Pericope query the election endpoint before answering.
   - include the next better window directly in the response so counsel can say `prepare now, act at 20:00`.
6. Add optional retention hooks:
   - support opportunity alerts such as `next strong negotiation window in 2 hours`.
   - keep alerts secondary to the core engine so timing advice works even without notifications.

### Oracle Publishing Track

1. Promote clock state into a canonical context object:
   - serialize the active day, hour, zodiac segment, spirit, pentacle, and pentacle theme as a reusable `cosmic_weather` payload.
   - use that payload consistently across oracle generation, chat context, scheduled jobs, and page rendering.
2. Add oracle generation endpoints:
   - `POST /pericope/oracle`: accept `clock_context` plus a `mode` such as `wisdom`, `strategic`, or `devotional`.
   - support scheduled backend generation so daily or hourly counsel can be created without a live user request.
3. Standardize oracle output:
   - emit `theme`, `favorable_actions`, `caution`, and `symbolic_influence` as first-class fields.
   - attach optional `psalm`, `themes`, `persona`, and provenance metadata so each oracle can be rendered, cited, and reused.
4. Persist generated counsel:
   - store dated records in an `oracle_daily` table keyed by date and clock state.
   - store shorter `oracle_hourly` records for planetary-hour timing notes and forecast windows.
5. Publish oracle pages automatically:
   - expose stable dated routes such as `/oracle/2026-03-10`.
   - use the same stored oracle for the site, chat bootstrap context, and optional feed distribution.
6. Feed the chat system from stored counsel:
   - when a user asks broad daily questions, preload the current daily oracle before answering.
   - keep freeform chat aligned with the same counsel already shown by the clock and site.
7. Add guided decision tooling on top of the oracle baseline:
   - support decision categories such as message, negotiation, travel, project start, and relationship repair.
   - combine the stored oracle, live clock state, and persona overlay so the answer is both consistent and situational.
8. Use oracle generation as a content engine:
   - automatically produce daily counsel pages and hourly mini-oracles that can also function as blog, landing-page, or feed content.
   - optionally publish election-window highlights alongside the daily oracle so the page answers both `what` and `when`.
   - keep the content structured so SEO, archive navigation, and internal linking remain straightforward.

## Workstream F: Life OS and Moral Architecture

Detailed notes: see `docs/life_os_architecture.md`.

- Extend the clock from a counsel system into a Life OS that combines temporal structure, moral architecture, reflection, and guided development.
- Collapse the implementation into five core services: `Clock Service`, `Virtue Engine`, `Wisdom Service (PericopeAI)`, `Guidance Service`, and `History Service`.
- Organize user life into seven domains: `mind`, `body`, `relationships`, `stewardship`, `vocation`, `household`, and `contemplation`.
- Add a life-domain engine so the clock can recommend domain focus, discipline prompts, and reflection prompts instead of only momentary guidance.
- Add a virtue-wheel layer that maps life domains to prudence, justice, temperance, fortitude, faith, hope, and love.
- Add a Virtue Engine that translates sector, planet, canonical hour, life domain, and scripture signals into one common virtue vocabulary for guidance resolution.
- Add a Wisdom Graph that connects sectors, planets, virtues, domains, scripture, shadows, and practices so guidance can traverse relationships instead of relying on one-step static mappings.
- Keep the Wisdom Graph disciplined by making virtues the primary hub: attach sectors, scripture, practices, domains, and mentors through virtues rather than allowing arbitrary cross-links.
- Add a Wisdom Index that keeps Christ and Scripture primary while ordering mentors and practices beneath that canonical core.
- Treat PericopeAI as the Wisdom Reasoning Engine behind the Life OS, with virtue-tagged corpus ingestion, mentor profiles, and a dedicated `POST /lifeos/guidance` interface.
- Keep the frontend thin by treating `GET /guidance/today` or an equivalent guidance endpoint as the main UI contract, with the clock interface rendering returned state rather than orchestrating multiple backend calls itself.
- Implement the Life Wheel as its own radial ring between zodiac and canonical layers, with seven domain segments, score-based fills, hover guidance, and targeted domain highlighting from clock state.
- Add a dynamic pentacle renderer so the center seal and expanded pentacle views can be generated from guidance state instead of relying only on static sprites.
- Turn the center seal into the primary control surface with six wedges: `Guidance`, `Practice`, `Reflection`, `Timeline`, `Forecast`, and `Mentor`, and keep the four-intention Guidance Compass (`Reflect`, `Learn`, `Act`, `Restore`) inside `Guidance` mode.
- Add a `Daily Opening` ritual so the first interaction each morning reveals the day, presents one mentor reflection and one scripture anchor, captures a user intention, and seeds the day's timeline entry.
- Add a Virtue Compass overlay that maps `Prudence`, `Love`, `Temperance`, and `Fortitude` to `North / East / South / West`, with `Faith`, `Hope`, and `Justice` as inner modifiers and the active direction summarized in the center.
- Align the full rose-window interface to one shared angular grid so sectors, zodiac, Life Wheel, canonical hours, the Virtue Compass, and the Providence Map all derive from the same normalized angle and display rotation.
- Add a Virtue Forecast Engine so the wheel can show upcoming `6h`, `24h`, and `7d` virtue phases, completing the past/present/future arc of Providence Map + Clock + Forecast.
- Add a Life Training Engine that combines cosmic time, weak domains, and virtue mapping into one practical daily training recommendation.
- Add a Rule-of-Life Generator that converts clock state, weak domains, canonical-hour emphasis, and virtue focus into a daily schedule of practices plus a weekly training rule.
- Add a Daily Guidance Narrative Engine that converts structured guidance into a short readable message with `short`, `medium`, and `long` depth modes.
- Add a Mentor Layer that keeps guidance structure fixed while letting users choose a modular Pericope-backed voice such as Solomon, Augustine, Marcus Aurelius, Seneca, or Aquinas.
- Add a Providence Timeline that records daily guidance, practice, reflection, and life-score changes so users can navigate their history as a chronicle of formation.
- Add a Providence Map that renders timeline entries as a virtue-colored constellation around the clock, with orbit bands by age and node clustering for long-range history.
- Add a moral architecture filter that evaluates AI suggestions against principles such as truth, love, humility, stewardship, justice, discipline, and faith before surfacing them.
- Treat AI as advisor rather than authority: it may interpret, suggest, reflect, and challenge, but it should not replace conscience.
- Add a reflection engine with daily examination prompts, journal capture, and moral review loops.
- Add a canonical-hours engine so planetary timing can merge with daily phases such as preparation, work, humility, gratitude, and examination.
- Add a 72-sector guidance engine that interprets active sectors as behavioral archetypes with shadow, virtue, correction, and scripture mappings.
- Support mentor personas such as Solomon, Augustine, Socrates, and Marcus Aurelius as interpretive overlays on the same user state.
- Add a Life Wheel UI ring and long-term virtue/domain history views so formation is visible over weeks, months, and years.
- Define a Life Wheel scoring system so domain scores change from events, practice completion, reflection, neglect decay, and balance bonuses rather than acting as decorative values.
- Keep Life Wheel scoring explainable: each domain change should expose its cause, impact size, and whether it came from action, reflection, decay, or alignment with the day's training focus.
- Reframe the main interface as a rose window: outer Solomonic sector ring, zodiac ring, life/virtue ring, canonical ring, and center scripture/guidance panel, using zodiac-aligned geometry and Chartres-inspired ring proportions.
- Collapse supporting content into accordions so the radial UI remains primary while `Today's Guidance`, `Weekly Arc`, `Scripture`, `Wisdom`, and `Explanation` stay available on demand.
- Add formation loops that use progress visibility, identity framing, and narrative development in service of wisdom rather than shallow gamification.
- Frame the product around human flourishing and formation of the person, not only efficiency or productivity.

## Delivery Phases

- Phase 1 (Foundation): complete scripture mapping baseline, numbering normalization, unified clock schema normalization, validation tooling, derived-correspondence scaffolding, Pericope-first scripture access, and explicit service-boundary definitions for Clock, Virtue, Wisdom, Guidance, and History.
- Phase 2 (Experience MVP): ship the real-time clock engine (planetary day, planetary hour, solar longitude, zodiac, sector), instrument-style animation, daily profile card, reading depth toggle, explainability baseline, and local long-read support.
- Phase 3 (Guidance Engine): add structured context/domain/output scoring, runtime state resolution from the unified schema and live engine, virtue-resolution across sector/planet/hour/domain/scripture, wisdom-graph traversal across sector/virtue/domain/scripture/practice, Christ/Scripture-first wisdom-index ordering across scripture/mentor/practice selection, Pericope corpus normalization with virtue/life-domain tags, confidence and severity, planetary hour inputs, conflict detection, election-window scoring, and mode-aware presentation.
- Phase 4 (Follow-Through): add weekly arc, vow selection, closeout logging, micro-ritual actions, centered guidance cards, `Why this guidance?` reasoning, light local personalization, stored daily/hourly oracle records, and `act/delay/prepare` recommendations.
- Phase 5 (Assistant and Advanced UI): ship Ask-the-Clock counsel flows, Pericope clock-context injection, virtue-index and `POST /lifeos/guidance` endpoints, 24-hour opportunity timeline, election-window panels and alerts, oracle publishing routes, energy forecast visualization, Council-of-Voices persona views, rose-window concentric UI layers, the center seal control surface, the Guidance Compass inside `Guidance` mode, the Virtue Compass overlay, a shared angular reference model across all radial layers, the Virtue Forecast arc/panel, the dynamic pentacle renderer, mentor selector/rotation UI, radial-first tooltip/accordion interactions, and advanced schema adoption across guidance and enrichment layers.
- Phase 6 (Life OS): add life domains, the Life Wheel ring, the Life Training Engine, the Rule-of-Life Generator, the Daily Guidance Narrative Engine, the Mentor Layer, the Wisdom Index, the Daily Opening ritual, virtue-wheel evaluation, reflection journaling, moral-architecture filtering, mentor dialogue, formation loops, and narrative life mapping.
- Phase 7 (Rule of Life): add canonical hours, the 72-sector guidance engine, the Life Wheel scoring model (event impacts, decay, alignment multipliers, weekly normalization), practice-library refinement, wisdom-graph enrichment and explorer views, the Providence Timeline, the Providence Map, the Virtue Forecast Engine with weekly virtue-season summaries, weekly summaries, monthly pattern detection, Life Wheel history views, domain-targeted scripture selection, and deeper guidance by virtue/domain imbalance.
