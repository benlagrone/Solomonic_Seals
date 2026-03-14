# Solomonic Clock Guided Prompts API Handoff

Status:
This is the authoritative handoff for the current requirement.

Current decision:

- the source logic belongs in `Solomonic_Seals`,
- the API is net-new and clock-owned,
- Pericope consumes that output for landing / empty-chat guided prompts,
- Pericope should not rebuild this guidance logic independently unless the architecture is explicitly changed later.
- simple rule: if the prompt should change when the clock logic changes, the clock owns the prompt computation.

Use this handoff when the goal is to turn the Solomonic clock's existing daily guidance logic into a net-new API that Pericope can consume for homepage guided prompts.

## Clarified Intent

The homepage should not start from a blank chat box.

When a user lands on Pericope, they should see guided prompts derived from the same logic already powering the Solomonic clock details drawer:

- `Today's planetary guidance`
- `Weekly arc`
- `Daily profile`
- `Why this was selected`
- `Daily content bundle`

Meaning:

- source logic lives in `Solomonic_Seals`,
- Pericope consumes that output,
- the API exists to serve Pericope's landing and empty-chat state.

This is different from inventing an unrelated Pericope-only cue engine.

## Architecture

Correct first-pass shape:

```text
Solomonic Clock drawer logic
  ->
net-new Solomonic API
  ->
Pericope frontend empty state
```

Optional later refinement:

```text
Solomonic Clock API
  ->
Pericope proxy or adapter
  ->
Pericope frontend
```

The key point is that the logic source should be the clock, because the clock already resolves the guidance fields we want to reuse.

Important distinction:

- `who owns the guidance logic`
- `where the HTTP endpoint is exposed`

do not have to be the same.

Clean split:

- `Solomonic_Seals` owns prompt derivation and guidance computation,
- `Pericope` owns landing rendering and conversation flow,
- `Pericope` may proxy or adapt the clock endpoint for deployment convenience,
- `Pericope` should not reimplement the underlying clock-derived prompt logic.

## Why This Belongs In The Clock Project

The required inputs already exist there:

- planetary day guidance,
- weekly arc entry construction,
- daily profile construction,
- explainability reasons,
- daily content bundle construction.

Current source functions in `web/clock.js`:

- `updateDailyGuidance` for tone + action list
- `buildWeeklyArcEntry` for day/ruler/pentacle/focus/scripture pair
- `updateDailyProfile` for active pentacle + correspondences
- `updateExplainabilityPanel` for `why this was selected`
- `updateDailyContentBundle` for psalm/wisdom/solomonic bundle

If Pericope is supposed to use this exact logic, the API should wrap these resolved fields rather than rebuild them elsewhere first.

Otherwise there are two truth engines:

- one in the clock,
- one in Pericope,

and homepage cues will drift as the clock evolves.

## Scope Boundary

In scope:

- a net-new API endpoint in `Solomonic_Seals`,
- response fields derived from current drawer logic,
- a `guided_prompts` array meant for Pericope empty state,
- no breaking changes to the clock visualizer.

Out of scope:

- replacing the clock UI,
- replacing Pericope chat,
- moving all clock logic into Pericope,
- exposing raw SVG or visual-only state,
- changing production ports exposed to the public internet.

## Port / Deployment Rule

Do not change the public production port contract.

External access should still remain behind the existing site entrypoints on `80/443`.

If this API is deployed as a separate service, add it behind existing proxy routing rather than introducing a new public port requirement for users.

Safe options:

- expose a new internal clock service and proxy it under an existing domain path such as `/api/clock/...`,
- or proxy through Pericope's existing backend/API tier.

Unsafe option:

- requiring the frontend to call a new public host:port directly.

## Security Requirement

This endpoint is not meant to be a public anonymous API.

Required rule:

- `Solomonic_Seals` must require a shared secret for `POST /api/pericope/guided-prompts`.

Recommended contract:

- environment variable in the clock service:
  - `SOLOMONIC_GUIDED_PROMPTS_API_KEY`
- accepted request auth:
  - `X-Solomonic-Clock-Key: <shared-secret>`
  - or `Authorization: Bearer <shared-secret>`

Important:

- do **not** put this secret into browser JavaScript,
- do **not** expose it as a React build variable,
- do **not** ask end users to supply it manually.

The secret should be injected by a trusted server-side layer only.

Best first-pass shape:

- Pericope frontend or API proxies to the clock endpoint,
- that proxy adds the shared header server-side,
- browser clients only call Pericope's own path.

