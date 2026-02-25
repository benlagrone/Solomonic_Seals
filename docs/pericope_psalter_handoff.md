# Pericope Psalter Handoff

Use this handoff to run a Codex session in the Pericope repo and fetch the missing Psalm source texts needed by this repo.

## Goal

Download and normalize Vulgate + Douay Psalm text for the currently pending mappings in `data/scripture_mappings.json`, expose them through local Pericope `book_partial`, then translate Latin excerpts through the local translator API.

This project is already configured for Pericope-first runtime scripture access (`SOLOMONIC_PSALM_SOURCE_MODE=pericope_first`).

## Pending Psalm Targets (Vulgate numbering)

`2, 13, 18, 21, 22, 24, 37, 40, 47, 54, 56, 60, 67, 68, 69, 72, 77, 91, 105, 107, 108, 109, 110, 112, 113, 116, 125, 135`

Verse needs from `data/pentacle_psalms.json`:

`2:*all* 13:3,4,5 18:7 21:*all* 22:14,16 24:7 37:15 40:13 47:*all* 54:*all* 56:11 60:4 67:*all* 68:1,*all* 69:23 72:8,9 77:13 91:11,13 105:32 107:16 108:6 109:18 110:5 112:3 113:7,*all* 116:16 125:1 135:16`

## Copy/Paste Prompt For Codex (Pericope Repo)

```text
You are in the Pericope repo. Task: acquire and ingest the missing Psalm texts needed by Solomonic_Seals.

Context:
- Solomonic_Seals mapping file: /Users/benjaminlagrone/Documents/projects/Solomonic_Seals/data/scripture_mappings.json
- Pending Vulgate psalms: 2,13,18,21,22,24,37,40,47,54,56,60,67,68,69,72,77,91,105,107,108,109,110,112,113,116,125,135
- Use links already stored in the mapping file (`links.vulgate`, `links.douay_rheims`) as canonical fetch targets.

Required output:
1) Raw downloads saved for traceability (one file per chapter/source).
2) Two normalized corpus files in AugustineCorpus:
   - Psalms_Vulgate_Clementine.txt
   - Psalms_DouayRheims_1899.txt
3) Files must be in parser-friendly format:
   - Chapter N
   - 1 verse text
   - 2 verse text
4) Ensure local Pericope /v1/book_partial can return content for these sources.
5) Translator API integrated for Latin->English (`POST /translate`, direction=`lat-en`).
6) Show verification commands and results for at least Psalms 36:4, 91:11, and 113:7.

Constraints:
- Keep Vulgate chapter numbering (not Hebrew renumbering) for chapter headers.
- Preserve verse numbers exactly.
- If HTML parsing is noisy, use deterministic cleanup and keep a per-source log.
- Do not edit Solomonic_Seals directly in this run.
- Translator API docs live at:
  - /Users/benjaminlagrone/Documents/projects/pericopeai.com/latin-rag-translator/docs/api.md
  - /Users/benjaminlagrone/Documents/projects/pericopeai.com/latin-rag-translator/docs/api-handoff.md

After ingest:
- Return a short report listing corpus paths, source names, and any unresolved chapters.
```

## Translator API Checks

If translator API is not already running, start it in `latin-rag-translator`:

```bash
uvicorn api:app --host 0.0.0.0 --port 8010 --reload
```

Verify:

```bash
curl -s http://localhost:8010/health
curl -s http://localhost:8010/model-info
curl -s http://localhost:8010/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"In principio erat Verbum","direction":"lat-en"}'
```

## Verification Commands (After Pericope Ingest)

Run these from anywhere with network access to local Pericope:

```bash
curl -s http://localhost:8001/v1/book_partial \
  -H 'Content-Type: application/json' \
  -d '{"author_slug":"david","book":"Psalms","source":"Psalms_Vulgate_Clementine.txt","start_position":1,"end_position":1000}'
```

```bash
curl -s http://localhost:8001/v1/book_partial \
  -H 'Content-Type: application/json' \
  -d '{"author_slug":"david","book":"Psalms","source":"Psalms_DouayRheims_1899.txt","start_position":1,"end_position":1000}'
```

## Automated Backfill In Solomonic_Seals

Use the local script to populate `latin_excerpt` from Pericope Latin source and `translation_excerpt` via translator API:

```bash
python3 scripts/backfill_scripture_mappings_from_latin_pericope.py \
  --pericope-base-url http://localhost:8001 \
  --translator-base-url http://localhost:8010 \
  --author-slug david \
  --book Psalms \
  --source Psalms_Vulgate_Clementine.txt
```

Dry run first:

```bash
python3 scripts/backfill_scripture_mappings_from_latin_pericope.py \
  --pericope-base-url http://localhost:8001 \
  --translator-base-url http://localhost:8010 \
  --source Psalms_Vulgate_Clementine.txt \
  --dry-run
```

## Wire Solomonic_Seals To The New Pericope Source

From `Solomonic_Seals`:

```bash
export SOLOMONIC_PSALM_SOURCE_MODE=pericope_first
export SOLOMONIC_PERICOPE_API_BASE=http://localhost:8001
export SOLOMONIC_PERICOPE_AUTHOR_SLUG=david
export SOLOMONIC_PERICOPE_BOOK=Psalms
export SOLOMONIC_PERICOPE_SOURCE=Psalms_Vulgate_Clementine.txt
python3 src/webserver.py
```

Then smoke test:

```bash
curl -s "http://localhost:8080/api/psalm?chapter=91&verse=11"
curl -s "http://localhost:8080/api/psalm?chapter=113&verse=7"
```

## Optional Follow-Up In This Repo

After Pericope text + translator API are available, run backfill then validate:

```bash
python3 scripts/backfill_scripture_mappings_from_latin_pericope.py \
  --pericope-base-url http://localhost:8001 \
  --translator-base-url http://localhost:8010 \
  --source Psalms_Vulgate_Clementine.txt

python3 scripts/validate_psalms.py --fail-on-warnings
```
