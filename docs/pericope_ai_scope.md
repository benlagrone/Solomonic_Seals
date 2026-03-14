# PericopeAI Scope for Life OS Integration

Purpose: isolate the PericopeAI changes required to support the Solomonic Clock Life OS so backend work can be phased cleanly instead of growing implicitly inside the clock roadmap.

Primary implementation handoff for homepage guided prompts:
`docs/clock_guided_prompts_api_handoff.md`

Alternate architecture only if Pericope is later chosen to own cue generation:
`docs/pericope_landing_cues_api_handoff.md`

## Goal

PericopeAI should move from:

```text
user
  ->
chat API
  ->
persona prompt
  ->
LLM
  ->
response
```

to:

```text
Life OS
  ->
Virtue Engine
  ->
Wisdom Index
  ->
PericopeAI Corpus
  ->
Mentor Generator
  ->
Narrative Output
```

The practical shift is:

- clock = state instrument,
- PericopeAI = wisdom corpus and reasoning layer.

## Scope Boundary

In scope:

- corpus metadata normalization for Life OS use,
- virtue and life-domain tagging,
- mentor profile normalization,
- Wisdom Index lookups,
- a dedicated Life OS guidance API,
- retrieval/ranking changes needed to support virtue-grounded output.

Out of scope for the first PericopeAI pass:

- full graph-database migration,
- automatic ingestion of hundreds of authors,
- fully general multi-mentor debate mode,
- major chat UX rewrites unrelated to Life OS guidance,
- replacing existing RAG/chat flows for non-Life-OS use cases.

## Service Boundary

PericopeAI should be scoped as the `Wisdom Service`, not as the full Life OS backend.

Five-service model:

```text
Clock Service
  ->
Virtue Engine
  ->
Wisdom Service (PericopeAI)
  ->
Guidance Service
  ->
History Service
```

PericopeAI owns:

- corpus storage and retrieval,
- virtue and life-domain tagging,
- Wisdom Index lookups,
- mentor profiles and rendering,
- structured wisdom outputs for Life OS requests.

PericopeAI does not own:

- planetary-hour calculation,
- solar longitude or sector calculation,
- Life Wheel scoring,
- Providence Timeline / Providence Map persistence,
- frontend orchestration or radial UI state.

This keeps the Pericope scope sane: it is the wisdom corpus and reasoning layer, not the entire orchestration layer.

## Scaling Rule

All knowledge should connect through virtues.

Required graph discipline:

- `sector -> virtue`
- `author -> virtue`
- `scripture -> virtue`
- `practice -> virtue`
- `domain -> virtue`

Avoid as canonical edges:

- `author -> author`
- `sector -> author`
- `scripture -> sector`

Reason:

- virtues are few,
- virtues are stable,
- virtues are legible across traditions,
- virtue hubs prevent the graph from exploding as mentors and texts accumulate.

Preferred hub shape:

```text
        scripture
           |
author - virtue - practice
           |
         domain
           |
         sector
```

The practical consequence is that new authors do not require new graph logic. They only need virtue and domain tags.

## Required Changes

### 1. Corpus Normalization

Pericope chunks need semantic metadata, not just author/source/position.

Minimum chunk shape:

```json
{
  "author": "Augustine",
  "source": "Confessions",
  "virtues": ["faith", "love"],
  "themes": ["restlessness", "conversion"],
  "lifeDomains": ["contemplation", "relationships"]
}
```

Minimum requirement:

- support `virtues`,
- support `lifeDomains`,
- keep `themes` optional in the MVP,
- allow manual tagging for the initial mentor set.

### 2. Virtue Tagging Pipeline

The ingestion path needs one explicit enrichment pass:

```text
raw text
  ->
chunking
  ->
virtue classification
  ->
metadata index
  ->
vector storage
```

MVP rule:

- manual or semi-automatic tagging is acceptable for the first author set,
- fully automated tagging should be Phase 2, not a blocker for initial integration.

### 3. Wisdom Index Service

