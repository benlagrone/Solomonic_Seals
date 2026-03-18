# Pericope Chat Launch Handoff

Purpose:
This handoff is for the Pericope Codex chat.

Goal:
Implement the Pericope-side receiving contract for launches originating from the Solomonic clock, so the clock can stop being only a visual instrument and start handing users into a real conversation flow.

This handoff also defines another concrete Solomonic clock API use case:

- `guided-prompts` answers `what should Pericope show before chat starts?`
- `chat-launch` answers `how should the clock hand the user into Pericope once a launch choice is made?`

Status:

- the clock now has a local action/reflection loop
- the clock already exposes `POST /api/pericope/guided-prompts`
- Pericope now supports first-pass URL bootstrap for:
  - `guided`
  - `freeform`
- Pericope chat now accepts launch metadata fields:
  - `source`
  - `source_prompt_id`
  - `mentor_hint`
  - `clock_context`
- Pericope history/session reads now surface persisted launch metadata
- optional Phase 2 endpoint `POST /api/pericope/chat-launch` is still not implemented

Authoritative upstream docs:

- [clock_guided_prompts_api_handoff.md](/Users/benjaminlagrone/Documents/projects/pericopeai.com/Solomonic_Seals/docs/clock_guided_prompts_api_handoff.md)
- [pericope_fe_guided_prompts_secure_proxy_handoff.md](/Users/benjaminlagrone/Documents/projects/pericopeai.com/Solomonic_Seals/docs/pericope_fe_guided_prompts_secure_proxy_handoff.md)
- [pericope_clock_conversation_contract.md](/Users/benjaminlagrone/Documents/projects/pericopeai.com/Solomonic_Seals/docs/pericope_clock_conversation_contract.md)

## Primary Rule

Keep this architecture intact:

- `clock owns guidance computation`
- `Pericope owns rendering and conversation`

Pericope should not rebuild the clock’s guidance logic.
Pericope should receive launch intent and context, then turn that into a chat session.

## What Needs To Be Built In Pericope

Pericope needs to support two launch modes from outside the chat UI:

- `guided`
- `freeform`

Those launches should initialize a Pericope session cleanly and predictably.

## Why This Work Belongs In Pericope

The clock can decide:

- what the day means
- what the suggested practice is
- which prompt is being offered

But only Pericope can decide:

- how a new chat session is created
- how the first message is inserted
- how `guided` vs `freeform` is preserved through the thread
- how context chips or session labels are shown

So the next usefulness step is Pericope-side session bootstrap.

## Another Solomonic Clock API Use Case

This is the second clock-to-Pericope integration use case after:

- `POST /api/pericope/guided-prompts`

The split is:

- `guided-prompts` = fetch clock-derived guidance for landing / empty-chat UI
- `chat-launch` = hand a user from clock context into a real Pericope conversation

Important clarification:

- the launch use case is real now
- a net-new clock endpoint is not required for the MVP
- the first pass can be implemented by composing a Pericope launch URL from clock state the app already has

Later, if launch payload construction needs to be canonicalized server-side, the clock may expose a dedicated launch endpoint.

## First-Pass Transport Decision

Recommended first-pass approach:

- accept launch state via URL parameters
- decode into a Pericope bootstrap object
- initialize chat from that object
- then scrub the URL

Why this is the right first pass:

- the clock is currently a standalone web app
- it can launch Pericope by URL immediately
- this avoids requiring a new shared bootstrap service before the UX is proven

Later, if needed, this can become:

- a POST bootstrap endpoint
- or a persisted session bootstrap object

But URL bootstrap is the correct first implementation.

## Optional Phase 2 Clock Launch Endpoint

Do not block the first implementation on this.

If launch construction later needs signing, persistence, or reuse outside the current web app, the clock can add:

```text
POST /api/pericope/chat-launch
```

Purpose:

- return a canonical launch payload derived from current clock state
- optionally return a ready-to-use Pericope launch URL
- keep launch construction consistent across web, notifications, email, and future native shells

Example request:

```json
{
  "mode": "guided",
  "timezone": "America/Chicago",
  "as_of": "2026-03-16T09:12:00-05:00",
  "prompt_id": "life-domain-relationships-contemplation",
  "message_override": null
}
```

Example response:

```json
{
  "mode": "guided",
  "source": "solomonic_clock",
  "message": "How should I practice patience and reconciliation in relationships today?",
  "prompt_id": "life-domain-relationships-contemplation",
  "ctx": "eyJhc19vZiI6IjIwMjYtMDMtMTZUMDk6MTI6MDAtMDU6MDAiLCJ0aW1lem9uZSI6IkFtZXJpY2EvQ2hpY2FnbyJ9",
  "launch_url": "/chat?mode=guided&source=solomonic_clock&message=How%20should%20I%20practice%20patience...&prompt_id=life-domain-relationships-contemplation&ctx=eyJ..."
}
```

Rules for this optional endpoint:

- it prepares launch state
- it does not create the Pericope conversation itself
- Pericope still owns session creation, rendering, and thread lifecycle
- the payload it returns should stay aligned with the URL bootstrap contract below

Only introduce this endpoint when at least one of these becomes true:

- launch URLs are getting too large or fragile
- launch payloads need signing or tamper resistance
- multiple clock surfaces need one shared launch builder
- notifications or scheduled jobs need to generate launches without a browser session

## Required Pericope Launch Contract

Pericope should accept a route like:

```text
/chat?mode=guided&source=solomonic_clock&message=...&prompt_id=...&ctx=...
```

Recommended parameters:

- `mode`
  - `guided` or `freeform`
- `source`
  - `solomonic_clock`
- `message`
  - initial user-facing prompt text
- `prompt_id`
  - source prompt id if available
- `ctx`
  - base64url-encoded JSON clock context

## Clock Context Encoding

For the first pass, `ctx` should be:

- UTF-8 JSON
- base64url encoded

Example decoded shape:

```json
{
  "as_of": "2026-03-16T09:12:00-05:00",
  "timezone": "America/Chicago",
  "daily_guidance": {
    "day": "Monday (Moon)",
    "tone": "Reflection, receptivity, and home-centered work are favored."
  },
  "weekly_arc": {
    "focus": "Peace and reconciliation"
  },
  "daily_profile": {
    "focus": "Peace and reconciliation",
    "life_domain_focus": "Relationships",
    "weakest_domain": "Contemplation"
  },
  "content_bundle": {
    "wisdom": {
      "ref": "Ecclesiastes 3:1"
    }
  }
}
```

Pericope should treat `ctx` as:

- trusted enough for UX initialization
- not a replacement for backend authorization
- optional in freeform mode

## Guided Launch Behavior

When Pericope receives:

```text
mode=guided
```

it should:

1. create or bootstrap a new chat session
2. set session metadata:
   - `mode: guided`
   - `source: solomonic_clock`
   - `source_prompt_id`
   - `clock_context`
3. use `message` as the first composer or first submitted user message
4. preserve the attached `clock_context` through the thread
5. optionally show subtle context chips:
   - day ruler
   - current focus
   - scripture anchor

Guided rule:

- this should feel like “start me from today’s guidance”
- not like a generic empty chat

## Freeform Launch Behavior

When Pericope receives:

```text
mode=freeform
```

it should:

1. create or bootstrap a normal chat
2. set session metadata:
   - `mode: freeform`
   - `source: solomonic_clock`
3. treat `message` as optional
4. treat `clock_context` as advisory only if present
5. allow the conversation to proceed as a normal user-led chat

Freeform rule:

- clock context must never overpower the user’s own question

## URL Hygiene Rule

After Pericope reads the bootstrap parameters:

- normalize them into app/session state
- then remove them from the visible URL with history replace

Why:

- avoids ugly share URLs
- avoids repeated re-bootstrap on refresh
- keeps the launch mechanism internal after hydration

## Practical Use Cases

### 1. Guided Prompt Card -> Pericope Chat

Flow:

- Pericope or the clock fetches `POST /api/pericope/guided-prompts`
- user clicks a guided prompt
- clock launches Pericope with:
  - `mode=guided`
  - prompt text as `message`
  - selected `prompt_id`
  - attached clock `ctx`

This is the primary near-term use case.

### 2. Freeform Reflection From The Clock

Flow:

- user is on the clock and wants to ask their own question
- the clock launches Pericope with:
  - `mode=freeform`
  - optional seed `message`
  - optional light `ctx`

