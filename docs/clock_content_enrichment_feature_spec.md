# Clock Content Enrichment Feature Specification

Status: proposed implementation authority

Created: 2026-07-19

Purpose: translate the present-moment clock refocus into buildable content features, API contracts, data records, and acceptance criteria without restructuring the Clock or renaming its existing sections.

## Product Definition

The existing Solomonic Clock is a fixed-present daily formation instrument.

On first entry, it resolves the user's current position across temporal scales and fills the existing Clock sections with source-grounded meaning. The user may inspect the current minute, hour, day, week, month or lunation, season, year, decade, lifespan, and era, but ordinary interaction must not move the clock backward or forward.

This is a content enrichment, not an information-architecture change.

The following are immutable product constraints:

- Keep the current radial Clock and drawer structure.
- Keep the current visible section and tab titles.
- Do not introduce a replacement Today, Summary, or Folio page.
- Do not move existing content merely to match a new conceptual model.
- Add depth, meaning, citations, and generation state inside the existing sections.
- The Clock cites works. It does not converse as their authors. Author-persona conversation remains a Pericope capability.

## Governing Product Rules

1. **Now is fixed.** Ordinary Clock controls never alter the effective date or time.
2. **Meaning loads first.** On entry, the existing Clock resolves and fills its current sections without requiring exploratory clicking.
3. **Calculations precede interpretation.** Deterministic services calculate time, astronomy, cycles, and source eligibility before an LLM writes prose.
4. **Meaning precedes relevance.** A passage must be understood in its original context before it can be linked to the present moment.
5. **Works are evidence, not personae.** Clock copy uses a neutral editorial voice and cites authors' works precisely.
6. **Formation is the outcome.** The existing sections together give the user something to contemplate, practice, restrain, and examine.
7. **Evidence classes stay visible.** Observed, biological, traditional, inherited-wisdom, generated, and personal claims must not be presented as equivalent.
8. **Daily continuity matters.** `Solomonic Meditation` remains stable through the local day; smaller timely guidance may change at a meaningful boundary.
9. **Presentation follows meaning.** Manuscript ornament emphasizes hierarchy and provenance without making controls or dense clock geometry illegible.
10. **Private context stays private.** Birth data, location, reflections, commitments, and observed personal associations are private by default.

## Existing Section Content Contracts

The visible labels below are preserved exactly. Implementation fills them with the following tangible meaning.

| Existing section or control | Concrete content responsibility |
| --- | --- |
| `Daily Guidance` | The current day's governing theme, active temporal factors, immediate orientation, and what changed since the previous meaningful boundary. |
| `Counsel` | The integrated current-moment summary: what the factors mean together, the main tension, what to carry, and why it matters today. |
| `Proverb` | The complete selected wisdom passage, its original context, why it relates to the present moment, and its practical implication. |
| `Psalm` | The complete selected Psalm or configured passage, its source context, why it is present, and a clear distinction between the text and generated interpretation. |
| `Practice` | One contemplation, one proportionate action, one restraint, and one examination tied to the current moment. |
| `History` | Recorded user reflections and completed practices. It does not reposition or recalculate the live Clock. |
| `The Moment Across Scales` | The user's current position within Minute, Hour, Day, Week, Moon, Season, Year, Decade, Life, and Era. Selecting a scale changes explanatory depth only. |
| `Now is nested inside many rhythms` | A synthesis of resonance and tension among the current scales, not a decorative subtitle. |
| `Solomonic Meditation` | The stable, LLM-generated daily meditation grounded in the resolved moment and cited sources. |
| `Selected Track` | The selected existing clock element's relationship to the current moment, including rhythm, meditation, practice, and reflection. |
| `Daily Guidance` within `Selected Track` | The current meaning of the whole clock or selected track; it is not a second unrelated summary. |
| `Today's Planetary Guidance` | The active planetary day and hour, their source-backed traditional interpretation, the present discipline, and the next meaningful transition. |
| `Today's Rule of Life` | Specific morning, midday, and evening practices connected to the day's virtue and life domain. |
| `Weekly Arc (Advise Mode)` | The current day's position within the present week and the week's governing movement. It must not browse the Clock into another date. |
| `Recorded History` | Stored past responses, practices, and reflections displayed explicitly as records rather than alternate live moments. |
| `Weekly Review` | Evidence from the recorded week: repeated patterns, encouragement, warning, carry-forward practice, and source-grounded close. |

