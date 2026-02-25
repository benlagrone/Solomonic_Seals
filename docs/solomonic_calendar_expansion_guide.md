# Solomonic Calendar Expansion Guide

This guide translates the currently indexed Solomonic corpus into a practical plan for:
- adding calendar intelligence,
- adding new user-facing features,
- improving current features without losing your existing clock model.

## 1) What The Corpus Gives You

### Planetary timing system (day + hour)
- The corpus explicitly defines 24 planetary hours and day rulership order, with hour-by-hour sequencing from sunrise.
- Sources:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1572`
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1598`
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1471`

### Planet correspondences you can attach to events
- Day, archangel, angel, metal, and color correspondences are given in tabular form.
- Source:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1433`

### Operation intent by planetary day/hour
- Text links different operation types to planetary days/hours (wealth, friendship, war, visions, etc.).
- Source:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1612`

### Lunar constraints
- Moon sign and phase constraints are explicit (e.g., sign groups and waxing/waning windows).
- Sources:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1749`
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/key_of_solomon_esotericarchives.txt:1774`
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/lesser_key_of_solomon_sacred_texts.txt:1972`

### Weekly suffumigation/incense correspondences
- Seven-day mapping of material categories (roots, gums, leaves, woods, fruits, flowers, etc.) is directly stated.
- Source:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/raziel_esotericarchives.txt:2298`

### Zodiac + directional qualities
- Sign clusters and directional/elemental qualities are present and can drive calendar filtering.
- Source:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/raziel_esotericarchives.txt:763`

### Decan-structured spirit layer
- Corpus supports zodiac/decan-style spirit scheduling (36 decans, zodiac linkage).
- Source:
  - `/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts/testament_of_solomon_mit.txt:832`

## 2) Current Gaps To Fix First

### Timing is symbolic, not planetary-hour accurate
- Current UI rotates by generic fractions (year/week), not sunrise-based planetary-hour computation.
- Source:
  - `web/clock.js:266`

### Pentacle tradition mismatch
- Clock dataset uses a 44-pentacle grouping, but psalm mapping currently contains 43 entries in a different distribution.
- Sources:
  - `src/generate_full_dataset.py:73`
  - `data/pentacle_psalms.json`

### Verse parser truncates multi-verse shorthand
- `3-4-5` currently parses as a range start/end pair, dropping the third verse.
- Source:
  - `web/clock.js:426`

### Scripture access now uses configurable server endpoint
- Psalm text API now routes through `/api/psalm`, and backend source selection is env-driven (`SOLOMONIC_PSALM_SOURCE_MODE`, `SOLOMONIC_PERICOPE_API_BASE`).
- Sources:
  - `web/clock.js:91`
  - `src/webserver.py`

### Index contamination from archive HTML wrappers
- Some indexed sources still include raw page metadata/nav text and scripts.
- Source:
  - `data/source_texts_index.json` (e.g., first section for `hygromanteia_archive`)

## 3) Data Model Additions

Extend `data/solomonic_clock_full.json` with three new blocks.

### `traditions`
Use tradition profiles to support 43-vs-44 pentacle variants and text provenance.

```json
{
  "traditions": {
    "mathers_key_of_solomon": {
      "pentacle_distribution": {"saturn":7,"jupiter":7,"mars":7,"sun":7,"venus":5,"mercury":4,"moon":6},
      "source": "key_of_solomon_esotericarchives"
    },
    "clock_44_model": {
      "pentacle_distribution": {"saturn":7,"jupiter":7,"mars":5,"sun":6,"venus":5,"mercury":8,"moon":6},
      "source": "project_default"
    }
  }
}
```

### `correspondences`
Planet/day/hour metadata for runtime lookup.

```json
{
  "correspondences": {
    "planetary": {
      "saturn": {"day":"Saturday","archangel":"Tzaphqiel","angel":"Cassiel","metal":"Lead","color":"Black"}
    },
    "suffumigations": {
      "Saturday": ["roots", "costus", "hog_fennel"]
    }
  }
}
```

### `calendar_rules`
Rule engine input for event eligibility and recommendations.

```json
{
  "calendar_rules": [
    {
      "rule_id": "moon_spirits_terrestrial_signs",
      "intent_tags": ["spirit_invocation", "recovery"],
      "constraints": {"moon_sign_group": "earth"},
      "citations": [{"source":"key_of_solomon_esotericarchives","line":1749}]
    }
  ]
}
```

## 4) New Features To Add

### Feature A: Planetary Hour Engine
- Compute planetary hour ruler from local sunrise/sunset and weekday.
- Expose active hour metadata to UI and API.
- Files:
  - `src/planetary_time.py` (new)
  - `src/webserver.py` (new endpoint `/api/active-correspondence`)
  - `web/clock.js` (consume live hour state)

### Feature B: Ritual Window Finder
- Input: intent tags (`wealth`, `protection`, `clarity`, etc.).
- Output: next eligible windows using `calendar_rules` + moon sign/phase constraints.
- Files:
  - `src/calendar_rules.py` (new)
  - `src/webserver.py` (endpoint `/api/windows?intent=...`)

### Feature C: Source Citation Drawer
- Click any ring segment to show:
  - correspondence details,
  - direct source citation(s),
  - linked section metadata.
- Files:
  - `web/clock.js`
  - `data/source_texts_index.json` (already available)

### Feature D: Tradition Switcher
- Toggle between `mathers_key_of_solomon` and `clock_44_model`.
- UI instantly rebinds pentacle count, mapping, and psalm references.
- Files:
  - `data/solomonic_clock_full.json`
  - `web/clock.js`

### Feature E: Decan Layer Mode
- Optional outer ring mode using 36 decans (zodiacal) with spirit associations.
- Useful when users want zodiac timing instead of fixed 72-sector mode.
- Files:
  - `src/generate_full_dataset.py`
  - `web/clock.js`

## 5) Improve Current Features

### 1. Fix pentacle/psalm mapping consistency
- Decide one of:
  - migrate to one canonical tradition, or
  - support both via `traditions` switch.

### 2. Upgrade verse parsing
- Accept:
  - `3-5` (range),
  - `3,5,7` (list),
  - `3-4-5` (legacy shorthand list, not range).
- File:
  - `web/clock.js:426`

### 3. Expose scripture source diagnostics
- Add a lightweight diagnostics endpoint to report active scripture backend and last source URL/path.
- Files:
  - `src/webserver.py`
  - `web/clock.js`

### 4. Improve source indexing cleanliness
- Strip HTML-like sources even if `</html>` is missing.
- Remove known archive navigation boilerplate by pattern.
- File:
  - `scripts/index_source_texts.py`

### 5. Add validation checks
- New validator should fail build when:
  - pentacle counts and psalm map are incompatible for selected tradition,
  - rule citations point to missing sources,
  - unresolved verse notation remains.

## 6) How To Add A New Calendar Rule (Workflow)

1. Identify a source-supported instruction and capture citation.
2. Translate it into normalized constraints (`planet`, `hour`, `moon_phase`, `moon_sign_group`, `intent_tags`).
3. Add rule under `calendar_rules` with explicit provenance.
4. Add or update UI labels for the new intent/output.
5. Add one deterministic test case for the rule.

## 7) Suggested Build Order

1. Data consistency pass (tradition profile + mapping parity + verse parser fix).
2. Planetary-hour engine and live active correspondence endpoint.
3. Rule engine + ritual window finder.
4. Citation drawer and tradition switcher.
5. Decan mode and advanced filters.