PericopeAI needs a thin service that can answer:

- which scripture anchors belong to a virtue,
- which mentors are eligible for that virtue,
- which practices are associated with it.

Minimum API:

```text
GET /wisdom/virtue/{virtue}
```

Example response:

```json
{
  "scripture": ["Proverbs 15:1"],
  "mentors": ["Solomon", "Augustine", "Marcus Aurelius"],
  "practices": ["calm speech", "restraint"]
}
```

### 4. Mentor Profile Normalization

Existing chat personas need a structured mentor record.

Minimum mentor shape:

```json
{
  "id": "augustine",
  "name": "Augustine",
  "style": "reflective",
  "tone": "pastoral",
  "virtueFocus": ["faith", "love"],
  "authorityTier": "primary_christian_teacher"
}
```

MVP rule:

- keep current chat personas alive,
- add a normalization layer that maps them into mentor profiles for Life OS use.

### 5. Life OS Guidance API

PericopeAI needs one dedicated contract for the clock/Life OS frontend.

Minimum API:

```text
POST /lifeos/guidance
```

Example request:

```json
{
  "planet": "Mars",
  "sector": "Leraje",
  "virtue": "Temperance",
  "domain": "Relationships"
}
```

Example response:

```json
{
  "scripture": "Proverbs 15:1",
  "mentor": "Solomon",
  "reflection": "A gentle answer preserves peace.",
  "practice": "Respond calmly in conflict."
}
```

This endpoint should stay narrow. It is not a general chat replacement.

### 6. Retrieval and Ranking

PericopeAI needs retrieval that can prefer:

- scripture anchors first,
- mentor passages second,
- virtue and domain relevance over generic semantic similarity,
- authority tier as a ranking factor.

MVP rule:

- implement simple filters and weighted ranking before attempting graph-native retrieval.
- keep virtue as the organizing key for retrieval so authors, texts, and practices do not form uncontrolled peer-to-peer link sets.

## Delivery Phases

### Phase 1: MVP Integration

Ship the minimum needed for the clock to call PericopeAI reliably.

Deliverables:

- small initial mentor set normalized into profiles,
- manually tagged corpus chunks for that mentor set,
- `GET /wisdom/virtue/{virtue}`,
- `POST /lifeos/guidance`,
- scripture-first ranking,
- no graph database requirement.

Recommended initial mentors:

- `Solomon`
- `Augustine`
- `Marcus Aurelius`

### Phase 2: Scalable Ingestion

Make new authors cheaper to add.

Deliverables:

- automated or reviewer-assisted virtue tagging,
- ingestion pipeline for new authors,
- mentor-profile generation from author descriptors,
- stronger retrieval by virtue/domain/theme.

### Phase 3: Advanced Reasoning

Only after MVP guidance is stable.

Deliverables:

- Wisdom Graph-backed traversal inside Pericope,
- pattern-aware mentor selection,
- graph-native storage if needed,
- richer summary and comparative mentor outputs.

## Suggested Build Order

1. Normalize mentor profiles for the initial author set.
2. Add manual virtue/life-domain tags to the initial corpus.
3. Build `GET /wisdom/virtue/{virtue}`.
4. Build `POST /lifeos/guidance`.
5. Wire the clock frontend to the guidance endpoint.
6. Add automated tagging and richer ingestion only after the MVP works end to end.

## Key Constraint

Do not make PericopeAI solve every Life OS problem at once.

The first version only needs to do four things well:

- know which virtue is active,
- know which sources match it,
- choose one mentor voice correctly,
- return one structured guidance payload the clock can render.

If a new feature cannot be expressed cleanly as `something -> virtue`, it should be treated as suspicious until there is a strong reason to widen the graph model.

## Working Rule

PericopeAI changes should be accepted only if they make one of these better:

- corpus structure,
- source selection,
- mentor rendering,
- Life OS guidance delivery.

If a proposed change only makes the chat system more elaborate without improving those four areas, it should stay out of the initial scope.