Source detail remains an expansion within the existing drawer and reader behavior. It contains author, work, edition or translation, exact citation, excerpt, surrounding context when available, original meaning, relation to the current moment, provenance, rights, confidence, and editorial-review status. It must not present the source as a live statement from the author.

No feature in this specification may rename these labels, create a replacement primary page, or require moving the existing sections to a new hierarchy.

## Feature Catalog

### CCE-001: Fixed-Now Clock

**User story**

As a user, I want the Clock to keep me oriented to the present instead of letting me browse attractive but disconnected titles.

**Requirements**

- The production Clock computes `as_of` server-side.
- Ordinary requests cannot supply an effective historical or future `as_of`.
- Scale selection changes explanation depth only.
- Previous and next controls are removed from the live Clock experience.
- Historical records are visually and technically separate from the live Clock.
- Internal deterministic tests may inject `as_of` through a non-public test path.

**Acceptance**

- No primary Clock control changes the effective moment.
- Changing from Hour to Year leaves the same daily-content ID and moment snapshot.
- A modified browser request cannot generate public current guidance for an arbitrary date.
- Opening Journal History leaves the live Clock on the current moment.

### CCE-002: First-Visit Content Resolution

**User story**

As a user arriving at the Clock, I want its existing sections to contain an immediate explanation of what this moment means and how I might carry it through the day.

**Requirements**

- Page entry requests today's enriched Clock context automatically.
- Cached daily content renders in the existing sections immediately.
- Missing generated content enters a visible `forming` state inside `Counsel` and `Solomonic Meditation`.
- Symbolic clock data may render while prose is forming, but placeholder prose must not be presented as completed counsel.
- The existing Clock structure and labels remain unchanged.
- The default state does not require the user to select a ring or scale before the existing guidance sections receive meaning.

**Acceptance**

- First entry produces either ready content or an explicit forming state in the existing sections.
- Reloading does not create a second daily-content artifact for the same cache key.
- Completed content replaces the forming text without moving or renaming any section.
- `Counsel`, `Solomonic Meditation`, and `Practice` display content through their existing responsive behavior.
- Contract tests assert that the existing visible section and tab labels remain unchanged.

### CCE-003: Multi-Scale Moment Snapshot

**User story**

As a user, I want to understand how the present minute participates in longer rhythms from the hour through the era.

**Requirements**

- Resolve the enabled scales into one immutable `MomentVector`.
- Initial scale coverage:
  - minute,
  - hour,
  - day,
  - week,
  - month or lunation,
  - astronomical season,
  - year,
  - decade,
  - lifespan,
  - era.
- Every scale uses the common semantic shape:
  - `cycle_id`,
  - `position`,
  - `phase`,
  - `begins_at`,
  - `ends_at`,
  - `observed_signals`,
  - `inherited_themes`,
  - `virtues`,
  - `shadows`,
  - `questions`,
  - `practices`,
  - `source_refs`,
  - `confidence`.
- Cross-scale synthesis identifies resonance, tension, dominant theme, and counter-theme.

**Acceptance**

- One runtime request returns every implemented current scale.
- Measurable positions are normalized to `0..1`.
- Unmeasured life and era positions are marked interpretive rather than given false precision.
- Each displayed scale can explain its source and calculation or editorial basis.

### CCE-004: Stable Daily Meditation

**User story**

As a user, I want one coherent meditation to carry through the day rather than changing prose every time I reload.

**Requirements**

- Generate one primary meditation per daily-content cache key.
- Target length is 300 to 600 words unless an accessibility preference requests a shorter form.
- The meditation synthesizes the dominant theme, counter-theme, relevant scales, life domains, retrieved works, and evidence boundaries.
- The Clock writes in a neutral editorial voice.
- The meditation offers formation, not prediction, diagnosis, or command.
- Regeneration requires a recorded reason, such as prompt-version change, source correction, material profile change, or explicit user request.

