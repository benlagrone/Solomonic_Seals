# Solomonic Clock Life OS Architecture

Purpose: extend the Solomonic Clock from a symbolic time and counsel system into a Life Operating System that combines temporal structure, moral architecture, reflection, and guided development.

## Objective

The Life OS should:

- structure core human life domains,
- guide decisions and reflection,
- integrate AI advice with an explicit moral architecture layer,
- resist purely algorithmic optimization,
- anchor guidance to a defined ethical framework,
- use game-like feedback loops in service of formation rather than shallow productivity.

In this design:

- Solomonic Clock = temporal architecture,
- Genesis / Christian ethical framework = moral architecture,
- AI = interpretive advisor,
- combined system = Life OS.

## Core Flow

```text
User Life Data
        |
        v
Solomonic Clock (Temporal Framework)
        |
        v
Life Domain Engine
        |
        v
Virtue Wheel Evaluation
        |
        v
Wisdom Graph
        |
        v
Wisdom Index
        |
        v
Moral Architecture Layer
        |
        v
AI Guidance Engine
        |
        v
Mentor Layer
        |
        v
Daily Guidance Narrative Engine
        |
        v
User Decisions / Actions
        |
        v
Providence Timeline
        |
        v
Providence Map
```

## Five-Service Decomposition

To keep the system from sprawling, collapse the implementation into five core services with thin contracts between them.

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

This is the operational form of the larger Life OS architecture:

- `Clock Service` = current cosmic and temporal state,
- `Virtue Engine` = symbolic-to-virtue translation,
- `Wisdom Service` = corpus retrieval, scripture anchors, mentor reflections, and practice candidates,
- `Guidance Service` = orchestration and narrative assembly,
- `History Service` = timeline, Providence Map, weekly summaries, and pattern recall.

The goal is to keep the system architecturally small even if the conceptual model remains rich.

### 1. Clock Service

Responsibility: determine the current cosmic/time state.

Inputs:

- current time,
- latitude / longitude,
- solar calculations.

Outputs:

```json
{
  "planet": "Mars",
  "hour": "Sext",
  "zodiac": "Gemini",
  "sector": 13
}
```

Internal scope only:

- solar longitude,
- zodiac sign and degree,
- sector resolution,
- planetary day and planetary hour.

This service should not contain virtue logic, mentor logic, narrative generation, or history concerns.

### 2. Virtue Engine

Responsibility: translate symbolic signals into virtues and likely life-domain focus.

Input:

```json
{
  "planet": "Mars",
  "sector": 13,
  "hour": "Sext"
}
```

Output:

```json
{
  "virtue": "Temperance",
  "domain": "Relationships"
}
```

Internal scope:

- `sector -> virtue`,
- planetary bias,
- canonical-hour modifiers,
- domain emphasis.

This service should remain deterministic and explainable.

### 3. Wisdom Service (PericopeAI)

Responsibility: provide scripture anchors, mentor reflections, and practices for a virtue-centered request.

Input:

```json
{
  "virtue": "Temperance",
  "mentor": "Solomon"
}
```

Output:

```json
{
  "scripture": "Proverbs 15:1",
  "reflection": "A gentle answer preserves peace.",
  "practice": "Respond calmly in disagreement."
}
```

Internal scope:

- corpus storage,
- virtue tagging,
- Wisdom Index lookup,
- mentor profiles,
- mentor rendering,
- wisdom-graph traversal.

PericopeAI should primarily live here. It remains the wisdom corpus and reasoning layer, not the keeper of clock math or history logic.

### 4. Guidance Service

Responsibility: orchestrate Clock Service, Virtue Engine, and Wisdom Service into one guidance payload for the UI.

Pipeline:

```text
Clock Service
      ->
Virtue Engine
      ->
Wisdom Service
      ->
Narrative Engine
```

Example response:

```json
{
  "virtue": "Temperance",
  "practice": "Respond calmly in disagreement.",
  "mentor": "Solomon",
  "scripture": "Proverbs 15:1"
}
```

This is the service the frontend should read most often. The radial UI can stay thin if it mainly calls one guidance endpoint such as `GET /guidance/today`.

### 5. History Service

Responsibility: record and summarize lived guidance over time.

Stored shape:

```json
{
  "date": "2026-03-10",
  "virtue": "Temperance",
  "practice": "Respond calmly in conflict",
  "reflection": "Stayed calm during meeting disagreement"
}
```

Internal scope:

- Providence Timeline,
- Providence Map,
- weekly summaries,
- monthly patterns,
- score history,
- reflection recall.

### Service Boundary Rule

The larger Life OS concepts should be implemented inside these service boundaries rather than as new top-level engines every time a feature is added.

Feature mapping:

| Feature | Service |
| --- | --- |
| Solomonic clock | Clock Service |
| Virtue compass | Virtue Engine |
| Mentor voices | Wisdom Service |
| Narrative guidance | Guidance Service |
| Providence timeline/map | History Service |

This keeps the system compact:

```text
Clock (time)
  ->
Virtue (meaning)
  ->
Wisdom (authors)
  ->
Guidance (practice)
  ->
History (life record)
```

## Life Domains

Use seven recurring domains as the base map of human development:

| Domain | Genesis / Wisdom Anchor | App Equivalent |
| --- | --- | --- |
| `mind` | naming, knowledge, understanding | learning / thinking |
| `body` | physical life, labor, discipline | health |
| `relationships` | covenant, family, social duty | social |
| `stewardship` | dominion, care of resources | wealth |
| `vocation` | cultivation, role, calling | career |
| `household` | ordered daily life | home |
| `contemplation` | Sabbath, prayer, renewal | leisure / reflection |

Suggested constant:

```python
life_domains = [
    "mind",
    "body",
    "relationships",
    "stewardship",
    "vocation",
    "household",
    "contemplation",
]
```

## Solomonic Clock Role

The clock provides temporal guidance cycles rather than passive status readouts. It should emit:

- `current_phase`
- `recommended_domain_focus`
- `reflection_prompts`
- `discipline_prompts`
- current counsel state already used by the clock, oracle, and Pericope chat layers

Example:

```json
{
  "phase": "contemplation",
  "domain_focus": "mind",
  "guidance": ["study", "reflection"]
}
```

## Moral Architecture Layer

Before AI advice influences decisions, pass it through a moral filter. This layer exists to block purely utilitarian or exploitative optimization.

Core principles:

- `truth`
- `love`
- `humility`
- `stewardship`
- `justice`
- `discipline`
- `faith`

Example:

```text
AI suggestion: maximize profit by exploiting information asymmetry
Moral layer: violates stewardship; violates justice
Result: reject recommendation
```

The AI should function as advisor, not authority. It may:

- interpret,
- suggest,
- reflect,
- challenge.

It should not:

- judge the soul,
- command obedience,
- replace conscience.

## Virtue Wheel

Medieval moral diagrams often used a wheel, tree, or ladder to show that human life must be ordered from a governing center outward. For this project, the wheel model is the most useful because it matches the existing clock UI and makes balance visually legible.

Center:

- `Logos`
- `Christ`
- `Divine Wisdom`

Primary virtue anchors:

| Virtue | Meaning |
| --- | --- |
| `prudence` | wisdom in judgment |
| `justice` | right relations |
| `temperance` | self-control |
| `fortitude` | courage and endurance |
| `faith` | trust and orientation |
| `hope` | confidence in restoration |
| `love` | highest guiding principle |

Key design rule:

- wisdom without love becomes manipulation,
- courage without wisdom becomes recklessness,
- discipline without justice becomes tyranny.

Map the virtue wheel into Life OS domains:

| Life OS Domain | Virtue Anchor |
| --- | --- |
| `mind` | `prudence` |
| `body` | `temperance` |
| `relationships` | `love` / `justice` |
| `stewardship` | `justice` |
| `vocation` | `fortitude` |
| `household` | `temperance` / `discipline` |
| `contemplation` | `faith` / `hope` |

Operational stack:

```text
Solomonic Clock
      |
Planetary Context
      |
Human Life Domains
      |
Virtue Wheel Evaluation
      |
Scripture + Advice
```

## Canonical Hours Engine

Canonical hours add a moral rhythm layer to the planetary clock. They are useful because they divide the day into human formation phases rather than only symbolic correspondences.

Suggested base model:

| Hour | Time Band | Focus | Virtue |
| --- | --- | --- | --- |
| `Matins` | night | contemplation | `faith` |
| `Lauds` | dawn | gratitude | `hope` |
| `Prime` | early morning | preparation | `prudence` |
| `Terce` | mid-morning | work begins | `discipline` |
| `Sext` | noon | humility and reflection | `temperance` |
| `None` | afternoon | perseverance | `fortitude` |
| `Vespers` | evening | gratitude and relationship | `love` |
| `Compline` | night | examination and rest | `reflection` |

Suggested object:

```javascript
const canonicalHours = [
  { name: "Matins", focus: "contemplation", virtue: "faith" },
  { name: "Lauds", focus: "gratitude", virtue: "hope" },
  { name: "Prime", focus: "preparation", virtue: "prudence" },
  { name: "Terce", focus: "work", virtue: "discipline" },
  { name: "Sext", focus: "humility", virtue: "temperance" },
  { name: "None", focus: "perseverance", virtue: "fortitude" },
  { name: "Vespers", focus: "gratitude", virtue: "love" },
  { name: "Compline", focus: "examination", virtue: "reflection" }
];
```

Integration model:

```text
Solomonic Clock
      |
Planetary Phase
      |
Canonical Hour
      |
Life Domain Focus
      |
Guidance
```

Example merge:

- planetary: Mars, bold action, conflict resolution
- canonical hour: Sext, humility, reflection
- combined output: act boldly but remain humble; do difficult work without anger

Domain emphasis by canonical hour:

| Hour | Domain |
| --- | --- |
| `Matins` | `contemplation` |
| `Lauds` | `relationships` |
| `Prime` | `mind` |
| `Terce` | `vocation` |
| `Sext` | `body` |
| `None` | `vocation` / perseverance |
| `Vespers` | `relationships` |
| `Compline` | `contemplation` / reflection |

## Virtue Engine

