# Clock Consumption Contract

Status: authoritative internal contract

Purpose:
Define how Solomonic Clock consumes its own computed state, reference maps, source texts, and Pericope-facing payloads without turning maps into content libraries or duplicating Pericope behavior.

## Ownership Rule

The clock owns:

- time and date interpretation,
- planetary day/hour state,
- pentacle and spirit selection,
- life-domain focus selection,
- guidance and prompt derivation,
- reference selection for psalm, wisdom, and solomonic bundle entries.

The clock does not own:

- Pericope author chat,
- Ask Proverbs,
- retrieval ranking,
- final conversational answers,
- source-corpus authorship policy outside clock display/support needs.

## Wisdom Reference Map

The ruler wisdom structure is a map only.

Allowed shape:

```js
const WISDOM_REFERENCE_BY_RULER = {
  Sun: "Proverbs 4:18",
  Moon: "Ecclesiastes 3:1",
  Mars: "Proverbs 24:10",
  Mercury: "Proverbs 18:21",
  Jupiter: "Proverbs 11:25",
  Venus: "Proverbs 15:1",
  Saturn: "Proverbs 25:28",
};
```

Forbidden shape:

```js
const WISDOM_CONTENT_BY_RULER = {
  Venus: {
    ref: "Proverbs 15:1",
    text: "..."
  }
};
```

Rules:

- Ruler maps may select references.
- Ruler maps must not store scripture text.
- Ruler maps must not become fallback content libraries.
- Any displayed verse or passage text must be resolved from a source text, source endpoint, or corpus-backed resolver.

## Source Text Resolution

When the clock needs text for a selected wisdom reference:

```text
ruler
  ->
WISDOM_REFERENCE_BY_RULER
  ->
reference
  ->
book-partial/source resolver
  ->
display text
```

Current local resolver path:

```text
POST /api/pericope/book-partial
```

with:

```json
{
  "kind": "wisdom",
  "reference": "Proverbs 15:1"
}
```

Rules:

- The resolver may return a full chapter or passage block.
- The UI may extract the requested verse for compact display.
- Expanded views may show broader passage text.
- If source resolution fails, the UI may show an unavailable state, not a hardcoded verse fallback.

## Clock-Owned FE APIs

These APIs exist so the clock frontend can migrate away from duplicated local logic only after server parity is available.

### `POST /api/clock/context`

Purpose:
Return the current clock-derived context without Pericope guided prompt cards.

Request:

```json
{
  "timezone": "America/Chicago",
  "as_of": "2026-03-13T20:15:00-05:00"
}
```

Response includes:

```json
{
  "as_of": "2026-03-13T20:15:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {},
  "weekly_arc": {},
  "daily_profile": {},
  "why_selected": {},
  "content_bundle": {},
  "source": {
    "service": "solomonic_clock",
    "api": "/api/clock/context"
  }
}
```

Rules:

- no `guided_prompts` array,
- no Pericope chat behavior,
- same computation path as the Pericope guided-prompts API.

### `POST /api/clock/content-bundle`

Purpose:
Return the source-resolved daily content bundle and enough surrounding context for display.

Response includes:

```json
{
  "as_of": "2026-03-13T20:15:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {},
  "weekly_arc": {},
  "daily_profile": {},
  "content_bundle": {
    "psalm": {},
    "wisdom": {},
    "solomonic": {}
  },
  "source": {
    "service": "solomonic_clock",
    "api": "/api/clock/content-bundle"
  }
}
```

### `POST /api/clock/wisdom-anchor`

Purpose:
Return the active wisdom reference and source-resolved text without exposing a content table.

Response includes:

```json
{
  "as_of": "2026-03-13T20:15:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {},
  "weekly_arc": {},
  "daily_profile": {},
  "wisdom": {
    "ref": "Proverbs 15:1",
    "text": "..."
  },
  "source": {
    "service": "solomonic_clock",
    "api": "/api/clock/wisdom-anchor"
  }
}
```

Rules:

- `wisdom.ref` comes from `WISDOM_REFERENCE_BY_RULER`,
- `wisdom.text` is resolved from source text,
- this endpoint is for clock display/consumption, not Ask Proverbs.

## Daily Content Bundle

The daily content bundle is a clock display/support bundle.

Shape:

```json
{
  "psalm": {
    "ref": "Psalm 45:2",
    "text": "..."
  },
  "wisdom": {
    "ref": "Proverbs 15:1",
    "text": "..."
  },
  "solomonic": {
    "ref": "Key of Solomon, Book II • Mercury Pentacle #5",
    "text": "Purpose: Negotiation success."
  }
}
```

Rules:

- `psalm.ref` is selected by pentacle mapping or ruler fallback.
- `wisdom.ref` is selected by `WISDOM_REFERENCE_BY_RULER`.
- `solomonic.ref` is selected by active pentacle.
- `text` fields are resolved output, not source-of-truth map data.
- Pericope may consume this bundle as context, but Pericope retrieval remains Pericope-owned.

## Clock UI Consumption

Clock UI surfaces may consume references and resolved text differently:

- center labels may show only refs and concise guidance copy,
- drawer bundles may asynchronously load source text,
- scripture study may fetch expanded passage text,
- daily opening may use the active psalm or wisdom reference as its anchor,
- mentor/practice/reflection modes may refer to the reference without embedding the verse.

Rules:

- UI copy can mention a selected reference synchronously.
- UI copy must not require scripture text to be present in the reference map.
- Loading, unavailable, and retry states are valid for source-backed passage text.

## Pericope-Facing Consumption

The clock's Pericope-facing API consumes the same internal contracts:

```text
clock state
  ->
reference maps
  ->
source resolvers
  ->
guided-prompts payload
```

Rules:

- The API may include resolved text in `content_bundle`.
- The API must identify itself as `source.service = "solomonic_clock"`.
- The API must remain clock-context output, not a Pericope chat answer.
- The API must be protected by the shared-secret contract.

## No Duplicate Truth Engines

Do not create separate versions of:

- ruler-to-wisdom selection,
- planetary guidance,
- weekly arc construction,
- daily profile construction,
- prompt derivation,
- content bundle selection.

If any of these need to change, update the clock-owned implementation and the contract tests.

## Required Regression Tests

Tests should protect these guarantees:

- runtime code contains `WISDOM_REFERENCE_BY_RULER`,
- runtime code does not contain `WISDOM_CONTENT_BY_RULER`,
- runtime code does not embed scripture snippets in the ruler map,
- guided-prompts payload identifies `solomonic_clock`,
- guided-prompts auth accepts only server-side shared-secret mechanisms,
- invalid timezone and invalid request input are rejected.

## Prohibited Patterns

Do not:

- embed Proverbs/Ecclesiastes verse text in JS or Python ruler maps,
- duplicate a second wisdom content table for scripture study,
- use source text snippets as static UI constants,
- make Pericope call clock endpoints directly from the browser,
- let clock code shape Pericope final answers,
- let Pericope rebuild clock prompts independently.

## Acceptance Criteria

1. Ruler wisdom data is reference-only.
2. Daily wisdom text is resolved through source lookup.
3. Clock UI handles loading/unavailable source text states.
4. Guided-prompts API uses the same reference/source flow.
5. Pericope receives structured clock context, not duplicated logic.
6. Contract tests prevent reintroducing hardcoded wisdom content.
