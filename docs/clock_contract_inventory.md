# Clock contract extraction inventory

Status: observed implementation inventory; no runtime replacement authorized.

Baseline: `949952c632a8abebde83cd541f93fb01d7635417` on `origin/main`.
The worktree was clean before extraction. The existing Codex project is
`Solomonic_Seals`. The proposed boundary is [SolomonicSchedule v1](solomonic_schedule_v1.md).

## Evidence boundary

The source paths and named functions below describe the inspected checkout.
Read-only requests to `https://truevineos.cloud/api/clock` and
`/api/clock/runtime?timezone=America%2FChicago` both returned HTTP 200 during
extraction on September 19, 2026 (America/Chicago). The dataset had `title`,
`generated_at`, `visual_parameters`, and `layers`; the runtime had the fields
listed below and reported `solar_event_planetary_hour`. This verifies public
payload shape, not the deployed commit, every UI feature, or scheduler parity.
Contabo, nginx, and loopback port 8086 are documented deployment topology in
`production_domain_setup.md`; host configuration was not independently inspected.

## Current domain model and data

| Source | Actual responsibility / structure |
| --- | --- |
| `src/generate_full_dataset.py`, `data/solomonic_clock_full.json` | Static symbolic catalog: `title`, `generated_at`, `visual_parameters`, `layers`. Core hub; nine celestial seals; seven planetary groups containing 44 pentacles; 72 spirit sectors. |
| `layers.spirit.sectors[]` | `sector` is **1–72**; `zodiac`, `degrees` (a string relative to the sign), `spirit`, `rank`. Twelve signs, six five-degree sectors each. |
| `layers.planetary.groups[]` | `name`, `day`, `themes`, `pentacles[]` with local `index` and `focus`. Preserve group and pentacle ordering. Join key is lowercase `planet-index`, e.g. `mars-5`, not the older proposed `Mars_5`. |
| `visual_parameters` | Radius, rotation speed, color scheme; consumed with the catalog by the radial renderer. Not scheduling constraints. |
| `data/pentacle_psalms.json` | `metadata`, `pentacles[]`; joins planetary pentacles to Psalm references and supplemental references. |
| `data/scripture_mappings.json` | `metadata`, `psalms`; scripture numbering/reference support. Preserve translation and numbering distinctions. |
| `data/pentacles.json` | `metadata`, `planetStyles`, keyed `pentacles`; seal rendering metadata. |
| `data/life_domains.json` | `storageKey`, `domains`, `planetFocus`; domain IDs, seed scores, and focus mapping. Server scores are clamped to 0–100 and weakest/focused domains are derived; browser state can be personalized. |
| `data/source_texts_index.json`, `docs/source_texts/` | Source inventory and locally available source texts, including English Psalm fallback. |
| `data/intent_reading_map.json` | Source whitelist, result limits, and intent-to-reading candidates. |
| `data/passage_meaning_records.json`, `data/clock_relevance_records.json` | Versioned editorial passage meaning and Clock relevance records. Selection separates passage meaning from why it is relevant now. |
| `data/solomonic_seed.json`, `data/hierachy_catalog_symbols.json` | Seed/catalog descriptions, temporal mappings and relationships; do not substitute these for the actual `/api/clock` payload. |

## Runtime and constraints

`src/webserver.py::_compute_time_state` derives annual spirit fraction, weekly
planet/pentacle fraction (Sunday-based), and a nine-year celestial cycle from
the year 2000. Array `indices` are zero-based. `_build_clock_runtime_payload`
adds approximate solar longitude, solar sector selection, sunrise/sunset and
planetary hours. These are distinct computations, not a task optimizer.

| Rule | Observed behavior to preserve |
| --- | --- |
| Time | `_resolve_clock_request_time`: IANA zone, default UTC; ISO `as_of`; naive timestamps are interpreted in the chosen zone. Invalid zone/time is rejected. A future schedule contract requires explicit offsets without tightening old endpoints. |
| Location | `_resolve_clock_location`: latitude −90…90, longitude −180…180; env-configurable defaults are Chicago 41.8781, −87.6298. Current frontend runtime fetch sends timezone/time, not coordinates. Never infer coordinates from timezone. |
| Day/hour | Calendar weekday chooses day ruler. Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. Solar day/night segments each divide into 12 unequal hours. Preserve current day-ruler behavior across midnight rather than silently introducing a sunrise-day convention. |
| Solar failure | Missing solar events produce unavailable/partial status; runtime falls back to civil-hour rules. Start/end and daylight can be null. The next solar hour may be unavailable. |
| Index conventions | Runtime `sector.index` is one-based; `indices.spirit` is zero-based and comes from symbolic time state. They can differ. `_serialize_planetary_hour` exposes its hour indices separately; do not reinterpret them as sector IDs. |
| Longitude | Normalized circular angle; sector lookup uses five-degree buckets. Do not derive the UI sector by trusting a rounded boundary angle instead of the resolved sector ID. |
| Pentacles | The validator requires 44; the Psalm tradition map differs. `src/validate_json.py` deliberately warns rather than rewriting the catalog. |
| Context time | Public context/content-bundle/wisdom-anchor builders strip caller `as_of`; context marks `temporal_policy: fixed_now`. Runtime GET accepts `as_of`. Historical snapshots must not be passed off as the current public context. |
| Guidance time | `_build_guided_prompts_payload` uses symbolic/civil-time guidance. `_build_clock_context_payload` uses civil-hour validity and next boundary. These do not automatically equal solar-hour intervals. |
| Text | References select text from corpus/local resolvers. `content_bundle.solomonic.text` currently contains generated `Purpose: …` copy; it is not a manuscript quotation. Loading/unavailable/fallback states must remain distinguishable. |