The Virtue Engine is the semantic backbone of the Life OS. Its job is to translate symbolic signals into one shared ethical vocabulary so the guidance engine can reason across planets, sectors, hours, scripture, and life domains without treating them as unrelated systems.

Core translation flow:

```text
sector
  +
planet
  +
canonical hour
  +
life domain
  +
scripture
  ->
virtue
  ->
practice
```

### Core Virtue Set

Use a small stable set for canonical reasoning:

| Virtue | Meaning |
| --- | --- |
| `prudence` | wise judgment |
| `temperance` | self-control |
| `justice` | fairness and order |
| `fortitude` | courage and endurance |
| `faith` | trust and orientation |
| `hope` | perseverance and expectation |
| `love` | compassion and charity |

Store these as lower-case slugs in data and render title case in the UI.

### Domain Mapping

The life domains provide the most stable virtue anchors:

```json
{
  "mind": "prudence",
  "body": "temperance",
  "relationships": "love",
  "stewardship": "justice",
  "vocation": "fortitude",
  "household": "temperance",
  "contemplation": "faith"
}
```

### Planetary Bias

Planets should bias virtue selection without overriding it. They add pressure and tone, not final judgment.

```json
{
  "Mars": { "primaryVirtue": "fortitude", "biasTags": ["discipline", "strength"] },
  "Venus": { "primaryVirtue": "love", "biasTags": ["harmony", "reconciliation"] },
  "Mercury": { "primaryVirtue": "prudence", "biasTags": ["clarity", "communication"] },
  "Jupiter": { "primaryVirtue": "justice", "biasTags": ["leadership", "order"] },
  "Saturn": { "primaryVirtue": "hope", "biasTags": ["perseverance", "responsibility"] },
  "Moon": { "primaryVirtue": "faith", "biasTags": ["care", "reflection"] },
  "Sun": { "primaryVirtue": "fortitude", "biasTags": ["purpose", "integrity"] }
}
```

### Sector Correction

Each sector should expose:

- `shadow`,
- `virtue`,
- `practice`.

Example:

```json
{
  "spirit": "Leraje",
  "shadow": "anger",
  "virtue": "temperance",
  "practice": "restraint in speech"
}
```

Meaning:

```text
sector shadow
  ->
virtue correction
  ->
practice guidance
```

### Canonical-Hour Focus

Canonical hours also contribute a virtue emphasis:

```json
{
  "Matins": "faith",
  "Lauds": "hope",
  "Prime": "prudence",
  "Terce": "discipline",
  "Sext": "temperance",
  "None": "fortitude",
  "Vespers": "love",
  "Compline": "reflection"
}
```

### Scripture Tagging

Scripture records should carry virtue tags so selection is reusable across guidance modes.

Example:

```json
{
  "reference": "Proverbs 15:1",
  "text": "A soft answer turneth away wrath.",
  "virtues": ["temperance", "love"]
}
```

### Virtue Resolution

The guidance engine should merge virtue signals instead of choosing a source arbitrarily.

Example input:

- planet: Mars
- sector: Leraje
- hour: Sext
- weak domain: `relationships`

Signals:

- Mars -> `fortitude`
- Leraje -> `temperance`
- Sext -> `temperance`
- relationships -> `love`

Resolved result:

- primary virtue: `temperance`
- supporting virtues: `fortitude`, `love`

Reference logic:

```javascript
function resolveVirtue(signals) {
  const weights = new Map();

  for (const signal of signals) {
    weights.set(signal.virtue, (weights.get(signal.virtue) || 0) + signal.weight);
  }

  return [...weights.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
```

### Practice Generation

The virtue becomes the common variable that guidance can act on.

Example:

```text
Virtue Focus
Temperance

Practice
Speak calmly during conflict.

Scripture
Proverbs 15:1
```

### Design Rule

Without the Virtue Engine, the system outputs symbolic meanings. With it, the system outputs human practices.

## Wisdom Graph

The Wisdom Graph is the relationship layer that lets the system reason across everything it already knows. Instead of treating sectors, virtues, domains, scripture, planets, and practices as isolated lookups, the graph connects them into traversable paths.

Purpose:

- connect symbolic signals to practical outcomes,
- let guidance traverse relationships instead of reading flat mappings,
- support richer counsel, rule generation, and future exploratory UI.

Graph model:

- nodes represent concepts,
- edges represent relations between concepts.

Scaling rule:

- all knowledge should connect through virtues,
- do not build arbitrary direct links such as `author -> author`, `sector -> author`, or `scripture -> sector`,
- prefer `sector -> virtue`, `author -> virtue`, `scripture -> virtue`, `practice -> virtue`, and `domain -> virtue`,
- treat virtue nodes as the stable hub that keeps the graph bounded as authors and texts grow.

Primary node types:

- `sector`
- `planet`
- `virtue`
- `domain`
- `scripture`
- `practice`
- `shadow`

Example nodes:

```json
{
  "nodes": [
    { "id": "leraje", "type": "sector" },
    { "id": "temperance", "type": "virtue" },
    { "id": "relationships", "type": "domain" },
    { "id": "proverbs_15_1", "type": "scripture" },
    { "id": "pause_before_speaking", "type": "practice" }
  ]
}
```

Example edges:

```json
{
  "edges": [
    { "from": "leraje", "to": "temperance", "relation": "corrected_by" },
    { "from": "temperance", "to": "relationships", "relation": "governs" },
    { "from": "temperance", "to": "proverbs_15_1", "relation": "illustrated_by" },
    { "from": "temperance", "to": "pause_before_speaking", "relation": "practice" }
  ]
}
```

Resulting path:

```text
sector
  ->
virtue
  ->
domain
  ->
scripture
  ->
practice
```

Example chain:

```text
Leraje
  ->
Temperance
  ->
Relationships
  ->
Proverbs 15:1
  ->
Calm speech
```

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

Suggested storage:

- start with `wisdom_graph.json`,
- later move to an in-memory graph engine or graph database if needed,
- keep the first version JSON-based and fully inspectable.

Reference traversal:

```javascript
function resolveGuidanceFromGraph(graph, sectorId) {
  const virtue = graph.getNeighbor(sectorId, "corrected_by");
  const domain = graph.getNeighbor(virtue, "governs");
  const scripture = graph.getNeighbor(virtue, "illustrated_by");
  const practice = graph.getNeighbor(virtue, "practice");

  return { virtue, domain, scripture, practice };
}
```

Expansion example:

```json
{
  "id": "anger",
  "type": "shadow"
}
```

```json
{
  "from": "anger",
  "to": "temperance",
  "relation": "countered_by"
}
```

This allows the system to reason:

```text
anger
  ->
temperance
  ->
calm speech
```

Design consequence:

- without the graph, the system relies on linear mappings,
- with the graph, it can navigate meaning across the symbolic and practical layers.
- by keeping virtue as the hub, the graph can grow to hundreds of authors without collapsing into combinatorial links.

## Wisdom Index

The Wisdom Index is the authority-ordering layer that decides which sources the Life OS should prefer for a given virtue, situation, or practice. It keeps Christ and Scripture at the center while still allowing mentors and philosophers to contribute reflection.

Purpose:

- determine which sources speak to a given virtue,
- anchor guidance in Scripture before commentary,
- let mentors serve as interpretation rather than equal authorities,
- make new Pericope authors pluggable without flattening the system's hierarchy.

Authority structure:

```json
{
  "authorityLevels": [
    "Christ",
    "Scripture",
    "Primary Christian teachers",
    "Philosophical wisdom authors"
  ]
}
```

Guiding rule:

- Christ = primary authority,
- Scripture = canonical foundation,
- Christian teachers = faithful commentary,
- philosophical authors = secondary reflection,
- practices = lived application.

Suggested data model:

```json
{
  "virtues": {
    "Temperance": {
      "scripture": ["Proverbs 15:1", "James 1:19"],
      "mentors": ["Solomon", "Augustine", "Marcus Aurelius"],
      "practices": [
        "pause before speaking",
        "respond calmly in conflict"
      ]
    }
  }
}
```

Resolution flow:

```text
sector
  ->
virtue
  ->
wisdom index
  ->
scripture anchor
  ->
mentor reflection
  ->
practice
```

Example result:

```text
Virtue: Temperance

Scripture
"A soft answer turns away wrath." - Proverbs 15:1

Reflection (Solomon)
A gentle word preserves peace and guards the heart.

Practice
Respond calmly in moments of disagreement.
```

Mentor selection rule:

- choose mentors from the virtue's indexed candidates,
- rotate or rank within that candidate set,
- never let mentor voice replace the scripture anchor,
- allow `Scripture only` mode when no commentary is desired.

Example selector:

```javascript
function selectMentorForVirtue(wisdomIndex, virtue, rotationState) {
  const candidates = wisdomIndex.virtues[virtue].mentors;
  return rotate(candidates, rotationState);
}
```

Pericope integration rule:

- each new author should declare virtue coverage and authority priority,
- the Wisdom Index should ingest those descriptors automatically,
- mentor availability should be filtered by both virtue relevance and authority tier.

Example author descriptor:

```json
{
  "author": "Thomas Aquinas",
  "virtues": ["prudence", "justice", "temperance", "fortitude"],
  "priority": "primary_christian_teacher"
}
```

Design consequence:

- the Life OS can scale to many voices without losing theological center,
- the mentor layer becomes commentary over a stable canonical core,
- guidance remains coherent even as the Pericope author library grows.

## PericopeAI Wisdom Reasoning Engine

PericopeAI should evolve from a chatbot shell into the wisdom corpus and reasoning layer for the Life OS. The clock remains the front-end instrument; Pericope becomes the structured backend that stores authors, resolves virtue-relevant sources, and renders mentor guidance.

Target backend flow:

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

### Corpus Normalization

Pericope chunks should carry semantic metadata instead of only source or embedding information.

Example chunk metadata:

```json
{
  "author": "Augustine",
  "source": "Confessions",
  "virtues": ["faith", "love"],
  "themes": ["restlessness", "conversion"],
  "lifeDomains": ["contemplation", "relationships"]
}
```

This allows the Life OS to ask for virtue-specific material and receive scripture, mentors, and practices through the same indexed structure.

### Virtue Tagging Pipeline