**Acceptance**

- Reloads return identical meditation content and daily-content ID.
- The response identifies its prompt version and generation time.
- No sentence is attributed to an author unless it is an exact cited excerpt.
- The meditation includes at least one concrete contemplation or practice.

### CCE-005: Timely Guidance Update

**User story**

As a user returning later in the day, I want the Clock to acknowledge the current interval without discarding the thought I have been carrying.

**Requirements**

- The daily meditation remains unchanged.
- A compact addendum may update at configured meaningful boundaries.
- Initial boundary support:
  - canonical hour when configured,
  - planetary-hour transition,
  - sunrise,
  - solar noon,
  - sunset.
- The addendum includes `valid_from`, `valid_until`, current discipline, and the next boundary.
- Minute-by-minute LLM regeneration is prohibited.

**Acceptance**

- Crossing an interval boundary can update `Today's Planetary Guidance` without changing the daily-content ID or `Solomonic Meditation`.
- The addendum states its validity window.
- If the boundary cannot be calculated confidently, the addendum reports unavailability instead of inventing precision.

### CCE-006: Personal Time Profile

**User story**

As a signed-in user, I want the Clock to consider my birth coordinates, present location, preferences, commitments, and reflections without treating them as destiny.

**Requirements**

- Store birth date, optional birth time, birth location, current timezone, and current location separately.
- Record precision and provenance for every entered coordinate.
- Allow independently enabled traditions.
- Keep a stable `BirthVector` distinct from the changing `MomentVector`.
- Treat Tiger, Virgo, and similar labels as coordinates within their own traditions, not complete identities.
- Support export, recalculation, correction, and deletion.
- Do not require birth data for useful guest guidance.

**Acceptance**

- Missing birth time limits full-chart features explicitly.
- Chinese year boundaries follow the configured calendar tradition rather than January 1.
- Personal interpretation identifies which user fields influenced it.
- Disabling a tradition removes its contribution from subsequent generated guidance.

### CCE-007: Passage Meaning Records

**User story**

As an editor, I want the system to understand what a passage means before it uses that passage in a meditation.

**Requirements**

- Extend the existing stable `passage_id` with a reviewed semantic overlay.
- Preserve the original corpus text as canonical.
- Store:
  - author and work;
  - edition or translation;
  - exact citation and source location;
  - excerpt and surrounding context pointer;
  - original subject;
  - argument role;
  - historical setting;
  - important terminology;
  - themes;
  - virtues and shadows;
  - movements such as begin, build, restrain, complete, return, and renew;
  - life domains;
  - editorial and provenance status.
- Machine-generated tags remain suggestions until they pass the configured editorial gate.

**Acceptance**

- Every eligible passage has a stable passage ID and source location.
- The original-meaning explanation is stored separately from Clock relevance.
- Modern translations and editions carry rights metadata.
- A passage without adequate citation or rights status is ineligible for display.

### CCE-008: Clock Relevance Links

**User story**

As a user, I want cited works to relate genuinely to the present moment rather than appearing because of an author's reputation.

**Requirements**

- Relate passage meaning to:
  - temporal scales,
  - phases,
  - virtues,
  - shadows,
  - life domains,
  - behavioral movements,
  - evidence class.
- Passage content outranks author identity in retrieval.
- Retrieve with metadata eligibility filters plus lexical and semantic matching.
- Rerank against the resolved `MomentVector` and the current practical question.
- Apply repetition and diversity limits.
- Keep a reviewable explanation of why each passage was selected.

**Acceptance**

- Every displayed passage includes a `why_now` explanation.
- An author is not selected solely because the author's profile contains a matching keyword.
- Evaluation fixtures include relevant and tempting-but-incorrect passages.
- Reviewers can inspect component scores and exclusion reasons.

### CCE-009: Work Citations, Not Author Conversation

**User story**

As a user, I want to see what a work contributes without being told that a historical author is personally speaking to me.

**Requirements**

