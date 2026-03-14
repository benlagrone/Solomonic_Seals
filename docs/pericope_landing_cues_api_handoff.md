# Pericope Landing Cues API Handoff

Status:
Superseded for the current requirement.

Use:
`docs/clock_guided_prompts_api_handoff.md`

## Why This Was Superseded

The current requirement is not a Pericope-owned cue engine.

The current requirement is:

- source logic belongs in `Solomonic_Seals`,
- the API is net-new and clock-owned,
- Pericope consumes that output for landing and empty-chat guided prompts,
- Pericope may proxy or adapt the endpoint,
- Pericope should not rebuild the underlying clock-derived prompt logic.

Simple rule:

- if the prompt should change when the clock logic changes, the clock owns the prompt computation.

## Keep This File Only As A Tombstone Note

Do not use this file as the active implementation handoff unless the architecture is explicitly changed later so that Pericope owns landing-cue generation itself.