Suggested preprocessing flow:

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

Suggested classifier prompt:

```text
Classify this passage according to:
virtues: prudence, temperance, justice, fortitude, faith, hope, love
life domains: mind, body, relationships, stewardship, vocation, household, contemplation
```

The goal is to make every chunk queryable by virtue and life domain, not only by surface keywords.

### Wisdom Index Service

Pericope should expose the Wisdom Index as a service boundary, not only as an in-memory helper.

Example endpoint:

```text
GET /wisdom/virtue/temperance
```

Example response:

```json
{
  "scripture": ["Proverbs 15:1"],
  "mentors": ["Solomon", "Augustine", "Marcus Aurelius"],
  "practices": ["calm speech", "restraint"]
}
```

This becomes the bridge between the Life OS and Pericope's author corpus.

### Mentor Rendering Layer

Chat personas should become structured mentor profiles rather than ad hoc prompt presets.

Example profile:

```json
{
  "mentor": "Augustine",
  "style": "reflective",
  "tone": "pastoral",
  "virtueFocus": ["faith", "love"]
}
```

Example rendering prompt:

```text
Speak in the voice of Augustine.
Virtue: temperance
Context: conflict in relationships.
Offer a brief reflection encouraging restraint.
```

### Life OS Guidance API

Pericope should expose a guidance endpoint specifically for the Life OS.

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

This endpoint should sit behind:

- `POST /lifeos/guidance`
- optional virtue lookup helpers such as `GET /wisdom/virtue/{virtue}`

### Graph Storage Path

Start with JSON graph files or an in-memory graph engine. If the corpus grows substantially, move the Wisdom Graph into a graph-native store such as:

- `Neo4j`
- `ArangoDB`
- `NetworkX`-based services for Python-first experimentation

### Author Ingestion Pipeline

New Pericope authors should become Life OS mentors through one repeatable ingestion flow:

```text
author text
  ->
chunk
  ->
virtue tagging
  ->
wisdom-graph insertion
  ->
mentor profile creation
```

Adding a new author should not require Life OS code changes if corpus normalization and indexing are complete.

### End-to-End Flow

```text
clock state
  ->
virtue engine
  ->
POST /lifeos/guidance
  ->
PericopeAI corpus + wisdom index
  ->
mentor narrative
  ->
clock guidance panel
```

### Design Consequence

- PericopeAI is no longer only a chatbot; it becomes a Wisdom Reasoning Engine.
- The clock remains visually centered and lightweight because the heavy semantic work happens in Pericope.
- The combined system can scale from a small mentor set to a large author library without collapsing into prompt chaos.

## Reflection Engine

The system should include a daily examination loop inspired by older wisdom traditions.

Core prompts:

- Where did I act with wisdom today?
- Where did I fail in discipline?
- Did my actions serve others?
- Was I faithful in my responsibilities?

Suggested interface:

- morning orientation,
- daytime action tracking,
- evening examination,
- optional mentor dialogue after reflection.

Suggested storage:

- `life_journal`
- `reflection_entries`
- `daily_examination()`

## Persona Layer

Mentor personas can interpret the same Life OS state through different lenses:

- `Solomon`: wisdom, judgment, order
- `Augustine`: reflection, inward examination
- `Socrates`: questioning and clarification
- `Marcus Aurelius`: discipline and steadiness

These personas should remain interpretive overlays on the same underlying state model, not separate truth engines.

## Mentor Layer

The Mentor Layer is the modular voice system of the Life OS. It applies a chosen wisdom perspective to the same underlying guidance structure so the system can scale as new PericopeAI authors are added without rewriting the engine.

Key design rule:

- structure = clock, virtue, domain, practice
- voice = mentor

Purpose:

- let the same guidance be rendered through different traditions,
- keep mentor voice separate from the underlying reasoning pipeline,
- make Pericope authors plug directly into Life OS guidance.

Suggested mentor registry:

```json
{
  "mentors": [
    {
      "id": "solomon",
      "name": "Solomon",
      "tradition": "biblical wisdom",
      "focusVirtues": ["prudence", "justice"],
      "sources": ["proverbs", "ecclesiastes"]
    },
    {
      "id": "augustine",
      "name": "Augustine",
      "tradition": "early christian",
      "focusVirtues": ["faith", "love"],
      "sources": ["confessions", "city_of_god"]
    },
    {
      "id": "marcus_aurelius",
      "name": "Marcus Aurelius",
      "tradition": "stoic",
      "focusVirtues": ["temperance", "fortitude"],
      "sources": ["meditations"]
    }
  ]
}
```

Invocation flow:

```text
virtue
  ->
mentor selection
  ->
mentor voice
  ->
narrative guidance
```

Example structured output:

- virtue = `Temperance`
- domain = `Relationships`
- practice = `calm speech`
- scripture = `Proverbs 15:1`

Example mentor renderings:

Solomon:

```text
Better is a gentle answer than a harsh word.
Restraint in speech guards the heart and preserves peace.
Practice calm speech today.
```

Marcus Aurelius:

```text
Anger is a momentary madness.
Choose calm reason instead of impulse.
Respond with composure in conflict.
```

Augustine:

```text
The restless heart seeks peace in charity.
Speak with patience and humility, for love governs speech.
```

Suggested prompt template:

```text
Context
Planet: Mars
Sector: Leraje
Virtue: Temperance
Domain: Relationships

Instruction
Speak as {mentor}.
Provide a short reflection guiding the user in this virtue.
```

UI model:

- add a `Mentor` selector near the center guidance panel,
- default to one mentor at a time,
- optionally allow rotation mode by day or by week.

Example rotation:

- Monday -> Solomon
- Tuesday -> Marcus Aurelius
- Wednesday -> Seneca
- Thursday -> Aquinas
- Friday -> Augustine
- Saturday -> Desert Fathers
- Sunday -> Scripture only

Pericope integration rule:

- each Pericope author should expose corpus, virtue focus, and style template,
- the Life OS should load those author descriptors as plug-ins,
- adding a new wisdom author should make that author available to the Mentor Layer automatically.

Design consequence:

- the system can scale to many mentors without changing its reasoning core,
- voice remains swappable while structure stays stable.

## Formation Loops

Game-like mechanics are useful only if they reinforce wisdom rather than raw compulsion. The key loops are:

### Progress Visibility

- show domain progress,
- levels, streaks, or XP can make slow growth visible,
- the feedback loop should help users notice formation, not only completion.

### Identity Framing

- frame growth as becoming a kind of person, not merely finishing chores,
- domain naming and archetypes should reinforce human development rather than cartoon reward chasing.

### Narrative Campaign

- treat life as an unfolding campaign of formation,
- ordinary actions become training toward wisdom, endurance, justice, temperance, and responsibility.

Design rule:

- productivity mechanics are allowed,
- wisdom, reflection, and moral architecture remain primary.

## Historical Pattern

This structure aligns with recurring training frameworks in:

- Greek askesis,
- Stoic disciplines,
- early Christian rules of life,
- medieval monastic practice,
- Renaissance symbolic systems,
- modern life-domain and habit systems.

What modern apps typically retain:

- tracking,
- rewards,
- progress loops.

What they usually lose:

- reflection,
- moral guidance,
- narrative of becoming,
- mentors / dialogue.

The Life OS should restore those missing layers.

## Core Modules

- `solomonic_clock_engine`
- `life_domain_tracker`
- `virtue_wheel_engine`
- `wisdom_graph_engine`
- `pericope_corpus_index`
- `virtue_tagging_pipeline`
- `wisdom_index_service`
- `moral_architecture_filter`
- `canonical_hours_engine`
- `sector_guidance_engine`
- `scripture_selection_engine`
- `rule_of_life_generator`
- `mentor_rendering_service`
- `pentacle_renderer`
- `lifeos_guidance_api`
- `mentor_layer_engine`
- `daily_guidance_narrative_engine`
- `virtue_forecast_engine`
- `providence_timeline_engine`
- `providence_map_renderer`
- `ai_guidance_engine`
- `reflection_engine`
- `persona_dialogue_system`
- `life_journal`

The `pentacle_renderer` should stay in the UI/rendering boundary. It consumes resolved guidance state and emits SVG; it should not become a second guidance engine. Detailed handoff: see `docs/pentacle_svg_system.md`.

## Data Model

Suggested objects:

```json
{
  "user_life_state": {
    "domain_scores": {},
    "recent_actions": [],
    "reflection_entries": [],
    "goals": []
  },
  "domain_progress": {
    "mind": 0,
    "body": 0,
    "relationships": 0,
    "stewardship": 0,
    "vocation": 0,
    "household": 0,
    "contemplation": 0
  }
}
```

Additional fields worth tracking:

- `virtue_signals`
- `virtue_balance`
- `wisdom_graph_paths`
- `wisdom_index_hits`
- `authority_rankings`
- `scripture_anchors`
- `moral_filter_decisions`
- `mentor_interactions`
- `mentor_registry`
- `mentor_preferences`
- `pericope_author_profiles`
- `corpus_chunk_metadata`
- `virtue_tag_index`
- `narrative_milestones`
- `canonical_hour_state`
- `sector_events`
- `active_rule_state`
- `practice_history`
- `daily_narratives`
- `virtue_forecast_windows`
- `forecast_summaries`
- `timeline_entries`
- `weekly_summaries`
- `monthly_patterns`
- `providence_map_nodes`
- `providence_clusters`
- `timeline_entries`
- `weekly_summaries`
- `monthly_patterns`

## 72-Sector Guidance Engine

The outer sectors of the Solomonic clock can function as a behavioral archetype engine. Instead of presenting spirits only symbolically, map each sector into shadow, virtue, correction, and scripture guidance.

Suggested schema:

```javascript
const sector = {
  id: 23,
  zodiac: "Gemini 5-10",
  spirit: "Leraje",
  domain: "conflict",
  shadow: "anger",
  virtue: "restraint",
  correction: "control speech",
  scripture: ["Proverbs 15:1", "James 1:19"]
};
```

Interpretation pipeline:

```text
Solomonic Clock
      |
Sector Detection
      |
Behavior Archetype
      |
Virtue Correction
      |
Scripture
```

Example from the current UI pattern:

- Tuesday / Mars
- zodiac sector: Gemini 5-10
- spirit: Leraje
- pentacle theme: protection from harm

Generated training output:

- theme: conflict and aggression
- risks: arguments, impulsive speech
- virtue training: restraint, clarity
- correction: address conflict calmly; do difficult work without anger

Sector events should be loggable against user history so AI can detect repeated patterns.

## UI Concepts

Potential dashboard modules:

- Solomonic Clock
- Life Domain Wheel
- Virtue Wheel
- Current Phase / Canonical Hour
- Active Sector Panel
- Daily Guidance
- Reflection Journal
- Mentor Dialogue

## Life Wheel Ring

The Life Wheel is the ring that turns the clock from a cosmic-time display into a Life OS dashboard. It should sit between the zodiac ring and the canonical-hours ring and answer a different question than the outer clock:

- outer clock: what cosmic time is it?
- Life Wheel: what area of life needs attention?

Placement:

```text
Solomonic sectors
      |
zodiac ring
      |
LIFE WHEEL
      |
canonical hours
      |
center guidance
```

### Domain Structure

Use seven domains:

| Domain | Virtue Anchor |
| --- | --- |
| `Mind` | wisdom / prudence |
| `Body` | temperance |
| `Relationships` | love |
| `Stewardship` | justice |
| `Vocation` | fortitude |
| `Household` | discipline |
| `Contemplation` | faith |

### Geometry

For incremental integration into the current build, target an approximate ring span of:

- `lifeWheelOuter = 320`
- `lifeWheelInner = 250`
- thickness: about `70px`

This is a pragmatic fit for the current UI while the broader rose-window geometry continues to normalize.

Segment count:

- `7`
- `360 / 7 ~= 51.428deg`

Example generator:

```javascript
const lifeDomains = [
  "Mind",
  "Body",
  "Relationships",
  "Stewardship",
  "Vocation",
  "Household",
  "Contemplation"
];

const segmentAngle = 360 / lifeDomains.length;
```

### Domain Data Model

The Life Wheel should read from user-state rather than the canonical symbolic dataset.

Example:

```json
{
  "lifeDomains": {
    "Mind": 68,
    "Body": 52,
    "Relationships": 41,
    "Stewardship": 63,
    "Vocation": 72,
    "Household": 55,
    "Contemplation": 30
  }
}
```

The values represent life-balance scores, not metaphysical states.

### Visual Encoding

Segments should fill radially by score.

| Score | Color |
| --- | --- |
| `0-40` | crimson |
| `40-70` | gold / amber |
| `70-100` | emerald |

Suggested domain palette:

| Domain | Color Direction |
| --- | --- |
| `Mind` | sapphire |
| `Body` | emerald |
| `Relationships` | ruby |
| `Stewardship` | amber |
| `Vocation` | steel blue |
| `Household` | bronze |
| `Contemplation` | violet |

Use thin gold borders between segments so the ring still feels like stained glass rather than a generic chart.

### Interaction

Hover on a Life Wheel segment should reveal:

- domain name,
- current score,
- virtue anchor,
- one short suggestion.

Example:

```text
Domain: Relationships
Score: 41%
Virtue: Patience
Suggestion: Repair strained connection
```

Click behavior:

- open the domain journal or detail panel,
- show recent reflections, suggested actions, and current weak/strong signals.

### Connection to Clock Guidance

When a sector or guidance state targets a domain, the matching Life Wheel segment should highlight.

Example:

- Mars
- Gemini
- spirit: Leraje
- theme: conflict

Mapping result:

- domain -> `Relationships`
- virtue -> `restraint`

That should cause the `Relationships` segment to glow or pulse lightly.

### Animated Feedback

When guidance targets a domain:

```css
.life-domain-active {
  filter: drop-shadow(0 0 8px gold);
}
```

Animation rules:

- pulse only the targeted segment,
- animate score changes slowly,
- avoid constant motion across the whole ring.

### Implementation Order

1. Create `life_domains.json` or equivalent domain-state source.
2. Draw the SVG ring.
3. Compute segment angles.
4. Load user state.
5. Render fill levels.
6. Add hover and click interactions.

## Life Training Engine

The missing step between symbolic display and Life OS behavior is a feedback loop that converts the current moment and the current life imbalance into a concrete training recommendation.

Core inputs:

- cosmic time,
- life imbalance,
- virtue framework.

Core output:

- one practice recommendation for today.

Example:

- planet: Mars
- sector: Leraje
- canonical hour: Sext
- weakest domain: `Relationships`

Training output:

```text
TODAY'S TRAINING
Domain: Relationships
Virtue: Restraint
Practice: Respond calmly during disagreement.
```

Conceptual flow:

```text
cosmic time
   +
life imbalance
   +
virtue mapping
   =
training recommendation
```

Example pseudocode:

```javascript
function generateTraining(state, userLifeState, sectors, virtueMap) {
  const weakDomain = lowest(userLifeState.lifeDomains);
  const sector = sectors[state.sector];
  const virtue = virtueMap[weakDomain];

  return {
    domain: weakDomain,
    virtue,
    message: combine(sector.guidance, virtue)
  };
}
```

### UI Placement

Add a panel directly under the clock:

```text
TODAY'S TRAINING

Domain
Relationships

Virtue
Restraint

Practice
Respond calmly in conflict
```

This should be the practical output of the system, not another explanatory block.

### Daily Loop

Morning:

- clock updates,
- weakest domain detected,
- training assigned.

Day:

- user actions logged,
- domain scores adjusted,
- guidance and domain highlight stay in sync.

Evening:

- reflection prompts ask whether the training was actually practiced,
- scores are adjusted or confirmed,
- journal captures the result.

### Reflection Integration

Example end-of-day prompts:

- Did I practice restraint today?
- Did I respond calmly in conflict?

Store results in the journal and use them to refine future domain scores and recommendations.

### Long-Term View

Over time, the system should be able to show:

- domain improvement,
- virtue growth,
- repeated struggle areas,
- training follow-through rates.

Example:

```text
Virtue Development
Relationships ↑
Temperance ↑
Anger ↓
```

## Rule-of-Life Generator

The Rule-of-Life Generator extends the guidance system from a single recommendation into a structured daily rhythm. Historically a rule of life shaped behavior through recurring practices across the day; in this project the generator should build that rhythm from clock state, life imbalance, and resolved virtue focus.

Core formula:

```text
cosmic state
  +
life imbalance
  +
virtue engine
  =
daily rule
```

Purpose:

- convert guidance into a schedule of practices,
- align those practices with the current hour and daily virtue focus,
- give the user a concrete daily rule rather than isolated advice fragments.

### Core Inputs

The generator should read:

- `clock_state`,
- `life_domain_scores`,
- `virtue_engine_output`,
- `wisdom_graph_path`,
- `canonical_hour`.

Example state:

- planet: Mars
- sector: Leraje
- canonical hour: Sext
- weak domain: `Relationships`
- virtue focus: `Temperance`

### Practice Library

Rules should be assembled from a reusable practice library keyed by virtue.

Example:

```json
{
  "temperance": [
    "Pause before speaking in tension.",
    "Avoid escalation in disagreement.",
    "Practice calm responses."
  ],
  "fortitude": [
    "Complete one difficult task.",
    "Face a challenge directly.",
    "Do the hard work first."
  ]
}
```

### Canonical-Hour Practice Types

Each hour biases the type of practice selected:

| Hour | Practice Type |
| --- | --- |
| `Matins` | reflection |
| `Lauds` | gratitude |
| `Prime` | planning |
| `Terce` | work |
| `Sext` | humility |
| `None` | perseverance |
| `Vespers` | gratitude |
| `Compline` | examination |

### Rule Generation

Conceptual flow:

```text
weak domain
  ->
virtue mapping
  ->
wisdom graph
  ->
practice library
  ->
canonical hour filter
  ->
daily rule
```

Reference pseudocode:

```javascript
function generateRule(state, lifeScores, domainVirtueMap, practiceLibrary, canonicalHourMap) {
  const weakDomain = lowest(lifeScores);
  const virtue = domainVirtueMap[weakDomain];
  const graphPath = resolveWisdomPath(state, virtue, weakDomain);
  const practices = selectPracticesFromGraph(graphPath, practiceLibrary);
  const hourType = canonicalHourMap[state.canonicalHour];

  return selectPractice(practices, hourType);
}
```

### Example Output

Example generated rule:

```text
TODAY'S RULE

Virtue
Temperance

Morning
Pause before responding in disagreement.

Midday
Practice calm speech during conflict.

Evening
Reflect on moments of anger or restraint.
```

This panel should update automatically as the clock state changes or as the user's weakest domain shifts.

### Weekly Rule

The same engine should generate a weekly rule that can feed the existing Weekly Arc.

Example:

```text
WEEKLY TRAINING

Virtue
Fortitude

Focus
Complete difficult work without avoidance.
```

### Personalization Layer

As the system gathers user history, rules should become more specific.

Example:

```text
frequent anger events
  +
Mars sector
  =
conflict training emphasis
```

### Storage

Persist generated rules and follow-through:

```json
{
  "rulesHistory": [],
  "practiceLog": []
}
```

### Visual Feedback

When a rule is active:

- highlight the relevant Life Wheel segment,
- glow the center compass,
- show the active virtue badge near the center guidance.

### Design Consequence

This is the point where the system becomes a daily practice engine rather than only a symbolic interpreter.

## Daily Guidance Narrative Engine

The Daily Guidance Narrative Engine is the voice layer of the system. Its job is to take structured guidance outputs and turn them into one readable message that feels coherent, intentional, and human rather than mechanical.

Purpose:

- convert structured signals into a readable daily message,
- bind clock state, virtue focus, practice, and scripture into one short narrative,
- support multiple reading depths without changing the underlying guidance logic.

Example structured input:

- planet: Mars
- sector: Leraje
- virtue: Temperance
- domain: Relationships
- practice: calm speech
- scripture: Proverbs 15:1
- canonical hour: Sext
- mentor: Solomon

Example narrative:

```text
Today favors courage and decisive action, yet the current sector warns against anger.
Practice restraint in your speech, especially in moments of conflict.
"A soft answer turneth away wrath." — Proverbs 15:1
```