- Use labels such as `From the Works`, `A Text for This Moment`, or `Source and Reflection`.
- Show exact excerpt, author, work, citation, edition, original context, and relation to the moment.
- Generated Clock prose must be visually distinct from source excerpts.
- Do not use author-persona system prompts in Clock content generation.
- Do not generate first-person author speech.
- A deliberate link may open a reader or Pericope experience outside the Clock.

**Acceptance**

- Clock responses contain no simulated author conversation.
- Quotes are exact and traceable to a source record.
- Paraphrases are labeled as Clock interpretation rather than quotation.
- Removing Pericope connectivity does not prevent the Clock from showing complete citations.

### CCE-010: Evidence and Provenance Labels

**User story**

As a user, I want to understand whether guidance comes from observation, scientific evidence, historical tradition, inherited wisdom, generated synthesis, or my own reflections.

**Requirements**

- Classify each material input as:
  - observed physical state,
  - supported biological timing,
  - mixed or emerging association,
  - historical or symbolic tradition,
  - inherited wisdom,
  - generated interpretation,
  - user-authored meaning.
- Preserve source, retrieval time, confidence, calculation method, and editorial status.
- Solar activity must distinguish flare, particle, CME, solar-wind, geomagnetic, and local measurements.
- Health, financial, legal, and safety-critical guidance must stay outside the Clock's authority.

**Acceptance**

- Every factual or quoted source has provenance.
- Generated conclusions are not styled as quotations or measurements.
- Symbolic correspondence is never labeled scientific causation.
- Unavailable or low-confidence inputs visibly degrade rather than silently becoming certain.

### CCE-011: Manuscript Content Presentation

**User story**

As a user, I want the Clock's existing reading and meditation sections to feel like illuminated wisdom texts while remaining readable and usable.

**Requirements**

- Apply the richest manuscript treatment to `Solomonic Meditation`, `Psalm`, and `Proverb` within their existing locations.
- Reuse:
  - `.scripture-illumination`,
  - `.illuminated-initial`,
  - `.illuminated-heading`,
  - `scriptorium-initials/v1/frame-gold.svg`.
- Add shared:
  - `.manuscript-panel`,
  - `.manuscript-cartouche`,
  - `.manuscript-rubric`,
  - `.manuscript-marginalia`,
  - `.manuscript-source-note`.
- Use one illuminated initial for the daily meditation.
- Treat cited works as marginal source notes.
- Treat the clock face as a restrained cosmological diagram.
- Keep buttons, tabs, focus states, and dense metadata conventional and accessible.
- Use serif body text designed for reading; do not set the full meditation in blackletter.

**Acceptance**

- The primary meditation is readable at phone, Fold, desktop, and large-display widths.
- No nested scroll is introduced inside the main reading.
- Ornament does not obscure selected state or clock labels.
- Reduced-motion and contrast preferences remain effective.
- Source excerpts and generated synthesis are visibly distinguishable.

### CCE-012: Daily Formation Actions

**User story**

As a user, I want the meditation to become a practical discipline rather than remain attractive prose.

**Requirements**

- The completed content across `Counsel`, `Solomonic Meditation`, and `Practice` includes:
  - `carry_thought`,
  - `contemplation`,
  - `practice`,
  - `watch_for`,
  - `evening_question`.
- Practices must be proportionate, concrete, reversible where appropriate, and bounded to the user's stated context.
- Users may mark a practice adopted, adapted, deferred, rejected, or completed.
- User choices improve future relevance but do not retroactively change recorded daily content.

**Acceptance**

- No completed daily content omits all formation actions.
- Practice text contains an observable action or deliberate restraint.
- The user can decline counsel without penalty language.
- The evening examination refers back to the day's actual meditation and practice.

### CCE-013: Enriched Clock Context API

**User story**

As a client developer, I want the existing Clock context API to supply meaningful content for the existing Clock sections.

**Endpoint**

`POST /api/clock/context`

**Request**

```json
{
  "timezone": "America/Chicago",
  "location": {
    "latitude": 29.76,
    "longitude": -95.37
  }
}
```

For authenticated users, private profile fields are loaded server-side.

**Response**

