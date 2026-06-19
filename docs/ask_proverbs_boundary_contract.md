# Ask Proverbs Boundary Contract

Status: locked cross-project contract

Companion Pericope document:

```text
AugustineFE/docs/ask-proverbs-feature-development-plan.md
```

## Decision

Ask Proverbs is a PericopeAI feature, not a Solomonic Clock feature.

`Solomonic_Seals` may keep its own wisdom anchors for clock-derived guidance, but it must not own or serve the Ask Proverbs page, API, prompt shaping, retrieval behavior, or answer structure.

## Ownership

### PericopeAI Owns

- `/ask-proverbs`
- `GET /api/v1/proverbs/content`
- `mode: "ask_proverbs"` chat handling
- Proverbs landing/page content
- the Ask Proverbs prompt contract
- Proverbs-first or Proverbs-only retrieval scoping
- Solomon author/sidebar presentation
- answer rendering, references, citations, sessions, traces, and persistence

Pericope answers:

```text
Which Proverbs should guide this user's situation, and how should they be applied?
```

### Solomonic Clock Owns

- clock-derived timing and guidance
- ruler, pentacle, daily profile, weekly arc, and why-selected logic
- clock-specific `content_bundle`
- guided prompt generation for clock-led Pericope starts
- clock UI and clock-to-Pericope launch behavior

The clock answers:

```text
What is today's clock-derived symbolic guidance?
```

## Runtime Boundary

First-pass Ask Proverbs runtime:

```text
browser
  ->
Pericope frontend /ask-proverbs
  ->
Pericope API GET /api/v1/proverbs/content
  ->
Pericope API POST /api/v2/chat mode=ask_proverbs
  ->
Pericope retrieval/citation/session stack
```

Solomonic Clock is intentionally absent from that path.

API-first sequencing rule:

- Pericope must build and verify all Ask Proverbs APIs before removing or migrating frontend logic.
- The required API surfaces are implemented in Pericope API: `GET /api/v1/proverbs/content`, `POST /api/v2/chat` with `mode: "ask_proverbs"`, and Proverbs-scoped retrieval/metadata behavior.
- `mode: "ask_proverbs"` resolves to `persona: "solomon"` and `source_scope: "proverbs"` server-side.
- The public v2 chat response includes resolved `mode`, `persona`, `source_scope`, `referenced_books`, `metadata`, and the normal segmented answer payload.
- Frontend route scaffolding is allowed only if it is non-destructive and does not remove existing frontend logic before API verification.

Existing clock-led guidance runtime remains separate:

```text
browser
  ->
Pericope proxy /api/pericope/guided-prompts
  ->
Solomonic Clock POST /api/pericope/guided-prompts
  ->
Pericope guided/freeform chat start
```

These two paths must not be conflated.

## Optional Future Handoff

If the clock later informs Ask Proverbs, the only allowed shape is compact advisory context passed into Pericope.

Allowed example:

```json
{
  "source": "solomonic_clock",
  "domain_focus": "speech",
  "virtue": "restraint",
  "tags": ["conflict", "anger"]
}
```

Rules:

- optional only,
- advisory only,
- Pericope-owned wording only,
- no raw planet, pentacle, spirit, sector, or clock-only symbolic fields in the Ask Proverbs UI,
- no change to the public Ask Proverbs response schema.

## Prohibited Couplings

Do not:

- call Solomonic Clock from `/ask-proverbs` in the first-pass feature,
- serve `GET /api/v1/proverbs/content` from `Solomonic_Seals`,
- implement `mode: "ask_proverbs"` inside `Solomonic_Seals`,
- import `web/clock.js` or clock runtime code into Pericope,
- duplicate the clock's time/ruler/pentacle computation in Pericope,
- expose raw clock symbolic state in the Ask Proverbs page,
- create a separate clock-owned Ask Proverbs chat/session model.

## Allowed Duplication

Pericope may duplicate the idea of a small Proverbs/wisdom anchor catalog from the clock's `WISDOM_REFERENCE_BY_RULER`, but the duplicated catalog becomes Pericope-owned data.

Rules:

- copy only content/reference concepts, not clock timing logic,
- store Pericope's catalog under the Pericope backend,
- treat Pericope's catalog as landing/fallback content, not the full retrieval corpus,
- keep retrieval grounding in Pericope's corpus/retrieval layer.

## Dev Start Checklist

Before implementation starts, both projects should agree that:

- Pericope docs identify Ask Proverbs as Pericope-owned.
- Solomonic docs identify Ask Proverbs as outside clock ownership.
- Fortress deployed architecture documents the cross-project boundary.
- Pericope APIs are built and verified before frontend logic is removed or migrated.
- No new clock endpoint is required for Ask Proverbs.
- No existing clock guided prompt contract is replaced by Ask Proverbs.
