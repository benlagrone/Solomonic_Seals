# Solomonic Clock Unified Roadmap

Goal: build one coherent roadmap for product experience, scripture alignment, and esoteric enrichment so the clock can deliver grounded daily guidance with transparent citations.

## Workstream A: Core Clock Experience

- Canonical text links: reference the Key of Solomon, Ars Goetia, or Psalms per seal and surface citations in tooltips or side panels.
- Liturgical layer: align planetary days with historic devotions or canonical hours to suggest daily meditations.
- Astro-calendar tie-ins: connect zodiac degrees to equinoxes, decans, or notable astronomical events with short blurbs.
- Mystical commentary: curate quotes from grimoires, Sufi cosmology, or Kabbalistic texts and display them when a seal is active.
- Ritual hooks: list recommended intentions, incense, or planetary hour guidance for practical timing.
- Symbol imagery: link each seal to sigil artwork or planetary glyphs to show thumbnails on hover.
- Historical timeline: annotate the yearly ring with publication dates, festivals, or related milestones.

## Workstream B: Daily Experience and Guidance

- Daily profile card: show day ruler, active pentacle, correspondences (color, metal, angel), and suggested focus.
- Reading depth toggle: `Short` (single verse/excerpt), `Medium` (3-5 verses), `Long` (full chapter or extended section).
- Daily content bundle: combine one psalm + one wisdom excerpt (Proverbs/Ecclesiastes/Wisdom) + one Solomonic source excerpt.
- Explainability panel: show why content was selected today (planet/day/hour/sign rule + source citation).
- Reflection workflow: add one morning intention prompt, one midday practice prompt, and one evening reflection prompt.
- Weekly arc mode: show 7-day progression instead of isolated day cards.
- Journal/logbook: save completed readings, notes, and outcomes by date and intent.

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

When a pentacle has no Psalm citation in source tradition, capture a non-Psalm or grimoire citation under `supplemental_references` in `data/pentacle_psalms.json` instead of forcing a synthetic Psalm.

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
- Solomon chatbot: conversational interface grounded in indexed texts with cited excerpts and ritual suggestions.

## Delivery Phases

- Phase 1 (Foundation): complete scripture mapping baseline, numbering normalization, validation tooling, and Pericope-first scripture access.
- Phase 2 (Experience MVP): ship daily profile card, reading depth toggle, and local long-read support.
- Phase 3 (Recommendation Engine): planetary/day recommendation engine + explainability panel + daily content bundle.
- Phase 4 (Expansion): weekly arc, journaling, and first esoteric enrichment attributes in UI.
- Phase 5 (Assistant and Advanced UI): intent-aware search/chat, visualization upgrades, and advanced schema adoption.