```json
{
  "schema_version": "clock-context-v2",
  "content_id": "clock-content:user:2026-07-19:v1",
  "temporal_policy": "fixed_now",
  "valid_from": "2026-07-19T00:00:00-05:00",
  "valid_until": "2026-07-20T00:00:00-05:00",
  "daily_guidance": {},
  "weekly_arc": {},
  "daily_profile": {},
  "why_selected": {},
  "content_bundle": {},
  "moment": {
    "as_of": "2026-07-19T09:02:00-05:00",
    "timezone": "America/Chicago",
    "runtime": {},
    "scales": {},
    "resonances": [],
    "tensions": []
  },
  "content_generation": {
    "status": "ready",
    "poll_after_ms": null,
    "prompt_version": "clock-content-v1",
    "content_version": "",
    "generated_at": "",
    "cache_status": "hit"
  },
  "section_content": {
    "counsel": {
      "theme_title": "",
      "orientation": "",
      "dominant_theme": {},
      "counter_theme": {},
      "carry_thought": ""
    },
    "proverb": {
      "source_ref": "",
      "full_text_ref": "",
      "original_context": "",
      "why_now": ""
    },
    "psalm": {
      "source_ref": "",
      "full_text_ref": "",
      "original_context": "",
      "why_now": ""
    },
    "practice": {
      "contemplation": "",
      "action": "",
      "restraint": "",
      "evening_question": ""
    },
    "temporal_scales": {},
    "solomonic_meditation": {
      "meditation_title": "",
      "body": ""
    },
    "selected_track": {},
    "planetary_guidance": {},
    "rule_of_life": {},
    "recorded_history": {}
  },
  "timely_guidance": {
    "valid_from": "",
    "valid_until": "",
    "orientation": "",
    "next_boundary": ""
  },
  "cited_works": [],
  "sources": [],
  "source": {
    "service": "solomonic_clock",
    "api": "/api/clock/context"
  }
}
```

**Requirements**

- Extend the current `/api/clock/context` response additively.
- Preserve existing `daily_guidance`, `weekly_arc`, `daily_profile`, `why_selected`, `content_bundle`, and `source` fields.
- Reuse `/api/clock/runtime` and `/api/clock/content-bundle` rather than duplicating their calculations.
- Keep `/api/clock` as the canonical symbolic dataset.
- Return `200` with `content_generation.status: ready` when generated content is ready.
- Return `200` with deterministic context plus `content_generation.status: forming` and `poll_after_ms` when synthesis is pending.
- Return structured degraded states when a source provider or LLM is unavailable.
- Private personalized responses must not be publicly cacheable.
- `section_content` keys map to current UI elements and do not authorize label or layout changes.

**Acceptance**

- The current web Clock can fill its existing sections from this response without renaming or moving them.
- A response identifies every source and generated field version.
- `temporal_policy` is always `fixed_now` on the public endpoint.
- The endpoint remains useful when Pericope author conversation is unavailable.

### CCE-014: Idempotent Generation and Caching

**User story**

As a user, I want a stable daily reading without paying generation latency on every visit.

**Requirements**

- Compute a daily-content key from:
  - user or guest scope,
  - local date,
  - timezone,
  - approved location precision,
  - enabled traditions,
  - material personal-context version,
  - content version,
  - prompt version.
- Use a request lock so simultaneous first visits create one generation job.
- Store the immutable generation input snapshot with the result.
- Cache timely guidance independently by boundary ID.
- Record regeneration reasons.
- Do not include sensitive raw profile data in logs or public cache keys.

**Acceptance**

- Concurrent equivalent requests return one content ID.
- Reloads report a cache hit.
- Prompt or source corrections create a traceable new version.
- A generation failure preserves deterministic current-state content and reports that meditation synthesis is unavailable.

### CCE-015: LLM Synthesis Contract

**User story**

As an editor, I want generated meditations to remain grounded, proportionate, and structurally predictable.

**Inputs**

- immutable moment snapshot;
- active scales;
- dominant and counter themes;
- virtues and shadows;
- life domains;
- evidence boundaries;
- eligible source passages;
- optional private user context;
- recent relevant reflections and unresolved commitments;
- output schema and style policy.

**Required outputs**