### Narrative Inputs

The engine should receive:

- `planet`
- `sector`
- `virtue`
- `domain`
- `practice`
- `scripture`
- `canonical_hour`
- `mentor`

### Narrative Structure

Break the message into four parts:

1. cosmic context
2. virtue focus
3. practical action
4. scripture anchor

Template shape:

```text
{cosmic}

{virtue}

{practice}

{scripture}
```

### Section Roles

Cosmic context:

- planet and hour establish tone,
- sector adds friction, warning, or emphasis.

Example prompt lines:

- Mars -> `This day favors courage and decisive action.`
- Venus -> `Today invites harmony and kindness.`
- Mercury -> `This moment favors clear thinking and communication.`
- Sext -> `Pause in the midst of work and remember humility.`
- None -> `Persevere through difficulty.`

Virtue focus:

- explains what quality is being trained.

Examples:

- Temperance -> `Practice restraint and calm judgment.`
- Fortitude -> `Face difficult tasks without hesitation.`
- Prudence -> `Act thoughtfully and with wisdom.`

Practical action:

- turns virtue into behavior.

Examples:

- calm speech -> `Respond gently in moments of tension.`
- finish difficult task -> `Do the work you have been avoiding.`
- patience -> `Give others time and understanding.`

Scripture anchor:

- always closes the message,
- keeps the narrative tied to a textual source rather than free-floating commentary.

Example:

```text
"A soft answer turneth away wrath." — Proverbs 15:1
```

### Generator

Reference pseudocode:

```javascript
function generateNarrative(state, templates, scriptureText) {
  const cosmic = templates.planets[state.planet];
  const hour = templates.hours[state.canonicalHour];
  const virtue = templates.virtues[state.virtue];
  const practice = templates.practices[state.practice];
  const scripture = scriptureText[state.scripture];

  return `${cosmic} ${hour}\n${virtue}\n${practice}\n"${scripture}"`;
}
```

### Reading Depth

Use the existing reading-depth control for narrative expansion:

- `short` -> two sentences,
- `medium` -> three to five sentences,
- `long` -> one fuller reflection paragraph.

Short example:

```text
This day favors courage and decisive action.
Practice restraint in your speech. "A soft answer turneth away wrath." — Proverbs 15:1
```

Medium example:

```text
This day favors courage and decisive action. Mars calls for strength and clarity, yet the current sector warns against anger.
Practice restraint in your speech and respond calmly in disagreement.
A gentle answer can turn away wrath (Proverbs 15:1).
```

Long example:

```text
Mars brings the energy of courage and action today. It is a time to face difficulty rather than avoid it.
Yet the present sector warns that anger and conflict may arise easily. Strength is not shown through aggression but through restraint.
Speak carefully and respond calmly in moments of tension.
As Proverbs teaches, "A soft answer turneth away wrath."
```

### UI Placement

This should become the primary text block in `Today's Guidance`, replacing the long explanation wall with a clean readable narrative.

### Design Consequence

The narrative engine is what makes the whole system feel coherent. It converts:

```text
clock
  ->
sector
  ->
virtue
  ->
practice
  ->
scripture
```

into one message the user can actually absorb.

When a mentor is active, the narrative engine should preserve the same structure while letting the mentor supply the voice, tone, and phrasing.

## Providence Timeline

The Providence Timeline is the historical layer of the Life OS. It records how guidance, practice, reflection, and life-balance changes unfold through time so the system can answer not only `what should I do today?` but also `how is my life changing?`

Purpose:

- record daily interaction between cosmic state and lived response,
- let the user navigate backward through prior days,
- make virtue growth, repeated struggles, and domain change visible over time.

Core progression:

```text
clock
  ->
guidance
  ->
practice
  ->
reflection
  ->
history
```

### Timeline Entry Model

Each day should become one structured entry.

Example:

```json
{
  "date": "2026-03-10",
  "planet": "Mars",
  "sector": "Leraje",
  "virtue": "Temperance",
  "domainFocus": "Relationships",
  "opening": {
    "mentor": "Solomon",
    "intention": "Practice calm speech in conflict"
  },
  "practice": "Respond calmly in conflict",
  "scripture": "Proverbs 15:1",
  "reflection": "Stayed calm in meeting disagreement",
  "lifeScores": {
    "Mind": 68,
    "Body": 52,
    "Relationships": 46,
    "Stewardship": 63,
    "Vocation": 72,
    "Household": 55,
    "Contemplation": 30
  }
}
```

Suggested storage:

- start with `timeline_log.json`,
- later move to a small database if the history layer needs richer queries.

### Timeline UI

Add a horizontal historical rail below the main clock and guidance block.

Example:

```text
Today
 |
 ● Tue Mar 10  Mars
 |
 ● Mon Mar 09  Moon
 |
 ● Sun Mar 08  Sun
```

Clicking a node should open that day's guidance, practice, scripture, and reflection.

### Detail Panel

Selected-day detail should show:

- date,
- planet,
- virtue focus,
- practice,
- scripture,
- reflection,
- life-domain scores at closeout.

Example:

```text
March 10, 2026

Planet
Mars

Virtue Focus
Temperance

Practice
Respond calmly in conflict

Scripture
Proverbs 15:1

Reflection
Stayed calm during disagreement at work
```

### Trend Views

The timeline should pair with a simple life-domain trend graph.

Example:

```text
Relationships
41 -> 46 -> 50

Body
52 -> 53 -> 55
```

This makes domain and virtue growth legible over days and weeks.

### Visual Encoding

Timeline nodes can encode:

- planet by color,
- virtue by icon or badge,
- practice by a small symbol,
- completion or reflection state by fill or ring emphasis.

### Navigation

Use the existing date navigation as the base interaction:

- `Previous Day`
- `Today`
- `Next Day`

The timeline expands this from a button model into a visible chronology.

### Reflection Capture

At the end of the day, especially during Compline mode, prompt:

- What did I learn today?
- Where did I practice the virtue?
- What needs improvement?

Save those answers into the day's timeline entry.

### Summary Layers

Weekly summary:

```text
This week emphasized courage and restraint.
Your strongest improvement appeared in relationships.
Moments of anger decreased compared to last week.
```

Monthly pattern detection:

```text
Frequent conflict events appear on Mars days.
Practice restraint earlier in the day.
```

These summary layers should read from the timeline plus the Wisdom Graph.

### Design Consequence

Without the timeline, the system gives momentary counsel. With the timeline, the system becomes a record of formation through time.

## Providence Map

The Providence Map is the radial visualization of the Providence Timeline. It transforms linear history into a constellation around the clock so the user can see how days, virtues, reflections, and domain shifts form patterns over time.

Concept:

```text
timeline
  ->
constellation
```

Purpose:

- display historical entries as visible orbits around the clock,
- let users read life history spatially instead of only sequentially,
- make clusters of virtue, struggle, and growth immediately legible.

Visual stack:

```text
Providence Map
  ->
Solomonic sectors
  ->
zodiac ring
  ->
Life Wheel
  ->
canonical hours
  ->
Guidance Compass
```

### Providence Node

Each node corresponds to one timeline entry.

Example:

```json
{
  "date": "2026-03-10",
  "planet": "Mars",
  "sector": 13,
  "virtue": "Temperance",
  "domain": "Relationships",
  "scoreChange": 5
}
```

### Geometry

Angle comes from the active sector on that day:

```text
angle = sector * 5deg
```

Radius comes from time distance:

- today -> nearest orbit,
- one week ago -> mid orbit,
- one month ago -> outer orbit.

Reference formula:

```javascript
radius = baseRadius + daysAgo * spacing;
```

Suggested orbit bands:

- ring 1 -> last `7` days
- ring 2 -> last `30` days
- ring 3 -> last `365` days

Older nodes should fade or cluster.

### Visual Encoding

Node color should follow virtue color so ethical pattern is legible at a glance.

Suggested virtue palette:

| Virtue | Color |
| --- | --- |
| `prudence` | sapphire |
| `temperance` | emerald |
| `justice` | gold |
| `fortitude` | crimson |
| `faith` | violet |
| `hope` | sky blue |
| `love` | rose |

Node size should represent impact:

- minor reflection -> small node,
- major breakthrough or setback -> larger node.

Reference formula:

```javascript
size = Math.abs(scoreChange) * scale;
```

### Interaction

Hover:

```text
Mar 10, 2026
Mars — Temperance

Practice
Respond calmly in conflict

Reflection
Stayed calm during meeting disagreement
```

Clicking a node should open the corresponding timeline detail panel.

### Pattern Reading

As entries accumulate, clusters should emerge:

- repeated crimson nodes -> fortitude season,
- repeated emerald nodes -> temperance growth,
- repeated nodes on the same angular band -> recurring sector or domain themes.

Reference pattern rule:

```javascript
if (countVirtue("Temperance", last30days) > 5) {
  message = "This season emphasizes restraint and patience.";
}
```

These patterns should feed weekly summaries and monthly pattern notes.

### Toggle and Layout

Add a top-level view toggle:

```text
Clock View | Providence Map
```

Clock View keeps the present-focused guidance surface.

Providence Map shifts emphasis to historical pattern.

### Rendering Strategy

Suggested SVG groups:

```text
svg
 |- providence_nodes
 |- solomonic_sector_ring
 |- zodiac_ring
 |- life_domain_ring
 |- canonical_hour_ring
 |- center_guidance
 |- guidance_compass
```

Render order:

1. `providence_nodes`
2. `clock`
3. labels

This keeps constellation points visible behind the main instrument.

### Performance Strategy

Default limits:

- `maxNodes = 365`
- cluster older entries into year groups
- derive node placement from `timelineLog` rather than storing duplicate geometry

### Design Consequence

The timeline tells the user what happened. The Providence Map shows how life patterns emerge.

## Virtue Forecast Engine

The Virtue Forecast Engine is the future-facing layer of the Life OS. It extends the clock from present-moment counsel into short-horizon anticipation so the system can help users prepare for likely virtue challenges and opportunities.

Concept:

```text
astronomical state
  ->
future sectors
  ->
virtue mapping
  ->
guidance forecast
```

