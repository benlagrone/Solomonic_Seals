# SolomonicSchedule v1

Status: version 1.0.0 interface specification, extracted against
`949952c632a8abebde83cd541f93fb01d7635417`. Documentation-only release;
no schedule producer or compatibility adapter is wired into the UI.
See the [current implementation inventory](clock_contract_inventory.md).

**Do not replace the existing production Clock. Establish compatibility first.**

## Boundary and ownership

`SolomonicSchedule` is a JSON display/read contract. A producer resolves time,
Clock context and any advisory schedule entries; the public Contabo renderer
receives ordinary data. Timefold, if later selected, stays behind a producer
adapter. No solver class names, planning entities, score objects, callbacks,
job polling protocol or solver dependency belongs in this contract or browser.

The Clock remains authoritative for symbolic/time interpretation and guidance.
Pericope remains authoritative for its source-grounded conversation. A future
scheduler may allocate work within explicit user/resource constraints; neither
symbolic guidance nor a Pericope message silently becomes such a constraint.
Version 1 defines delivery and compatibility, not a new optimization policy.

## Wire types

The following TypeScript-style declarations specify JSON values (not executable
application code). `Instant` is an RFC 3339 timestamp with explicit offset;
`Timezone` is an IANA zone. Strings must not contain HTML for execution.
Required fields are those without `?`; `null` means explicitly unavailable,
whereas an omitted optional field means not supplied.

```typescript
type Instant = string;
type Timezone = string;
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type LegacyObject = { [key: string]: Json };

interface SolomonicSchedule {
  contract: "SolomonicSchedule";
  schema_version: "1.0.0";
  schedule_id: string;             // opaque identity, scoped to audience + horizon
  revision: number;                // integer >= 1; increases within this identity
  generated_at: Instant;           // creation time, not the interpreted time
  as_of: Instant;                  // instant whose Clock state was resolved
  timezone: Timezone;
  audience: "public" | "private";
  temporal_policy: "fixed_now" | "snapshot";
  horizon: { start: Instant; end: Instant }; // half-open [start, end)
  valid_until: Instant;            // freshness boundary, not an event end
  status: "ready" | "degraded" | "unavailable";
  producer: {
    service: string;               // logical service, no infrastructure secrets
    version: string;               // exact producing implementation revision
    rules_version: string;         // version of selection/time/constraint policy
  };
  catalog: {
    id: "solomonic_clock_full";
    sha256: string;                // 64 lowercase hex chars of exact catalog bytes
  };
  clock: {
    runtime: LegacyObject | null;  // exact current /api/clock/runtime JSON payload
    context: LegacyObject | null;  // exact clock-context-v2 JSON payload
  };
  entries: ScheduleEntry[];
  unassigned: { item_id: string; reason_codes: string[] }[];
  warnings: {
    code: string;
    message: string;              // safe, displayable plain text
    entry_id?: string;
  }[];
  sources: Source[];
}

interface ScheduleEntry {
  id: string;                     // stable across revisions for the same item
  kind: "planetary_hour" | "practice" | "reading" | "activity";
  title: string;
  start: Instant;
  end: Instant;
  state: "proposed" | "confirmed" | "cancelled";
  basis: "clock_rule" | "user_input" | "scheduler";
  rationale: string;              // explanation, not executable instructions
  source_ids: string[];
  clock_refs?: {
    sector?: number;              // integer 1..72, NOT array offset
    pentacle_key?: string;        // existing lowercase key, e.g. mars-5
    scripture_refs?: string[];    // retain numbering/edition in source records
    life_domain_id?: string;      // existing data/life_domains.json ID
  };
  interpretation?: {
    mode: "guided" | "freeform";
    source_prompt_id: string | null;
    message: string;              // preserve selected/user text verbatim
    source_ids: string[];
  };
}

interface Source {
  id: string;
  kind: "clock_rule" | "source_passage" | "generated_interpretation" | "user_input";
  reference: string;              // source/rule identifier or passage reference
  version: string | null;         // unknown provenance must remain unknown
  resolution: "resolved" | "fallback" | "unavailable";
  edition?: string;
  numbering?: string;
  text?: string;                  // only authorized, source-resolved excerpt
}
```

The two legacy payloads are deliberately lossless compatibility objects, not
an invitation to invent fields. Their required structure is the output of
`_build_clock_runtime_payload` and `_build_clock_context_payload` at the baseline
revision, including nested nulls, strings, arrays, indexes and provenance.
Context requires `schema_version: clock-context-v2`. Runtime requires all 16
top-level fields enumerated in the inventory. Unknown additive legacy fields
must be preserved. Shape validation alone is insufficient: captured fixtures
and field-by-field parity are the acceptance test for these objects.

## Semantics and invariants

1. All times resolve to instants, with `horizon.start <= as_of < horizon.end`,
   `start < end` for every entry, and entries contained within the horizon.
   Compare UTC instants, not timestamp strings or wall-clock hour numbers.
   Offsets must agree with the declared zone at that instant; DST gaps and
   repeated hours cannot be represented using naive local times.
2. `clock.runtime.as_of` and `clock.context.as_of`, when present, equal the
   envelope `as_of` as instants, and their timezones equal the envelope zone.
   Construct both from one captured instant internally. Do not combine separate
   public calls across a boundary and claim an atomic snapshot.
3. Preserve runtime location and calculation/fallback status. Preserve the
   distinction between solar runtime hour and civil context guidance. V1 does
   not require their rulers, sector indices or validity boundaries to agree.