This keeps the clock from being a dead end while preserving a normal Pericope conversation.

### 3. Scheduled Or Notification-Based Launch

Later flow:

- a daily oracle, notification, or email CTA points into Pericope
- the launch payload is built from the same clock context contract
- if needed, the optional `POST /api/pericope/chat-launch` endpoint returns the canonical launch state

This is the strongest reason to add the Phase 2 endpoint.

## Failure Behavior

If `ctx` is missing, invalid, or undecodable:

- guided mode should still start with the provided `message`
- freeform mode should still start normally
- no hard crash

If `mode` is invalid:

- fall back to `freeform`

If `message` is empty:

- guided: fall back to a generic clock-origin prompt
- freeform: show normal empty composer

## Session Metadata Contract

Recommended session metadata inside Pericope:

```json
{
  "mode": "guided",
  "source": "solomonic_clock",
  "source_prompt_id": "life-domain-relationships-contemplation",
  "clock_context_attached": true,
  "clock_context": {}
}
```

Minimum useful fields:

- `mode`
- `source`
- `clock_context_attached`

Preferred fields:

- `source_prompt_id`
- `clock_context`

## UI Expectations

Pericope landing and chat should make the fork obvious:

- `Start with today's guidance`
- `Ask anything`

Inside chat:

- guided sessions may show light context chips
- freeform sessions should stay visually minimal

Do not create a separate clock-only chat UI.

## Suggested Pericope File Targets

Likely relevant files:

- `AugustineFE/src/App.js`
- Pericope router / chat bootstrap layer
- any chat session store or reducer
- any URL parsing / startup logic
- optionally backend session models if Pericope persists this server-side

## Acceptance Criteria

This handoff is complete when:

1. Pericope accepts external launch state for `guided` and `freeform`.
2. Guided launches preserve `clock_context`.
3. Freeform launches remain user-led.
4. Launch URLs are scrubbed after hydration.
5. Invalid bootstrap payloads degrade gracefully.
6. Pericope does not reimplement clock guidance logic.

## Example Guided Launch URL

Illustrative shape only:

```text
/chat?mode=guided&source=solomonic_clock&prompt_id=relationships-temperance&message=How%20should%20I%20practice%20temperance%20in%20relationships%20today%3F&ctx=eyJhc19vZiI6Ii4uLiJ9
```

## Example Freeform Launch URL

```text
/chat?mode=freeform&source=solomonic_clock&message=How%20do%20I%20repair%20a%20strained%20friendship%3F
```

## Copy/Paste Prompt For Pericope Codex Chat

```text
Implement the Pericope-side receiving contract for launches coming from the Solomonic clock.

Context:
- The clock already owns guidance computation.
- Pericope should own conversation/session bootstrap.
- The next product step is to let the clock launch Pericope in either guided or freeform mode.

Build a first-pass URL bootstrap contract for Pericope chat.

Required behavior:
- Accept launch state via URL params:
  - mode=guided|freeform
  - source=solomonic_clock
  - message=<initial text>
  - prompt_id=<optional source prompt id>
  - ctx=<optional base64url encoded JSON clock context>
- Decode the launch payload into chat/session state
- Guided mode:
  - create a guided session
  - preserve clock_context
  - use the provided message as the first prompt/composer seed
- Freeform mode:
  - create a normal user-led session
  - treat clock_context as optional/advisory only
- After hydration, scrub launch params from the URL with history replace
- Invalid/missing payloads must degrade gracefully

Important:
- Do not rebuild the clock guidance logic in Pericope
- Keep the architecture:
  - clock owns guidance computation
  - Pericope owns rendering and conversation

Relevant upstream docs in Solomonic_Seals:
- docs/pericope_clock_conversation_contract.md
- docs/clock_guided_prompts_api_handoff.md
- docs/pericope_fe_guided_prompts_secure_proxy_handoff.md

Deliverables:
1. URL bootstrap parser for guided/freeform launch
2. Session metadata wiring
3. Graceful fallback behavior
4. Short verification notes

Important implementation note:
- do not add a new clock launch endpoint for MVP unless there is a concrete payload-sharing problem
- but keep the bootstrap contract clean enough that `POST /api/pericope/chat-launch` can be added later without redesign
```