Purpose:

- forecast likely virtue emphasis over the next few hours or days,
- let users prepare rather than only react,
- complete the temporal arc of past (`Providence Map`), present (`clock`), and future (`forecast`).

Suggested windows:

| Window | Use |
| --- | --- |
| next `6h` | immediate preparation |
| next `24h` | daily planning |
| next `7d` | weekly pattern detection |

Example output:

```text
Tonight - Temperance
Tomorrow Morning - Prudence
Tomorrow Afternoon - Fortitude
```

Example data model:

```json
{
  "forecast": [
    {
      "time": "2026-03-11T06:00:00-06:00",
      "sector": 14,
      "virtue": "Prudence"
    },
    {
      "time": "2026-03-11T12:00:00-06:00",
      "sector": 15,
      "virtue": "Fortitude"
    }
  ]
}
```

Reference logic:

```javascript
function buildVirtueForecast(forecastWindows, currentLongitude, virtueFromSector) {
  const solarRate = 0.9856;

  return forecastWindows.map(daysAhead => {
    const futureLongitude = normalizeAngle(currentLongitude + daysAhead * solarRate);
    const sector = Math.floor(futureLongitude / 5);
    const virtue = virtueFromSector(sector);

    return { daysAhead, futureLongitude, sector, virtue };
  });
}
```

Weekly pattern output:

```text
This week emphasizes patience and restraint.
Prepare for moments that require measured speech.
```

UI placement:

- add an `Upcoming Guidance` panel near the clock for list-style forecast windows,
- optionally render a thin forecast arc just outside the main wheel,
- keep forecast visually subordinate to the current state so the instrument still reads from present outward.

Design consequence:

- Providence Map = past,
- clock + Life Wheel = present,
- Virtue Forecast Engine = future.

This makes the interface read as one temporal navigation system rather than a set of isolated widgets.

## Life Wheel Scoring System

The Life Wheel becomes meaningful only when its scores are computationally grounded. The scoring model should stay simple, transparent, and explainable so users can see exactly why a domain moved.

### Core Domain Scale

Each domain maintains a score from `0` to `100`.

```json
{
  "Mind": 68,
  "Body": 52,
  "Relationships": 41,
  "Stewardship": 63,
  "Vocation": 72,
  "Household": 55,
  "Contemplation": 30
}
```

Interpretation ranges:

| Score | Meaning |
| --- | --- |
| `0-30` | neglected |
| `30-50` | weak |
| `50-70` | stable |
| `70-85` | strong |
| `85-100` | flourishing |

The Life Wheel visualization should read directly from these values.

### Event Model

Scores change when events are logged. Events may be:

- manual, from user actions or journal entries,
- automatic, from future calendar, device, or task integrations.

Example event object:

```json
{
  "event": "exercise",
  "domain": "Body",
  "impact": 4
}
```

Suggested positive event mappings:

| Event | Domain | Base Impact |
| --- | --- | --- |
| read study material | `Mind` | `+3` |
| meditation or prayer | `Contemplation` | `+5` |
| exercise | `Body` | `+4` |
| resolve disagreement calmly | `Relationships` | `+6` |
| budget planning | `Stewardship` | `+3` |
| deep work session | `Vocation` | `+4` |
| clean or organize home | `Household` | `+3` |

Suggested negative event mappings:

| Event | Domain | Base Impact |
| --- | --- | --- |
| argument escalation | `Relationships` | `-5` |
| neglect responsibility | `Vocation` | `-4` |
| overspending | `Stewardship` | `-3` |
| lack of rest | `Body` | `-3` |

### Daily Decay

To prevent domains from becoming static badges, add light decay for neglect.

Default rule:

- `-1` per day for a domain with no recorded reinforcing activity.

Example:

- `Relationships: 52 -> 51` after one day of neglect.

This models life drift rather than failure.

### Virtue Alignment Multiplier

When a logged event aligns with the current training focus, planetary guidance, or canonical-hour emphasis, increase the reward modestly.

Example:

- normal impact: `+4`
- aligned impact: `+6`

Reference logic:

```javascript
if (event.domain === dailyFocus) {
  impact *= 1.5;
}
```

This rewards follow-through on today's counsel without overpowering the base scoring model.

### Reflection Adjustment

End-of-day reflection should have small but real influence because it measures awareness and honesty, not raw productivity.

Example:

- prompt: `Did I practice patience today?`
- if yes: `Relationships +2`

Reflection effects should stay lighter than event effects.

### Domain Balance Bonus

When all domains exceed a healthy minimum, award a small balance bonus.

Default rule:

- if every domain is above `50`, add `+1` to all domains.

This encourages holistic development rather than maxing one area while neglecting others.

### Domain Sensitivity

Domains should not all move at the same speed.

Suggested sensitivity weights:

| Domain | Sensitivity |
| --- | --- |
| `Mind` | medium |
| `Body` | medium |
| `Relationships` | high |
| `Stewardship` | low |
| `Vocation` | medium |
| `Household` | low |
| `Contemplation` | medium |

Reference formula:

```javascript
impact = baseImpact * domainWeight;
```

### Weekly Soft Normalization

Once per week, run a soft normalization pass so scores do not become distorted.

Suggested rules:

- scores above `85` gently reduce toward `85`,
- scores below `20` gently raise toward `25`.

This keeps the wheel readable and prevents runaway extremes.

### Training Selection Logic

The simplest recommendation model is:

- choose the weakest domain,
- combine it with the current sector archetype,
- apply the matching virtue vocabulary.

Example:

```text
Relationships = 41
Mars day
Virtue = restraint

Output:
Practice calm communication in conflict.
```

### Visualization Rules

Life Wheel segment fill:

- `score / 100 = radial fill percentage`

Color rules:

- `0-40` -> crimson
- `40-70` -> gold
- `70-100` -> emerald

Interaction rules:

- active domain gets a pulse glow,
- hover reveals the last score change and why it happened.

### System Loop

The full formation loop becomes:

```text
clock updates
  ->
guidance generated
  ->
user actions logged
  ->
domain scores updated
  ->
reflection
  ->
new guidance
```

### Design Principle

The system is not measuring success in any ultimate sense. It is measuring attention, follow-through, and balance across the domains of life.

The scoring engine should always be able to answer:

- what changed,
- why it changed,
- whether the change came from action, neglect, reflection, or alignment with training.

## Rose Window Interface

The interface should evolve from a stacked dashboard into a concentric rose-window composition. This matches the symbolic logic of the product and keeps time, virtue, life, and guidance readable as one system.

Base SVG geometry:

- canvas: `1000 x 1000`
- center point: `(500, 500)`
- total radius: `480`

Ring architecture:

| Ring | Purpose | Segment Count |
| --- | --- | --- |
| outer | Solomonic sectors | `72` |
| second | zodiac signs | `12` |
| third | life domains | `7` |
| fourth | canonical hours | `8` |
| center | guidance panel | `1` |

Chartres-inspired proportion system:

- use a `1 : 2 : 3 : 5` anchor ratio for the calm center, symbolic middle rings, and complex outer ring,
- insert the zodiac divider between the life wheel and Solomonic sectors as a structural ring,
- use a `96px` base step on a `480px` outer radius.

Radius plan:

| Boundary | Radius | Notes |
| --- | --- | --- |
| center radius | `96` | calm guidance core |
| canonical outer radius | `192` | `2x` anchor |
| life outer radius | `288` | `3x` anchor |
| zodiac outer radius | `360` | structural divider ring |
| solomonic outer radius | `480` | `5x` anchor |

Equivalent ring spans:

| Ring | Inner Radius | Outer Radius |
| --- | --- | --- |
| center | `0` | `96` |
| canonical | `96` | `192` |
| life | `192` | `288` |
| zodiac | `288` | `360` |
| Solomonic | `360` | `480` |

Layered layout:

```text
              OUTER RING
     Solomonic Clock / 72 sectors / cosmic time

          SECOND RING
        Zodiac / sign boundaries

             THIRD RING
      Life Domains / Virtue Wheel / balance

             FOURTH RING
 Canonical Hour / daily phase / virtue emphasis

                CENTER
       Scripture + guidance + counsel
```

Responsibility by ring:

- outer ring: planetary day, zodiac sector, spirit, pentacle, and other cosmic-time signals.
- second ring: zodiac signs and 30-degree boundaries so the sector grid stays visually legible.
- third ring: seven life domains, domain score, imbalance, and dominant virtue anchor.
- fourth ring: canonical hour, daily phase, focus, and current virtue emphasis.
- center: calm readable guidance surface for scripture, counsel, and action language.

Segment math:

- outer ring: `360 / 72 = 5` degrees per sector.
- zodiac ring: `360 / 12 = 30` degrees per sign.
- each zodiac sign contains `30 / 5 = 6` Solomonic sectors.
- life ring: `360 / 7 ~= 51.43` degrees per segment.
- canonical ring: `360 / 8 = 45` degrees per segment.

Outer-ring generation pattern:

```javascript
for (let i = 0; i < 72; i++) {
  const startAngle = i * 5;
  const endAngle = startAngle + 5;
}
```

Zodiac grouping logic:

```javascript
const sectorAngle = 360 / 72;
const zodiacAngle = 360 / 12;

const sectorToZodiac = sectorIndex => Math.floor(sectorIndex / 6);
```

Example mapping:

- sectors `0-5`: Aries
- sectors `6-11`: Taurus
- sectors `12-17`: Gemini

Example interpretation:

- Gemini begins at `60` degrees,
- sector `12` covers `60-65`,
- sector `13` covers `65-70`,
- a label such as `Gemini 5-10` corresponds to sector `13`.

Major-boundary alignment:

- fix the primary reference at zodiac longitude `0deg = Aries`, `90deg = Cancer`, `180deg = Libra`, `270deg = Capricorn`.
- keep that canonical angular grid for every ring even if the rendered SVG applies a single display rotation so Aries sits at the top.
- stagger non-zodiac rings slightly so heavy spokes do not stack awkwardly while still deriving from the same normalized angle.

Suggested ring rotations:

- zodiac ring: `0deg`
- life ring: `~25deg`
- canonical ring: anchored to explicit 45-degree phases rather than a free offset.