- title;
- orientation;
- meditation body;
- carry thought;
- contemplation question;
- practice;
- caution or shadow;
- evening question;
- cited passage IDs actually used;
- source-to-sentence support mapping or equivalent trace.

**Requirements**

- The LLM does not calculate astronomy or calendars.
- The LLM does not invent passages, citations, biographical facts, or scientific effects.
- The LLM does not impersonate cited authors.
- The LLM may omit a weakly related passage.
- Generation must distinguish source excerpt, contextual explanation, present relevance, and original synthesis.

**Acceptance**

- Schema validation rejects missing required fields.
- Citation validation rejects unknown passage IDs.
- Every displayed citation was included in the generation input.
- Evaluation includes unsupported-causation, fake-quotation, determinism, and author-impersonation failure cases.

### CCE-016: Pericope Boundary and Handoff

**User story**

As a user, I want to enter a deeper conversation deliberately without confusing the Clock's meditation with a simulated author response.

**Requirements**

- The Clock remains complete without opening Pericope.
- A source detail may offer:
  - `Read the work`,
  - `Study this passage`,
  - `Explore in Pericope`.
- Handoff sends structured `clock_context`, content ID, passage ID, and explicit user intent.
- It does not silently begin an author-persona conversation.
- Pericope conversation responses are not inserted back into the immutable daily meditation.

**Acceptance**

- The handoff requires an explicit user action.
- The receiving experience can identify the source Clock content and passage.
- Returning from Pericope restores the unchanged live Clock.
- Disabling the handoff does not remove citations or source explanations.

## Passage Intelligence Contracts

### Passage Meaning Record

```json
{
  "passage_id": "stable-existing-id",
  "author_slug": "adam_smith",
  "author_name": "Adam Smith",
  "work": "The Theory of Moral Sentiments",
  "edition": "",
  "citation": "",
  "excerpt": "",
  "context_pointer": {},
  "original_meaning": {
    "subject": "",
    "argument_role": "",
    "historical_setting": "",
    "key_terms": []
  },
  "semantic_facets": {
    "themes": [],
    "virtues": [],
    "shadows": [],
    "movements": [],
    "life_domains": []
  },
  "rights": {},
  "provenance": {},
  "editorial_status": "reviewed"
}
```

### Clock Relevance Record

```json
{
  "passage_id": "stable-existing-id",
  "clock_scales": ["week", "year"],
  "phases": ["culmination", "decline"],
  "movements": ["examine", "restrain"],
  "virtues": ["prudence", "justice"],
  "shadows": ["self-deception"],
  "life_domains": ["relationships", "stewardship"],
  "counsel_kinds": ["contemplation", "examination"],
  "relevance_explanation": "",
  "review_status": "reviewed",
  "reviewed_at": ""
}
```

These records may be implemented as relational rows and derived search indexes. They must not replace canonical corpus text.

## Service Ownership

| Capability | Owner |
| --- | --- |
| Canonical symbolic dataset | Solomonic Clock |
| Present time and scale calculations | Solomonic Clock runtime |
| Enriched current-content orchestration | Solomonic Clock |
| Author texts, editions, and passage IDs | AugustineCorpus |
| Passage retrieval and source context | AugustineService / corpus service |
| Passage meaning and editorial review | Corpus semantic enrichment workflow |
| Source discovery, edition, and rights review | Source Steward |
| Neutral daily synthesis | Clock content generation service |
| Author-persona conversation | Pericope |
| Private profile and reflections | Authenticated Clock user-data boundary |

## Delivery Slices

### Slice 1: Existing-Section Content Baseline

- Remove time-navigation behavior from the live Clock.
- Preserve the current Clock structure and exact visible section titles.
- Define and test required content for every existing section.
- Add fixed-now contract tests.
- Render deterministic placeholder states without LLM dependency.

**Exit:** the existing Clock opens with useful current meaning in its existing sections and cannot be repositioned.

### Slice 2: Enriched Context API and Stable Generation

- Extend `POST /api/clock/context` additively.
- Compose existing runtime and content-bundle outputs without breaking current fields.
- Add `ready`, `forming`, `degraded`, and `failed` states.
- Implement cache key, request lock, generation trace, and prompt versioning.

