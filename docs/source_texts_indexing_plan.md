# Source Texts Indexing Plan

## Goal
Turn `docs/source_texts/*.txt` into a structured, searchable dataset with stable citations.

## Output
- `data/source_texts_index.json`
- `data/source_texts_index.csv` (optional export)

## Script
- `scripts/index_source_texts.py`
  - Enriches entries with `docs/source_texts/book_metadata.json` when present.
  - Supports direct indexing from an external folder via `--source-dir` or `SOLOMONIC_SOURCE_TEXTS_DIR`.

## Runtime Scripture Access (PericopeAI First)
- Verse text for UI/runtime should come from local PericopeAI `book_partial` via `src/webserver.py` (`/api/psalm` endpoint).
- Default mode: `SOLOMONIC_PSALM_SOURCE_MODE=pericope_first`.
- Configure local API base with `SOLOMONIC_PERICOPE_API_BASE` (example: `http://localhost:8001` outside Docker, `http://host.docker.internal:8001` inside Docker).
- Keep file fallback enabled for offline/dev resilience (`file_first` or `pericope_first`).

## PericopeAI Direct Access (No Copy)
Index directly from the Pericope corpus folder instead of copying files into this repo:

```bash
python3 scripts/index_source_texts.py \
  --source-dir /Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/solomon_expanded_texts \
  --output data/source_texts_index.json
```

## Proposed Schema (JSON)
```json
{
  "source_id": "wisdom_of_solomon_gutenberg",
  "title": "Wisdom of Solomon (Gutenberg)",
  "source_url": "https://www.gutenberg.org/cache/epub/124/pg124.txt",
  "retrieved": "YYYY-MM-DD",
  "sections": [
    {
      "section_id": "wisdom-1",
      "heading": "Wisdom 1",
      "order": 1,
      "text": "...",
      "char_start": 1234,
      "char_end": 5678
    }
  ]
}
```

## Parsing Strategy
- Normalize whitespace and line breaks.
- Detect headings by heuristics:
  - Lines in ALL CAPS or Title Case with short length.
  - Numbered headings (e.g., "ODE 1", "PSALM I", "CHAPTER 3").
  - Markdown‑style headers (if present).
- Fallback: chunk into fixed‑size sections (e.g., 1–2 pages worth of text).

## Indexing Steps
1) Load every file in the configured source directory (`docs/source_texts/` by default).
2) Extract the header block (Sources + Retrieved date).
3) Identify section boundaries.
4) Store each section with stable IDs and offsets.
5) Export JSON + optional CSV for quick lookup.

## Search Features (Future)
- Full‑text search by keyword and phrase.
- Filtering by source, section, and heading.
- Cross‑refs for Psalms and ritual mapping.

## QA
- Spot‑check top/bottom sections per source.
- Ensure no content loss around headings.
- Validate IDs remain stable across re‑runs.