Unified angular grid:

```text
Providence Map
      ->
Solomonic sectors (5deg)
      ->
zodiac ring (30deg)
      ->
life domains (~51.43deg)
      ->
canonical hours (45deg)
      ->
virtue compass (90deg)
      ->
center guidance
```

Shared-axis rule:

- every layer derives from the same normalized angle,
- one cursor-angle calculation should be able to resolve sector, zodiac sign, life domain, and canonical hour,
- the entire instrument should use one reference helper rather than layer-specific angle systems.

Suggested helper:

```javascript
function normalizeAngle(angle) {
  return (angle + 360) % 360;
}
```

Canonical hour anchors:

| Hour | Angle |
| --- | --- |
| `Lauds` | `0deg` |
| `Prime` | `45deg` |
| `Terce` | `90deg` |
| `Sext` | `135deg` |
| `None` | `180deg` |
| `Vespers` | `225deg` |
| `Compline` | `270deg` |
| `Matins` | `315deg` |

This keeps the day-phase ring legible while preserving the same angular system as the zodiac and sector layers.

Stroke hierarchy:

- sector boundaries: thin,
- zodiac boundaries: medium,
- life-domain and canonical spokes: thick.

Suggested ring datasets:

```javascript
const lifeDomains = [
  { name: "Mind", score: 68 },
  { name: "Body", score: 52 },
  { name: "Relationships", score: 41 },
  { name: "Stewardship", score: 63 },
  { name: "Vocation", score: 72 },
  { name: "Household", score: 55 },
  { name: "Contemplation", score: 30 }
];

const canonicalHours = [
  { hour: "Matins", focus: "contemplation" },
  { hour: "Lauds", focus: "gratitude" },
  { hour: "Prime", focus: "preparation" },
  { hour: "Terce", focus: "work" },
  { hour: "Sext", focus: "humility" },
  { hour: "None", focus: "perseverance" },
  { hour: "Vespers", focus: "gratitude" },
  { hour: "Compline", focus: "reflection" }
];
```

This yields the intended philosophical order:

```text
cosmos -> zodiac -> spirit sector -> life -> daily phase -> guidance
```

Interaction model:

- hover outer ring to reveal spirit, sector, or pentacle context.
- hover zodiac ring to reveal sign, degree span, and grouped sector count.
- hover life ring to reveal domain score, imbalance, and virtue mapping.
- hover inner ring to reveal canonical hour meaning and current discipline.
- click any layer to expand the detailed side panel or daily profile view.

Hover hierarchy:

| Ring | Hover Output |
| --- | --- |
| clock | spirit info, zodiac range, virtue warning |
| zodiac | sign name, 30-degree span, sector grouping |
| life wheel | domain score, imbalance, suggested virtue |
| canonical ring | current focus, virtue, phase meaning |
| center | expand reading or daily profile |

Suggested visual hierarchy:

- outer ring: thin sector segments.
- zodiac ring: slightly heavier boundaries at each 30-degree sign division.
- life ring: larger segments, virtue-coded highlights.
- canonical ring: softer glow and slower motion than the clock itself.
- center: stable parchment-style panel with scripture and short counsel.

Suggested symbolic palette:

| Layer | Color Direction |
| --- | --- |
| cosmic ring | deep blue / indigo |
| zodiac ring | desaturated blue-gold divider |
| virtue ring | gold |
| daily phase ring | crimson |
| center panel | parchment / warm neutral |

Score coloring for the life ring:

- score `< 40`: red
- score `40-70`: gold
- score `> 70`: green

Responsive behavior:

- desktop: render the full rose-window composition.
- mobile: prioritize center guidance, then allow tap-to-rotate or expand each ring.

Motion rules:

- clock ring: one full revolution per day.
- zodiac ring: static boundary layer.
- canonical ring: snap or step every three hours.
- life ring: static; update only when user state changes.
- active sector and center seal should use restrained cathedral-glass glow rather than bright neon emphasis.

Lighting treatment:

```css
filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.4));
```

Primary glow targets:

- active Solomonic sector,
- center seal / guidance core.

Implementation suggestion:

```text
svg
 |- solomonic_sector_ring
 |- zodiac_ring
 |- life_domain_ring
 |- canonical_hour_ring
 |- center_guidance
```

Each ring should read from a dedicated dataset so the visualization stays modular:

- `clock_context`
- `zodiac_state`
- `life_domain_state`
- `canonical_hour_state`
- `guidance_state`

Recommended render order:

1. `solomonic-sector-ring`
2. `zodiac-ring`
3. `life-ring`
4. `hour-ring`
5. `center-panel`
6. labels

Equivalent render pipeline:

1. `drawSolomonicRing()`
2. `drawZodiacRing()`
3. `drawLifeRing()`
4. `drawCanonicalRing()`
5. `drawCenterPanel()`

Performance strategy:

- do not redraw the entire SVG for routine state changes,
- precompute `sectorToZodiac` so grouping logic is not recalculated during animation,
- update only the active sector, active hour, zodiac highlight, and life-domain score arcs,
- keep ring geometry stable and animate with class/state changes rather than path regeneration.

## Guidance Compass

The center of the clock should become an interactive guidance compass rather than a static seal only. This turns the core of the rose window into a navigation control that asks what kind of counsel the user wants right now.

Important distinction:

- Guidance Compass = user intent control (`Reflect`, `Learn`, `Act`, `Restore`),
- Virtue Compass = system-direction indicator (`Prudence`, `Love`, `Temperance`, `Fortitude`).

These should coexist in the center rather than compete. The Guidance Compass answers what kind of counsel the user wants, while the Virtue Compass shows where the system believes the user should move.

### Center Seal as Control Surface

The seal itself should become the primary interaction surface for the Life OS. Instead of treating the center as a static emblem with supporting side panels, treat it as the main mode selector for the whole instrument.

Top-level seal modes:

- `Guidance`
- `Practice`
- `Reflection`
- `Timeline`
- `Forecast`
- `Mentor`

Suggested wedge layout:

```text
       Guidance
   Practice    Mentor

 Reflection    Forecast
       Timeline
```

This creates a simple control rule:

- the center seal changes the mode,
- the rings become the readout,
- the right-hand panels become secondary detail instead of the main interaction model.

Mode behavior:

| Mode | Primary Result |
| --- | --- |
| `Guidance` | virtue, scripture, mentor reflection, current counsel |
| `Practice` | today's practice, domain focus, suggested action |
| `Reflection` | journaling prompts and closeout capture |
| `Timeline` | Providence Timeline / Providence Map emphasis |
| `Forecast` | upcoming virtue phases and highlighted future sectors |
| `Mentor` | mentor selector and voice switching |

Design rule:

- `Guidance` mode contains the Guidance Compass and Virtue Compass overlays,
- the other seal modes repurpose the same center geometry rather than opening separate full-screen subsystems,
- the center should always remain the control point while the rings remain the readout.

Suggested UI state:

```json
{
  "mode": "guidance",
  "mentor": "Solomon",
  "virtue": "Temperance",
  "domain": "Relationships"
}
```

Interaction model:

- click a wedge to switch mode,
- hover a wedge to preview mode,
- allow drag-rotation only later if it improves usability rather than complicating the center.

Rendering rule:

```text
mode
  ->
clock highlights
  ->
guidance block
  ->
life wheel emphasis
```

Visual treatment:

- active wedge glows softly,
- inactive wedges remain visible but subdued,
- the center should feel like an instrument dial rather than a button cluster.

Conceptual flow:

```text
user intention
  ->
virtue engine
  ->
guidance
  ->
scripture
  ->
practice
```

Center layout:

```text
        Reflect

 Act      ●      Learn

        Restore
```

Direction meanings:

| Direction | Focus | Engine Output |
| --- | --- | --- |
| `Reflect` | self-examination | reflection questions, journal prompt, scripture |
| `Learn` | study and understanding | wisdom text, proverb, teaching |
| `Act` | practical task and virtue practice | domain training, concrete step |
| `Restore` | repair, healing, rebalancing | weak domain, restorative practice |

Suggested controller model:

```json
{
  "Reflect": { "engine": "reflection_engine" },
  "Learn": { "engine": "wisdom_engine" },
  "Act": { "engine": "training_engine" },
  "Restore": { "engine": "balance_engine" }
}
```

Example interaction:

```text
Planet: Mars
Sector: Leraje
Hour: Sext
Weak Domain: Relationships

User selection: Act

Result:
Virtue: Temperance
Practice: Respond calmly in conflict.
```

SVG layer:

```text
svg
 |- solomonic_sector_ring
 |- zodiac_ring
 |- life_domain_ring
 |- canonical_hour_ring
 |- center_guidance
 |- virtue_compass
 |- guidance_compass
```

Suggested handlers:

```javascript
compassNorth.onclick = reflect;
compassEast.onclick = learn;
compassSouth.onclick = act;
compassWest.onclick = restore;
```

Visual direction:

- keep directional markers gold and restrained,
- use faint radial lines rather than heavy UI chrome,
- use a soft hover glow so the compass feels alive without becoming game-like.

Example interaction treatment:

```css
.compass-direction:hover {
  filter: drop-shadow(0 0 8px gold);
}
```

Design consequence:

- the center is no longer only symbolic,
- the user can query the system by intention,
- the clock starts to behave like a navigation instrument rather than a passive dashboard.
- the seal becomes the primary UI controller while panels become supporting detail.

## Virtue Compass

The Virtue Compass is the directional summary layer for the Life OS. It translates the current resolved virtue into a simple orientation so users can see immediately what kind of movement is being asked of them.

Purpose:

- turn virtue resolution into directional guidance,
- make the center of the clock feel like an instrument,
- summarize the clock, Life Wheel, and virtue engine in one visual cue.

Compass model:

| Direction | Virtue Movement |
| --- | --- |
| `North` | wisdom / prudence |
| `East` | love / charity |
| `South` | discipline / temperance |
| `West` | courage / fortitude |

Inner modifiers:

| Modifier | Meaning |
| --- | --- |
| `Faith` | spiritual orientation |
| `Hope` | perseverance through time |
| `Justice` | fairness in decisions |

Geometric alignment:

- align the Virtue Compass to the same shared angular grid as the zodiac ring,
- treat `Prudence`, `Love`, `Temperance`, and `Fortitude` as the four cardinal display directions,
- keep those directions anchored to the zodiac cardinal points through the same global reference and display rotation used by the rest of the wheel.

Suggested center overlay:

```text
            N
         Prudence

W Fortitude     Love E

       Temperance
            S
```

Example runtime summary:

```text
Planet: Mars
Sector: Leraje
Weak Domain: Relationships
Virtue: Temperance

Direction: South
```

This should produce:

- south direction glow,
- highlighted `Relationships` Life Wheel segment,
- updated center guidance block.

Suggested data model:

```json
{
  "compass": {
    "North": "Prudence",
    "East": "Love",
    "South": "Temperance",
    "West": "Fortitude"
  }
}
```

Reference mapping:

```javascript
function virtueDirection(virtue) {
  const map = {
    Prudence: "North",
    Love: "East",
    Temperance: "South",
    Fortitude: "West"
  };

  return map[virtue];
}
```

Interaction model:

- hover direction -> reveal virtue meaning and primary practice,
- click direction -> show scripture, mentor reflection, and suggested practices,
- animate the needle or highlight slowly so the compass feels alive but restrained.

Example display:

```text
Virtue Direction
South - Temperance

Practice
Respond calmly in moments of tension.

Scripture
Proverbs 15:1
```

Visual direction:

- thin gold directional lines,
- faint circular grid behind the center,
- subtle active-direction glow,
- slow needle animation with soft easing,
- keep the effect instrument-like rather than ornamental.

Design consequence:

- the center tells the user both what they asked for and where the system is pointing them,
- the clock gains a directional metaphor users understand instantly,
- the UI reads more like navigation and less like explanation.

## Radial-First Refinement Plan

The current interface already has strong clock geometry and strong source-linked guidance, but its meaning is split across a left-hand circle and a right-hand text column. The next refinement should bring the logic back into the radial composition.

Current pattern:

```text
CLOCK | guidance panels | psalm / wisdom | explanation
```

Target pattern:

```text
header
rose-window clock core
center guidance
supporting accordions and detail panels
```

Practical refinements:

1. Keep the Solomonic sectors as the outer ring.
2. Keep the zodiac ring thin so it reads as structure rather than as a competing data layer.
3. Convert the green middle ring into the Life Wheel so the seven domains are visible in the circle itself.
4. Use the inner blue ring explicitly for canonical hours and daily rhythm.
5. Simplify center text to a short, calm hierarchy:
   - day / planet,
   - pentacle,
   - virtue,
   - scripture,
   - one-sentence guidance.
6. Turn the center seal into the primary control surface with six mode wedges: `Guidance`, `Practice`, `Reflection`, `Timeline`, `Forecast`, and `Mentor`.
7. Keep the four-way Guidance Compass inside `Guidance` mode so the center can still switch between `Reflect`, `Learn`, `Act`, and `Restore` without leaving the radial UI.
8. Layer a Virtue Compass over or within the center so the active direction (`North/East/South/West`) summarizes the resolved virtue at a glance.
9. Move most `Why this was selected` reasoning into hover or tap tooltips rather than showing all of it by default.
10. Collapse the right-hand column into accordion sections such as:
   - `Today's Guidance`
   - `Weekly Arc`
   - `Scripture`
   - `Wisdom`
   - `Explanation`
9. Keep only `Today's Guidance` open by default.
10. Strengthen active-sector emphasis with a subtle gold glow so the clock feels alive without becoming noisy.

Design consequence:

- the clock holds the meaning,
- the side panel becomes supporting depth,
- users can understand `cosmic time -> human life -> daily rhythm -> guidance` without reading a large explanatory column.

Current build assessment:

- strengths: clock geometry, palette, scripture integration, and signal density are already strong.
- weaknesses: explanation text is too exposed, life architecture is not yet visible in the radial composition, and canonical hours are not yet explicit.

These are refinement problems, not foundational redesign problems.

Possible wheel layout:

```text
      Mind
   /        \
Body        Relationships
   \        /
Stewardship  Vocation
   /        \
Household  Contemplation
```

Virtue-centered layout:

```text
                Mind
                 |
       Body --- Logos --- Relationships
                 |
Stewardship -- Vocation -- Household
                 |
            Contemplation
```

Current phase block:

```text
CURRENT PHASE
Mars - Sext
Focus: Humility and reflection
Virtue: Temperance
```

Active sector block:

```text
ACTIVE SECTOR
Gemini 5-10
Spirit: Leraje
Human Archetype: Conflict energy
Shadow: Anger / arguments
Virtue Training: Restraint
Correction: Speak carefully and avoid escalation
```

Weekly arc expansion:

```text
WEEKLY ARC
Virtue Focus: Fortitude
Domain Focus: Vocation
Training Tasks:
- Finish difficult work
- Address unresolved conflict
- Strengthen boundaries
```

Long-term graph:

- track domain balance over time,
- track virtue balance over time,
- show sector-event history and repeated corrections,
- surface monthly or seasonal formation patterns.

## Daily Opening

The Daily Opening is the morning orientation ritual for the Life OS. It should take about `45-60` seconds and help the user begin the day with awareness of the moment, a virtue focus, and one simple intention.

Concept:

```text
clock state
  ->
virtue engine
  ->
mentor reflection
  ->
user intention
```

Purpose:

- orient the user to the day rather than dropping them into a dashboard,
- make the center seal feel like the start control for a living instrument,
- create the initial seed for the day's timeline entry.

Suggested opening sequence:

1. Reveal the day:
   - fade in the clock,
   - glow the active sector,
   - rotate the virtue needle into place,
   - show the current day, sector, and virtue.
2. Show mentor reflection:
   - short mentor-guided reflection in `2-3` sentences,
   - phrased through the current selected mentor and narrative depth rules.
3. Show scripture anchor:
   - one verse only,
   - this becomes the canonical anchor for the day.
4. Ask for intention:
   - accept suggested virtue,
   - choose another virtue,
   - or skip.
5. Begin the day:
   - confirm the opening state,
   - create or enrich the day's timeline entry,
   - move the UI into normal guidance mode.

Suggested center presentation:

```text
            TODAY

        Tuesday - Mars

        Virtue Focus
        Temperance

       [ Begin the Day ]
```

This keeps the seal as the control point. The user starts from the center and then reads outward through the wheel.

Suggested opening payload:

```json
{
  "date": "2026-03-10",
  "virtueFocus": "Temperance",
  "mentor": "Solomon",
  "intention": "Practice calm speech in conflict"
}
```

Optional sound design:

- soft bell on opening,
- faint chime on scripture reveal.

Keep sound minimal and fully optional.

Design principle:

- the opening should feel intentional, not theatrical,
- the system offers a compass for navigation rather than controlling the user,
- the user still chooses whether to accept the suggested virtue and begin the day.

Paired close:

- a later `Daily Closing` should mirror the opening by recording reflection, closeout, and timeline update.

## Daily Flow

Morning:

- `daily_opening`,
- `clock_phase`
- `domain_focus`
- `guidance_prompt`
- `daily_rule`
- `daily_narrative`
- selected intention / `begin_day` confirmation

Day:

- activity tracking,
- domain updates,
- optional counsel or election timing checks,
- practice completion against the current rule,
- timeline preview and historical lookup when needed

Evening:

- reflection questions,
- journal entry,
- mentor dialogue,
- moral review of notable decisions
- Compline-triggered examination when canonical hour mode is active
- rule closeout and practice-log update,
- timeline entry saved

## Positioning

This should not be framed as generic productivity software.

Positioning:

- productivity apps optimize efficiency,
- Life OS optimizes human flourishing,
- the product goal is formation of the person rather than output maximization.

## Implementation Priority

Phase 1:

- life domains,
- reflection system,
- Solomonic clock integration

Phase 2:

- moral architecture filter,
- AI guidance engine

Phase 3:

- mentor personas,
- narrative life mapping,
- richer formation loops and progress presentation,
- rule-of-life generation,
- wisdom-graph traversal,
- wisdom-index authority resolution,
- Pericope corpus normalization and virtue tagging,
- virtue forecasting,
- narrative guidance generation

Immediate implementation tasks:

1. Create `life_domains.json`.
2. Add Life Wheel UI component below the clock.
3. Build `virtue_wheel_engine`.
4. Build `canonical_hours_engine`.
5. Build `sector_guidance_engine`.
6. Modify scripture selection to include domain and virtue targeting.
7. Add daily reflection storage.
8. Update weekly arc logic to include virtue focus and training tasks.
9. Add a rule-of-life generator with daily and weekly practice output.
10. Create `wisdom_graph.json`.
11. Load the wisdom graph at runtime.
12. Implement neighbor/path queries.
13. Integrate graph traversal with the virtue engine.
14. Generate guidance and rules from graph traversal.
15. Add a daily guidance narrative engine with short/medium/long output modes.
16. Add a Providence Timeline with daily entries, weekly summaries, and trend views.
17. Add a Providence Map with orbit bands, node clustering, and historical detail lookup.
18. Add a mentor registry and selector that load Pericope authors as Life OS voices.
19. Add `wisdom_index.json` with authority tiers, virtue coverage, scripture anchors, and mentor candidates.
20. Resolve mentor selection through the Wisdom Index so Scripture anchors remain primary.
21. Normalize Pericope corpus chunks with virtue, theme, and life-domain metadata.
22. Build a virtue-tagging pipeline for author ingestion.
23. Add a Wisdom Index service endpoint for virtue lookups.
24. Add `POST /lifeos/guidance` as the Life OS guidance contract.
25. Render mentor guidance from structured Pericope profiles rather than chat-only personas.
26. Add a Virtue Forecast Engine for `6h`, `24h`, and `7d` windows.
27. Add a forecast arc or `Upcoming Guidance` view to the radial UI.

## Working Principle

If the system adds game mechanics without wisdom, it collapses into shallow productivity. If it adds wisdom without feedback loops, it becomes abstract and inert. The design target is a synthesis:

- visible progress,
- coherent moral architecture,
- reflective practice,
- mentor dialogue,
- temporal guidance,
- long-term formation.