## Pericope Proxy Rule

Pericope should consume this endpoint through a server-side proxy, not direct browser-to-clock calls.

Safe shape:

```text
browser
  ->
Pericope frontend/api route
  -> adds X-Solomonic-Clock-Key
  ->
Solomonic clock guided-prompts API
```

Unsafe shape:

```text
browser
  -> directly calls clock host:port with embedded secret
```

If Pericope uses nginx to proxy, inject the secret there.

Example pattern:

```nginx
location = /api/pericope/guided-prompts {
    proxy_pass http://<clock-upstream>/api/pericope/guided-prompts;
    proxy_set_header X-Solomonic-Clock-Key $solomonic_clock_api_key;
}
```

For Linux container deployments, if the upstream is on the host rather than the same Docker network, ensure the frontend container has a valid host-gateway mapping instead of assuming `host.docker.internal` exists automatically.

## Required Endpoint

Add a net-new endpoint in `Solomonic_Seals`.

Recommended:

```text
POST /api/pericope/guided-prompts
```

Reason for `POST`:

- lets Pericope pass timezone and optional timestamp cleanly,
- allows future optional persona hints without endpoint redesign,
- leaves room for later mode switches without path churn.

## Request Contract

Minimum request:

```json
{
  "timezone": "America/Chicago",
  "as_of": "2026-03-13T20:15:00-05:00",
  "limit": 4
}
```

Optional future request:

```json
{
  "timezone": "America/Chicago",
  "as_of": "2026-03-13T20:15:00-05:00",
  "limit": 4,
  "persona_hint": "augustine",
  "mode": "landing"
}
```

Rules:

- `timezone` preferred so day interpretation is user-local.
- `as_of` optional. Default to server `now`.
- `limit` default `4`, clamp to `1..6`.
- `persona_hint` optional and advisory only.
- the API should work without any Pericope author selection.

## Response Contract

Example response:

```json
{
  "as_of": "2026-03-13T20:15:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {
    "day": "Friday (Venus)",
    "tone": "Harmony, creativity, and relationship work are favored.",
    "activities": [
      "Repair social friction with diplomacy.",
      "Make time for art or design.",
      "Strengthen key partnerships."
    ]
  },
  "weekly_arc": {
    "date_label": "Fri, Mar 13",
    "ruler": "Venus",
    "is_today": true,
    "pentacle": "Mercury #5",
    "focus": "Negotiation success",
    "psalm_ref": "Psalm 45:2",
    "wisdom_ref": "Proverbs 15:1"
  },
  "daily_profile": {
    "day_label": "Friday ruled by Venus",
    "active_pentacle": "Mercury #7",
    "focus": "Safe travel",
    "color": "Emerald",
    "metal": "Copper",
    "angel": "Anael"
  },
  "why_selected": {
    "reasons": [
      "Friday is ruled by Venus, so Venus-aligned intentions are prioritized.",
      "Planetary hour proxy: local hour 18 resolves to Saturn in the Chaldean sequence.",
      "Active spirit sector: Gemini 10-15 (Eligos) informs the sign layer.",
      "Active pentacle rule: Mercury #7 (Safe travel).",
      "Primary scripture citation: fallback psalm is used when this pentacle has no direct Psalm note."
    ],
    "citation": "Citation source: Key of Solomon, Book II"
  },
  "content_bundle": {
    "psalm": {
      "ref": "Psalm 45:2",
      "text": "Loading psalm excerpt..."
    },
    "wisdom": {
      "ref": "Proverbs 15:1",
      "text": "A soft answer turneth away wrath: but grievous words stir up anger."
    },
    "solomonic": {
      "ref": "Key of Solomon, Book II • Mercury Pentacle #7",
      "text": "Purpose: Safe travel."
    }
  },
  "guided_prompts": [
    {
      "id": "today-guidance-diplomacy",
      "text": "What should I do today about social friction and diplomacy?",
      "source": "daily_guidance"
    },
    {
      "id": "weekly-arc-negotiation",
      "text": "What does negotiation success require today?",
      "source": "weekly_arc"
    },
    {
      "id": "profile-safe-travel",
      "text": "Why is safe travel the suggested focus today?",
      "source": "daily_profile"
    },
    {
      "id": "bundle-proverbs",
      "text": "How should I apply Proverbs 15:1 today?",
      "source": "content_bundle"
    }
  ],
  "source": {
    "service": "solomonic_clock",
    "derived_from": [
      "daily_guidance",
      "weekly_arc",
      "daily_profile",
      "explainability",
      "content_bundle"
    ]
  }
}
```