**Exit:** first visit creates one stable daily-content response that fills existing sections and reloads from cache.

### Slice 3: Multi-Scale Deep Content

- Complete implemented scale snapshot records.
- Add resonance, tension, dominant-theme, and counter-theme resolution.
- Add current-scale detail without time navigation.

**Exit:** users can inspect the present from minute through every implemented longer scale.

### Slice 4: Cited Works Pilot

- Use Marcus Aurelius, Benjamin Franklin, and Adam Smith as the pilot set.
- Create at least 25 reviewed Passage Meaning Records per author.
- Create Clock Relevance Records for the reviewed passages.
- Add hybrid retrieval, reranking, citation validation, and source-detail UI.
- Do not enable author-persona prompts in the Clock path.

**Exit:** evaluation moments retrieve genuinely relevant, precisely cited passages and explain their relation to now.

### Slice 5: Manuscript Content Enrichment

- Apply the richest manuscript treatment to `Solomonic Meditation`, `Psalm`, and `Proverb` in their current locations.
- Render cited works as marginal source notes.
- Keep the clock face restrained.
- Validate desktop, phone, Fold, and large-display layouts.

**Exit:** existing Clock sections are visually coherent, readable, accessible, and source-legible without renamed or relocated content.

### Slice 6: Personal Formation

- Add private Personal Time Profile.
- Add BirthVector-to-MomentVector comparison.
- Add daily practice status and evening examination.
- Add Journal History without live-clock time travel.

**Exit:** a signed-in user can receive proportionate personalization, act, reflect, and review growth over time.

### Slice 7: Timely Addenda and Delivery Channels

- Add canonical or planetary-hour addenda.
- Add optional TTS payload.
- Prepare stable enriched-context consumption for mobile and notifications.
- Keep delivery quiet by default and user-configurable.

**Exit:** the same daily content supports appropriate return points without repeated full generation.

## Cross-Feature Validation

Required automated checks:

- fixed-now API and UI contract tests;
- enriched context schema validation;
- idempotency and concurrent-generation tests;
- cache invalidation tests;
- source and citation integrity tests;
- no-author-impersonation prompt tests;
- original-meaning versus present-relevance separation tests;
- evidence-label coverage;
- responsive layout and overflow checks;
- accessible focus, contrast, semantic heading, and reduced-motion checks;
- history isolation from live time state;
- private-cache and sensitive-log checks.

Required editorial evaluation set:

- at least 30 representative moment snapshots;
- at least 10 deliberately difficult or conflicting multi-scale moments;
- relevant and misleading candidate passages for each pilot author;
- cases with incomplete location or birth precision;
- unavailable astronomical, corpus, and LLM dependencies;
- scientific, symbolic, and personal factors present in the same generated content;
- user rejection or adaptation of suggested practice.

## Explicit Non-Features

- Browsing arbitrary future or past clock states in the live experience.
- Predicting events or guaranteeing outcomes.
- Diagnosing health effects from solar or geomagnetic activity.
- Treating zodiac labels as complete personality definitions.
- Presenting every tradition as one interchangeable cosmology.
- Applying the golden ratio to cycles without evidence.
- Simulated author speech inside the Clock.
- Uncited quotations or invented source context.
- Regenerating the full meditation on every reload or minute.
- Decorating every clock label, button, or paragraph as manuscript ornament.
- Replacing professional, communal, moral, or religious authority with generated guidance.

## Definition of Product Completion

The refocus is complete when:

1. A user opens the existing Clock and its existing sections receive stable, source-grounded current content.
2. The live Clock cannot be moved away from now.
3. The user can understand the current position across implemented scales.
4. The meditation explains what to carry, contemplate, practice, watch, and review.
5. Cited works are accurately understood, contextually linked, and never presented as author conversation.
6. The illuminated-manuscript style clarifies the existing content hierarchy without renaming or moving sections.
7. Every important claim exposes its evidence class and provenance.
8. Signed-in personalization remains private, correctable, optional, and non-deterministic.
9. Reloading is fast and stable because generation is idempotent and cached.
10. The enriched `/api/clock/context` contract can support web, mobile, TTS, notifications, and deliberate Pericope handoff.
