# Scripture Mapping Roadmap

Goal: connect each planetary pentacle and spirit sector to Psalms, Proverbs, and related wisdom passages so the clock can surface daily readings.

## Source References
- **Key of Solomon commentaries** (Mathers, Peterson) list Psalms for each pentacle; treat these as the canonical baseline.
- **Secrets of the Psalms** (Godfrey Selig) groups Psalms by petition (protection, favor, love, etc.)—useful for thematic tagging.
- **Topical concordances** for Proverbs and other wisdom books (Ecclesiastes, Sirach) to align verses with each spirit’s focus.

## Mapping Workflow
1. Create a master sheet keyed by `planet`, `pentacle_index`, and `spirit_sector`.
2. Log the Psalm references from the grimoires, noting dual numbering (Hebrew vs. Vulgate) where needed.
3. Tag Proverbs based on the spirit’s or pentacle’s stated focus (courage, eloquence, reconciliation, etc.).
4. Add optional cross-book notes (wisdom literature quotes, mystical commentary) that expand on the same theme.

## Dataset Extension
Append scripture metadata to each object, e.g.:

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

Store empty objects where references are still pending so validation can detect missing data.

## UI Ideas
- Display verse snippets in the tooltip/side panel with a “Read full passage” link.
- Rotate daily meditations by pulling the active spirit’s proverb and the planetary pentacle’s psalm.
- Allow toggles between traditions (Key of Solomon vs. Secrets of the Psalms) if you include multiple mappings.

## Next Actions
- Gather verse lists from the target editions.
- Normalize verse references (book, chapter, verse) for consistent formatting.
- Extend the dataset builder to ingest the mapping sheet and emit the `scripture` fields automatically.
