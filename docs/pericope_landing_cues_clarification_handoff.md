# Pericope Landing Cues Clarification Handoff

Status:
Superseded for the current requirement.

This clarification only applies to the alternate Pericope-owned landing-cues architecture.

For the active requirement, use:
`docs/clock_guided_prompts_api_handoff.md`

Current decision:

- guidance logic belongs in the clock,
- the clock exposes a net-new API,
- Pericope consumes that API for landing prompts.

Use this note in the Pericope thread if there is confusion about whether the homepage cue API belongs to Pericope or to the Solomonic clock.

## Clarification

The landing-cues API should be a PericopeAI endpoint.

It should not be implemented as a Solomonic Clock endpoint.

However, the long-term intent is still that the Solomonic clock can inform those cues.

So the correct architecture is:

```text
Solomonic Clock
  ->
semantic context
  ->
Pericope landing-cues API
  ->
frontend landing state
```

Not:

```text
Solomonic Clock
  ->
frontend directly
```

And not:

```text
Solomonic Clock
  ->
own landing API
  ->
Pericope
```

## The Likely Misunderstanding

Two different questions got conflated:

1. Where should the landing-cues endpoint live?
2. Where should the guidance logic eventually come from?

Answer:

- the endpoint lives in PericopeAI,
- some of its future inputs may come from the Solomonic clock,
- the response remains plain-language and Pericope-owned.

## Ownership Split

### PericopeAI owns

- `POST /api/v1/landing/cues`
- homepage response contract
- plain-language `today_focus`
- prompt suggestions
- suggested authors
- explanation text
- author-aware curation

### Solomonic Clock owns

- temporal state
- symbolic state
- virtue/domain signals
- optional clock context handoff

### Frontend owns

- landing cards
- chips/buttons
- click-to-fill behavior
- presentation of cue sets

## What the Clock Should Eventually Provide

The clock should not provide raw symbolic labels to the homepage.

It should provide compact semantic context that Pericope can translate.

Good future handoff shape:

```json
{
  "phase": "examination",
  "virtue": "temperance",
  "domain_focus": "desire",
  "discipline_mode": "restraint",
  "tags": ["friday", "evening", "penitence"]
}
```

Bad homepage-facing shape:

```json
{
  "planet": "Mars",
  "sector": "Leraje",
  "pentacle": "Mercury 5"
}
```

Pericope should translate symbolic state into:

- plain-language focus,
- prompts,
- suggested authors,
- brief explanation.

## Implementation Decision

### Phase 1

Implement the landing-cues API inside Pericope without any clock dependency.

Endpoint:

```text
POST /api/v1/landing/cues
```

Rules:

- additive only
- no changes to existing chat endpoints
- rule-based fallback is acceptable
- response must be stable without clock input

### Phase 2

Allow Pericope to accept optional clock context.

Example request:

```json
{
  "author_slug": "augustine",
  "timezone": "America/Chicago",
  "limit": 4,
  "clock_context": {
    "phase": "examination",
    "virtue": "temperance",
    "domain_focus": "desire",
    "discipline_mode": "restraint",
    "tags": ["friday", "evening", "penitence"]
  }
}
```

Important rule:

- `clock_context` influences the response,
- it does not change the response schema,
- Pericope still owns the final wording.

## Architectural Rule

The clock is a context provider.

Pericope is the landing-cues interpreter.

If both systems later need a shared interface, the extraction target is a small clock-context contract, not a separate landing-cues service.

Meaning:

- do not move `landing/cues` into Solomonic_Seals,
- do not create a second homepage-cues API in the clock repo,
- do not expose raw symbolic labels directly to the Pericope homepage.

## Recommended Message Back to the Pericope Thread

Use this:

```text
Clarification: the landing-cues endpoint should still live in PericopeAI as a net-new Pericope API.

The misunderstanding is that “clock-informed” does not mean “clock-owned endpoint.”

The Solomonic clock should eventually provide compact semantic context such as phase, virtue, domain_focus, discipline_mode, and tags. Pericope should consume that context and translate it into plain-language homepage cues, prompts, suggested authors, and explanation text.

So the correct split is:

- Pericope owns POST /api/v1/landing/cues and the frontend response contract.
- Solomonic_Seals later supplies optional clock_context.
- The homepage should not expose raw symbolic labels like planetary hour, sector name, or spirit name.

Phase 1 should still ship without a clock dependency.
Phase 2 should accept optional clock_context without changing the response schema.
```

## Decision Summary

The requirement is not:

- "build the landing-cues API in the clock repo"

The requirement is:

- "build the landing-cues API in Pericope, but design it so the Solomonic clock can later inform it through semantic context"
