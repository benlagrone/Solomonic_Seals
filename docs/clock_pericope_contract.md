# Clock Contract For PericopeAI

Status: authoritative integration contract

Owner boundary:

- Solomonic Clock owns clock-derived context, guidance computation, source reference selection, and guided prompt generation.
- PericopeAI owns proxying, landing/chat rendering, session lifecycle, author/persona behavior, retrieval, and final answer generation.
- PericopeAI must not reimplement clock selection logic.
- Solomonic Clock must not implement Pericope chat, Ask Proverbs, or author-response behavior.

Ask Proverbs boundary:

- Locked companion contract: [Ask Proverbs Boundary Contract](ask_proverbs_boundary_contract.md).
- Ask Proverbs is Pericope-owned and must not be implemented as a Solomonic Clock endpoint.
- The clock guided-prompts contract and Ask Proverbs contract are separate paths and must not be conflated.

## Runtime Shape

```text
Pericope server-side proxy
  ->
POST /api/pericope/guided-prompts
  ->
Solomonic Clock contract payload
  ->
Pericope landing/chat session
```

The browser must call Pericope, not the clock service directly.

## Endpoint

```text
POST /api/pericope/guided-prompts
```

Required clock-side auth:

```text
X-Solomonic-Clock-Key: <shared-secret>
```

or:

```text
Authorization: Bearer <shared-secret>
```

Clock service env:

```text
SOLOMONIC_GUIDED_PROMPTS_API_KEY=<shared-secret>
```

Rules:

- The shared secret is server-side only.
- Do not put the secret in React, browser JavaScript, build args, or public config.
- Pericope may expose the same path externally, but only through a trusted server-side proxy that injects auth.

## Request

Minimum:

```json
{
  "timezone": "America/Chicago",
  "as_of": "2026-03-13T20:15:00-05:00",
  "limit": 4
}
```

Optional:

```json
{
  "timezone": "America/Chicago",
  "as_of": "2026-03-13T20:15:00-05:00",
  "limit": 4,
  "persona_hint": "solomon",
  "mode": "landing"
}
```

Rules:

- `timezone` should be the user's local IANA timezone.
- `as_of` is optional; if absent, the clock service uses server now.
- `limit` defaults to `4` and is clamped by the clock to `1..6`.
- `persona_hint` is advisory only.
- `mode` is advisory only.

## Response

The clock response is a context object, not a chat answer.

Required top-level fields:

```json
{
  "as_of": "2026-03-13T20:15:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {},
  "weekly_arc": {},
  "daily_profile": {},
  "why_selected": {},
  "content_bundle": {},
  "guided_prompts": [],
  "source": {
    "service": "solomonic_clock",
    "derived_from": []
  }
}
```

### `daily_guidance`

```json
{
  "day": "Friday (Venus)",
  "tone": "Harmony, creativity, and relationship work are favored.",
  "activities": [
    "Repair social friction with diplomacy.",
    "Make time for art or design.",
    "Strengthen key partnerships."
  ]
}
```

### `weekly_arc`

```json
{
  "date_label": "Fri, Mar 13",
  "ruler": "Venus",
  "is_today": true,
  "pentacle": "Mercury #5",
  "focus": "Negotiation success",
  "tone": "Harmony, creativity, and relationship work are favored.",
  "psalm_ref": "Psalm 45:2",
  "wisdom_ref": "Proverbs 15:1"
}
```

### `daily_profile`

```json
{
  "day_label": "Friday ruled by Venus",
  "active_pentacle": "Mercury #5",
  "focus": "Negotiation success",
  "day_tone": "Harmony, creativity, and relationship work are favored.",
  "color": "Emerald",
  "metal": "Copper",
  "angel": "Anael",
  "hour_ruler": "Saturn",
  "hour_index": 18,
  "life_domain_focus": "Relationships",
  "weakest_domain": "Contemplation"
}
```

### `content_bundle`

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

- `content_bundle.wisdom.ref` comes from the clock's ruler-to-reference map.
- `content_bundle.wisdom.text` must be resolved from a source text or source endpoint, not embedded in the ruler map.
- `content_bundle` is display/support context, not Pericope retrieval grounding.
- Pericope may store the bundle, but Pericope remains responsible for any retrieval-backed answer.

### `guided_prompts`

```json
[
  {
    "id": "today-guidance-repair-social-friction",
    "text": "Where should I begin if I need to repair social friction with diplomacy today?",
    "source": "daily_guidance",
    "kind": "practical"
  }
]
```

Rules:

- Prompt text is owned by the clock.
- Pericope may render, rank, hide, or style prompts.
- Pericope must not regenerate equivalent clock prompts with independent logic.

## Pericope Session Contract

When a guided prompt starts chat, Pericope should persist:

```json
{
  "mode": "guided",
  "source": "solomonic_clock",
  "source_prompt_id": "today-guidance-repair-social-friction",
  "message": "Where should I begin if I need to repair social friction with diplomacy today?",
  "mentor_hint": "solomon",
  "clock_context": {
    "as_of": "2026-03-13T20:15:00-05:00",
    "timezone": "America/Chicago",
    "daily_guidance": {},
    "weekly_arc": {},
    "daily_profile": {},
    "why_selected": {},
    "content_bundle": {}
  }
}
```

Rules:

- The first guided user message should be the selected `guided_prompts[].text`.
- `clock_context` stays structured. Do not flatten it into hidden prose.
- Follow-up conversation is normal Pericope chat and should respond to the user, not keep restating the same clock cue.

## Freeform With Optional Clock Context

Freeform chat may omit clock context:

```json
{
  "mode": "freeform",
  "source": "pericope_user",
  "message": "How do I repair a broken friendship?"
}
```

If Pericope attaches light context:

```json
{
  "mode": "freeform",
  "source": "pericope_user",
  "message": "How do I repair a broken friendship?",
  "clock_context": {
    "daily_guidance": {
      "day": "Friday (Venus)"
    },
    "daily_profile": {
      "life_domain_focus": "Relationships"
    }
  }
}
```

Freeform rule:

- The user's question leads.
- Clock context is advisory only.
- Pericope must not force every freeform answer through the clock frame.

## Failure Behavior

If the clock endpoint fails:

- Pericope landing may show generic fallback prompts.
- Freeform chat must continue to work.
- Guided mode should be unavailable or clearly degraded.
- Pericope must not silently switch to a duplicate clock logic implementation.

## Prohibited Couplings

Do not:

- call the clock directly from browser JavaScript,
- expose the shared clock secret to the browser,
- rebuild clock guidance logic in Pericope,
- move Pericope chat or Ask Proverbs behavior into the clock,
- treat `content_bundle.wisdom.text` as the clock's own embedded content library,
- expose raw clock-only symbolic fields in Pericope unless deliberately designed for the UI.

## Acceptance Criteria

1. Pericope consumes `POST /api/pericope/guided-prompts` through a server-side proxy.
2. The proxy injects `X-Solomonic-Clock-Key`.
3. Browser assets do not contain the shared secret.
4. Guided prompts are rendered from the clock response.
5. Guided chat sessions persist structured `clock_context`.
6. Freeform chat works without the clock.
7. Pericope does not reimplement clock prompt or guidance computation.