There is no current work-item/resource assignment model, hard/soft optimization
score, Timefold dependency, or solver lifecycle in these inspected Clock paths.
Election recommendations and normalized canonical-hour/virtue/mentor objects in
older architecture documents are not evidence of an implemented scheduler API.

## Current API surfaces

| Surface | Output / dependency |
| --- | --- |
| `GET /api/clock` | Full static catalog; frontend falls back to bundled `data/solomonic_clock_full.json`. |
| `GET /api/clock/runtime` | `generated_at`, `as_of`, `timezone`, `location`, `data_source`, `planetary_day`, `planetary_hour`, `next_planetary_hour`, `is_daylight`, `solar_events`, `zodiac`, `degree`, `sector`, `active_pentacle`, `indices`, `fractions`. |
| `POST /api/clock/context` | Public fixed-now `clock-context-v2`: daily guidance/profile, weekly arc, why-selected, content bundle, moment, section content, timely guidance, cited works/selection, source records, content generation metadata. No guided prompt array. |
| `POST /api/clock/content-bundle`, `/api/clock/wisdom-anchor` | Context slices and resolved text; retain their existing response shapes. |
| `POST /api/pericope/guided-prompts` | Same Clock-owned guidance derivation plus prompt cards; requested limit clamped to 1–6. Shared-secret server integration. Never publish the secret in a schedule. |
| `POST /api/pericope/chat-launch` | Builds the Pericope launch, including selected/override message and structured context. |
| `POST /api/pericope/book-partial`, `/api/psalm` | Source passage resolution and Psalm support; source unavailable does not mean schedule failure. |

## Pericope interpretation

Clock owns context, guidance and prompt selection. Pericope owns retrieval,
author/book/data conversation and final answers. Guided mode starts with the
selected message and structured `clock_context`; freeform prioritizes the user's
message and only optionally uses Clock context. Neither mode authorizes a
calendar mutation or turns symbolic guidance into a hard constraint.

`web/pericope_launch_contract.js` encodes `mode`, `source=solomonic_clock`, optional
`message`, `prompt_id`, and UTF-8 base64url JSON `ctx`. Even freeform launches from
this helper identify the Clock as their source. Direct Pericope user sessions
described in the conversation contract use `source=pericope_user`; keep that
distinction. Context is metadata, not a visible user message or a trusted system
instruction. Base64url is encoding, not confidentiality.

The inspected repo contains launch construction, not Pericope's final message
interpreter. End-to-end Pericope interpretation remains an integration check.

## UI dependencies and extraction hazards

`web/clock_visualizer.html` loads D3 v7 with a bundled fallback, Keycloak JS
26.0.2, `web/style.css`, and the module `web/clock.js`. The latter owns SVG/ring
rendering, client time state, async runtime/context caches, drawer sections,
source expansion, practice/history, account/billing and speech flows.

`applyClockRuntimeToTimeState` overlays solar longitude, one-based sector lookup,
and day labels on local state. It does not replace all local computations.
`mergeClockApiContext` merges context and runtime for display. Runtime cache keys
use timezone/minute; context keys use timezone/hour. A future producer must
preserve section content, citation provenance and fallback behavior, not merely
provide a list of times.

Browser local storage holds life-domain/user state, history/client identity,
daily action/opening state and an auth bridge. Auth, billing entitlements,
history sync, Pericope history and VibeVoice are separate services; they do not
belong in a publicly cacheable schedule payload.

Important document drift: `solomonic_clock_schema.md` proposes a normalized
model; it is not the shipped JSON shape. `clock_consumption_contract.md` describes
ruler-selected wisdom, while current `_get_proverb_reference_for_date` and
`test_runtime_proverb_selection_uses_calendar_date_not_ruler_map` establish
calendar-date Proverbs selection. Preserve current behavior in extraction and
resolve any desired semantic change separately.

## Compatibility conclusion

The current catalog and runtime shape are confirmed on the public site. A new
schedule envelope is **not yet consumed by that site**. Compatibility requires
an explicit, separately implemented projection into these existing API shapes,
plus parity tests at fixed inputs. No replacement, deployment, schema migration,
or solver integration is part of this extraction.

## Extraction validation

After fetching and confirming `origin/main` was still current:

- `python3 src/validate_json.py`: passed; retained the existing 44/43 tradition
  warnings and missing/extra Psalm-map records.
- `python3 -m unittest discover -s tests -p 'test_guided_prompts_api.py'`:
  24 tests passed.
- `node --test tests/test_pericope_launch_contract.mjs tests/test_clock_drawer_contract.mjs tests/test_scripture_study_page.mjs tests/test_vibevoice_frontend_contract.mjs`:
  all four test files passed.
- `git diff --check`: passed.

These verify the existing baseline for this documentation-only extraction.
They do not validate a new adapter, a full visual/browser session, or a deployment.
