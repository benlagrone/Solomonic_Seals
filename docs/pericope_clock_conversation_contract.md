# Pericope + Solomonic Clock Conversation Contract

Status:
This is the locked interface contract for how `Solomonic_Seals` and `PericopeAI` converge around conversation.

Primary rule:

- `clock owns guidance computation`
- `Pericope owns rendering and conversation`

Corollary:

- if a prompt or focus should change when clock logic changes, the clock owns that computation
- Pericope may present, adapt, or proxy that result, but should not rebuild it independently

## Purpose

Define the shared contract for two conversation entry modes:

- `guided`
- `freeform`

Both modes live inside the Pericope chat experience.
They differ in who leads the conversation:

- `guided` is clock-led
- `freeform` is user-led

## Product Model

### Guided

Use when the user wants help starting from today's moment.

Characteristics:

- starts from clock-derived guidance
- shows prompt cards or suggested entry points
- carries stronger session context
- is ideal for landing, empty state, daily opening, and practice mode

### Freeform

Use when the user already has a question.

Characteristics:

- starts from the user's own text
- does not require visible clock framing
- may optionally include light clock context
- remains a normal Pericope conversation first

## Ownership Split

`Solomonic_Seals` owns:

- current clock context
- daily guidance
- weekly arc
- daily profile
- why-selected reasoning
- content bundle
- guided prompts

`PericopeAI` owns:

- landing page rendering
- prompt cards / chips
- empty chat state
- composer behavior
- author / mentor framing inside chat
- full conversation lifecycle

## Core Principle

Guided and freeform should share one chat surface.

Do not build:

- a separate clock chat
- a separate Pericope guided assistant
- two unrelated session models

Instead build:

- one Pericope conversation surface
- two entry modes
- one optional clock context object

## Entry Contract

Pericope landing should present two primary actions:

- `Start with today's guidance`
- `Ask anything`

These map directly to:

- `guided`
- `freeform`

Keep this fork simple and visible.

## Clock Context Contract

The clock exposes the current guidance state through its own API.

Current source endpoint:

- `POST /api/pericope/guided-prompts`

This returns:

- `daily_guidance`
- `weekly_arc`
- `daily_profile`
- `why_selected`
- `content_bundle`
- `guided_prompts`

Pericope uses that response as the source object for `guided` mode.

## Shared Session State

Every Pericope chat session should store:

```json
{
  "mode": "guided",
  "source": "solomonic_clock",
  "source_prompt_id": "weekly-arc-negotiation-success",
  "mentor_hint": "solomon",
  "clock_context": {
    "as_of": "2026-03-14T09:15:00-05:00",
    "timezone": "America/Chicago",
    "daily_guidance": {},
    "weekly_arc": {},
    "daily_profile": {},
    "why_selected": {},
    "content_bundle": {}
  }
}
```

Minimum required fields:

- `mode`
- `source`

Recommended guided-mode fields:

- `source_prompt_id`
- `mentor_hint`
- `clock_context`

Recommended freeform-mode fields:

- `mode: "freeform"`
- `source: "pericope_user"`
- optional `clock_context` only if Pericope deliberately attaches light context

## Request Contract

### Guided Chat Start

When the user clicks a guided prompt card, Pericope should start a chat with:

```json
{
  "mode": "guided",
  "source": "solomonic_clock",
  "source_prompt_id": "life-domain-body-contemplation",
  "message": "How should I apply today's guidance to Body while strengthening Contemplation?",
  "clock_context": {
    "daily_guidance": {
      "day": "Sunday (Sun)"
    },
    "weekly_arc": {
      "focus": "Defense against illness"
    },
    "daily_profile": {
      "focus": "Invisibility before foes",
      "life_domain_focus": "Body",
      "weakest_domain": "Contemplation"
    },
    "content_bundle": {
      "wisdom": {
        "ref": "Proverbs 4:18"
      }
    }
  }
}
```

Rules:

- `message` should be the selected guided prompt text
- `clock_context` should be attached in structured form, not flattened into prose
- Pericope may also persist the full raw clock response on the session if useful

### Freeform Chat Start

When the user starts a normal chat:

```json
{
  "mode": "freeform",
  "source": "pericope_user",
  "message": "How do I repair a broken friendship?"
}
```

Optional light-context variant:

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

- `clock_context` is advisory only
- Pericope must still answer the user's question naturally even if the clock is irrelevant

## Behavior Rules

### Guided Mode

Pericope should:

- preserve the selected prompt text in the first turn
- allow the clock context to shape interpretation strongly
- show subtle context cues in the UI if helpful
- keep the conversation grounded in today's guidance state

Pericope should not:

- ask the user to understand the clock model first
- expose raw symbolic fields unless useful
- pretend the guidance is generic if it is clock-derived

### Freeform Mode

Pericope should:

- prioritize the user's actual question
- use clock context only if it improves relevance
- treat the clock as optional context, not a constraint

Pericope should not:

- force every answer through the daily guidance frame
- reject or reshape the user's intent because the clock says something else

## UI Rules

Landing:

- show `guided` and `freeform` as two first-class choices

Inside chat:

- guided sessions may show subtle context chips such as:
  - day ruler
  - current focus
  - scripture anchor
- freeform sessions should stay visually simple

Do not make the user feel trapped in the chosen mode.

Safe affordances:

- `Use today's guidance`
- `Ask without guidance`
- `Drop clock context`

## Persistence Rules

Recommended session metadata:

```json
{
  "mode": "guided",
  "clock_context_version": "2026-03-14",
  "clock_context_source": "solomonic_clock",
  "clock_context_attached": true
}
```

This matters because guided conversations should remain reproducible relative to the selected moment.

## Prompt Flow Rule

The first guided turn should come from the selected clock prompt.

After that:

- the conversation becomes a normal Pericope thread
- clock context remains available
- Pericope may continue to use it
- but follow-up should respond to the user's evolving questions, not repeatedly restate the same cue

## API Boundary Rule

Clock-owned:

- prompt generation
- guidance computation
- daily context construction

Pericope-owned:

- chat session creation
- message sending
- UI state
- mentor rendering
- fallback behavior when clock is unavailable

## Failure Behavior

If the clock API is unavailable:

- Pericope may fall back to local generic prompt cards for landing
- freeform must still work normally
- guided entry should degrade gracefully, not break chat

## Acceptance Criteria

This contract is satisfied when:

1. Pericope landing clearly offers `guided` and `freeform`.
2. Guided mode starts from clock-derived prompt cards.
3. Freeform mode allows normal chat without visible clock dependence.
4. Guided sessions preserve structured `clock_context`.
5. Freeform sessions may omit `clock_context` entirely.
6. Prompt logic remains owned by `Solomonic_Seals`.
7. Pericope does not reimplement the clock's guidance logic independently.

## Copy/Paste Summary

```text
Use guided and freeform as two entry modes into the same Pericope chat surface.

Rule:
- clock owns guidance computation
- Pericope owns rendering and conversation

Guided mode:
- starts from clock-derived prompt cards
- attaches structured clock_context to the session
- lets that context strongly shape the first turn

Freeform mode:
- starts from the user's own question
- may include light optional clock_context
- must remain user-led and not be forced through the daily guidance frame

Do not build separate truth engines. If a prompt should change when clock logic changes, the clock owns it.
```