4. `ready` requires both Clock objects. `degraded` requires at least one and a
   warning explaining missing/fallback components. `unavailable` has null Clock
   objects and empty entries/unassigned; include a diagnostic warning. Solar
   fallback and unresolved source text must be disclosed, not labeled fully
   resolved. No exact interval may be fabricated from a null legacy boundary.
5. `valid_until > generated_at` on publication. For live content it is no later
   than the earliest applicable refresh/content boundary (including the current
   minute runtime refresh and civil guidance boundary). After expiration the
   consumer treats the schedule as stale; it may show a clearly labeled last
   known snapshot or continue using the existing Clock fallback. It must not
   present stale entries as current authoritative results.
6. `entries` may be empty: the existing Clock has no task-allocation service.
   Absence of proposed work is not solver failure. Overlap is permitted between
   a planetary-hour background interval and a practice/reading/activity. V1
   does not assert resource feasibility. All-day, recurrence and resource
   assignment formats are intentionally outside this version.
7. Entry/source IDs are unique in the response; every source reference resolves
   within `sources`. References into the catalog/domain file must exist in the
   pinned version. Preserve ordering of legacy arrays. Sort new entries by UTC
   start then ID for stable delivery.
8. Producer retries for one revision return identical content. Revision changes
   when rendered data changes; old revisions must not overwrite newer ones.
   `schedule_id` must not expose user identifiers. Public envelopes contain no
   private tasks, messages, scores, history, auth tokens or shared secrets;
   private envelopes require existing user authorization and private/no-store
   delivery. Keep catalog caching separate from personalized schedules.
9. Source passages, generated interpretation and user input remain separate
   evidence kinds. Missing source text can retain its reference and unavailable
   status. `Purpose: …` copy is generated interpretation, not quoted evidence.
   Plain text is rendered safely; message content cannot modify routing,
   authorization, scheduling constraints or solver configuration.
10. A scheduler-derived entry is `proposed` until an authoritative user/workflow
    action confirms it. Solving never performs booking, sending or execution.
    Any unassigned work remains explicit with a reason rather than disappearing.

## Existing-site compatibility projection

There is no new endpoint in this extraction. A future adapter would apply this
mapping while keeping the current public site, paths and response shapes:

| Existing consumer | Projection / retained source |
| --- | --- |
| `/api/clock`, ring geometry and bundled fallback | Existing catalog bytes matched by `catalog.sha256`; **never return the envelope here**. |
| `/api/clock/runtime`, `applyClockRuntimeToTimeState` | `schedule.clock.runtime` unchanged, including `data_source`, indices and fallback nulls. |
| `/api/clock/context`, `mergeClockApiContext`, drawers | `schedule.clock.context` unchanged, including `moment`, `section_content`, citations and content-generation metadata. Public mode stays fixed-now. |
| `/api/clock/content-bundle`, `/api/clock/wisdom-anchor` | Existing slice builders over the preserved context, including their original source metadata. |
| Guided prompts and chat launch | Existing Clock prompt builder and launch encoder; `entries[].interpretation` does not replace that transport or generate a final Pericope answer. |
| New schedule entries | No existing UI consumer. Ignore until a separately authorized UI addition; do not reinterpret entries as ring geometry. |

Consumers know the envelope and Clock fields, never the optimization engine.
The future adapter may obtain envelopes from a static fixture, deterministic
Clock producer or scheduler without changing the public frontend. This is an
interface design property; adapter/UI compatibility has not yet been implemented
or demonstrated. Keep the existing endpoints available throughout qualification.

## Versioning and failure handling

Use semantic versions. Add optional fields with a minor version; readers ignore
unknown fields but preserve legacy payloads during projection. Required-field,
type, index, time, enum or meaning changes require a major version. Patch changes
clarify the specification without changing wire meaning. A reader accepts only
explicitly supported major versions and rejects unknown required enum values;
it must not guess. `clock-context-v2` and catalog/rules versions are independent
of the envelope version.

Reject malformed, unsupported, mismatched-catalog or out-of-order envelopes
before projection. Retain existing serving behavior on rejection. Future HTTP
delivery should use JSON with ETag/revision handling, 400 for malformed input,
an explicit unsupported-version error, and 503 for total producer outage.
Partial source outages can return a valid degraded envelope. Do not change the
old endpoints' errors or authentication while adding this interface.

## Compatibility acceptance gates (not completed by this extraction)

- Capture sanitized catalog/runtime/context fixtures with one instant, explicit
  location/zone, producer revision and catalog hash. Compare every legacy field,
  allowing only declared nondeterministic generation metadata differences.
- Cover ordinary day/night, just before/at/after sunrise/sunset and midnight,
  week/year transitions, leap day, longitude sector edges, both DST changes,
  absent solar events, missing scripture, invalid time/location and stale data.
- Preserve the 44/43 tradition warning, one-based sectors versus zero-based
  arrays, date-selected Proverbs, fixed-now public context, generated-versus-
  quoted text, and guided/freeform launch round trips.
- Exercise unchanged public rendering in a local/headless environment with
  fixture-backed projections: rings, active labels, drawers, sources, history,
  auth and fallback paths. Confirm operation with no Timefold service present.
- Reject unsupported major versions, missing required legacy fields, duplicate
  IDs, invalid source/catalog references and invalid time intervals. Verify
  public/private isolation and revision ordering.
- Only after parity evidence and explicit implementation/promotion authorization
  may an adapter be introduced through the existing local → LAN → public gates.
  Retain a rollback to the current producer and public API paths.

This release publishes documentation through the existing Clock image pipeline.
It does not introduce an endpoint, replace the Clock implementation, change its
data model or integrate Timefold. Publishing the specification is not evidence
that the compatibility gates above have passed.