## Prompt Generation Rule

These are guided prompts, not generic sample questions.

They should tell the arriving user what to do or ask next based on the current guidance state.

Good prompt patterns:

- `What should I do today about social friction and diplomacy?`
- `What does negotiation success require today?`
- `How should I apply Proverbs 15:1 today?`
- `Why is safe travel the suggested focus today?`
- `What does today's guidance say about partnership, restraint, or travel?`

Bad prompt patterns:

- generic chat filler with no tie to current state,
- raw symbolic labels with no action,
- prompts that require the user to already understand the clock model.

## Suggested Derivation Rules

Build prompts from the existing resolved fields:

1. `daily_guidance.activities`
   Turn 1 to 2 activities into action-oriented questions.
2. `weekly_arc.focus`
   Turn the focus into a direct "what does this require today?" prompt.
3. `daily_profile.focus`
   Turn the suggested focus into a "why this focus?" or "how should I approach this?" prompt.
4. `content_bundle.wisdom.ref` and `content_bundle.wisdom.text`
   Turn the wisdom anchor into an application question.
5. `why_selected.reasons`
   Use one reasoning-oriented prompt when the selection logic is especially meaningful.

Priority:

- practical prompt first,
- interpretive prompt second,
- scripture / wisdom application prompt third,
- explainability prompt fourth.

## Frontend Consumption Rule

Pericope should call this endpoint only for the empty-chat state.

Expected UI behavior:

- fetch guided prompts on landing,
- render 3 to 5 prompt cards or chips,
- clicking a prompt fills the composer or submits directly,
- once the user starts chatting, the normal chat flow takes over.

If the API fails, Pericope can fall back to local hard-coded prompts.

## Acceptance Criteria

The handoff is complete when:

1. `Solomonic_Seals` exposes a net-new guided-prompts endpoint.
2. The endpoint reuses current drawer logic rather than duplicating it elsewhere first.
3. Response contains both the underlying guidance sections and `guided_prompts`.
4. The prompt list is derived from current day state and is not generic filler.
5. The contract is usable by Pericope's empty-chat state with no public port changes.
6. At least one verification example shows real prompt output for a current date/time.

## Suggested Verification

Example:

```bash
curl -s http://localhost:8086/api/pericope/guided-prompts \
  -H 'Content-Type: application/json' \
  -d '{"timezone":"America/Chicago","as_of":"2026-03-13T20:15:00-05:00","limit":4}'
```

The verification result should show:

- today's day/ruler,
- current weekly arc entry,
- current profile,
- explainability reasons,
- 3 to 5 guided prompts derived from those sections.

## Copy/Paste Prompt For Codex (Clock Repo)

```text
You are in the Solomonic_Seals project. Task: expose the existing daily guidance drawer logic as a net-new API that Pericope can consume for empty-state guided prompts.

Goal:
- Add a new endpoint in Solomonic_Seals, recommended as POST /api/pericope/guided-prompts.
- Reuse current drawer logic instead of inventing a separate cue engine.
- The API should serve Pericope's landing state so users see guided prompts instead of a blank chat box.

Use the current source logic already in web/clock.js:
- updateDailyGuidance
- buildWeeklyArcEntry
- updateDailyProfile
- updateExplainabilityPanel
- updateDailyContentBundle

Required behavior:
- accept timezone, optional as_of timestamp, and limit
- resolve the same current-state guidance the drawer already shows
- return:
  - daily_guidance
  - weekly_arc
  - daily_profile
  - why_selected
  - content_bundle
  - guided_prompts

Prompt requirements:
- guided prompts, not generic filler
- derive them from the current resolved fields
- examples:
  - What does negotiation success require today?
  - Why is safe travel the suggested focus today?
  - How should I apply Proverbs 15:1 today?

Deployment rule:
- do not require a new public port
- keep external access behind existing site proxying
- this is a net-new API, not a replacement for /api/clock

Deliverables:
1. endpoint implementation
2. any helper extraction/refactoring needed so the logic can be reused cleanly
3. verification command with sample JSON output
4. short report listing the functions reused and the response schema
```

## Decision Summary

The corrected direction is:

- keep the guidance logic in the Solomonic clock project,
- expose it as a net-new API,
- use that API to give Pericope guided prompts on landing,
- avoid public port changes,
- keep the UI focused on guidance, not raw symbolic jargon.
