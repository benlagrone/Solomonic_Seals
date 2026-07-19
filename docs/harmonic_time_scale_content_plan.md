# Harmonic Time-Scale Content Plan

## Product Thesis

The Solomonic Clock is not a menu of symbolic rings. It is an instrument for locating the present moment inside many simultaneous cycles:

```text
moment
  -> hour
  -> day
  -> week
  -> month
  -> season
  -> year
  -> multi-year passage
  -> decade
  -> lifespan
  -> era
```

Every reading should answer:

> What is this moment inside, what is ripening or returning at each scale, where are the scales in harmony or tension, and what is the right response now?

The clock must therefore remain anchored to `now`. Selecting a ring may deepen the explanation of the active state, but ordinary interaction must not rotate the user into arbitrary titles or substitute a selected symbol for the actual moment. Historical exploration and future planning should be explicit modes with a visible date offset from `now`.

## Governing Principles

1. **The moment is primary.** Every scale contributes to one present-tense reading.
2. **Cycles are nested but not perfectly divisible.** Solar, lunar, biological, liturgical, and cultural cycles drift against one another. Their changing phase relationships are part of the meaning.
3. **Harmony is relationship, not uniformity.** Alignment, counterpoint, tension, rest, reversal, and return are all meaningful states.
4. **Mathematics structures the instrument; it does not manufacture authority.** Use observed astronomical periods, small-number musical ratios, normalized phase, and transparent aggregation. Do not force the golden ratio onto cycles that do not exhibit it.
5. **Traditions remain distinguishable.** Monastic, Solomonic, biblical, alchemical, Pythagorean, Taoist, astronomical, biological, and modern formation content must retain provenance rather than being blended into a false ancient consensus.
6. **The outer scale conditions the inner; the inner scale supplies the next action.** An era should not generate a minute-by-minute instruction directly.
7. **Every reading ends in formation.** The output is attention, virtue, practice, restraint, repair, or rest—not passive symbolism.

## Behavioral Governance Contract

The clock is a governing system only when it helps a person translate meaning into conduct:

```text
notice
  -> discern
  -> choose
  -> act or refrain
  -> examine
  -> remember
  -> form a durable disposition
```

Its authority must be ordered and visible:

```text
truth and observed reality
  -> declared spiritual and moral authority
  -> source-grounded wisdom
  -> the user's commitments and responsibilities
  -> long-range temporal context
  -> present conditions
  -> practical counsel
  -> free and accountable human choice
```

Symbolic correspondence cannot outrank truth, conscience, responsibility, Scripture in the Christian presentation, or relevant professional and communal authority. The system may guide; it must not disguise inference as command.

Every governing output should contain:

1. **Attend:** what deserves notice now.
2. **Interpret:** what the active scales mean and why.
3. **Practice:** one concrete behavior to perform.
4. **Restrain:** one impulse, excess, or avoidance not to follow.
5. **Time:** when to begin, continue, pause, close, or revisit.
6. **Measure:** what observable sign would show that the action was carried well.
7. **Examine:** what to ask after acting.
8. **Carry:** what becomes a repeated rule if the action proves fruitful.

Suggested action contract:

```json
{
  "attend": "",
  "interpretation": "",
  "practice": {
    "action": "",
    "domain": "",
    "beginBy": "",
    "closeBy": "",
    "completionSignal": ""
  },
  "restraint": "",
  "examination": "",
  "carryForwardRule": "",
  "contributingScales": [],
  "sourceRefs": [],
  "confidence": "",
  "userDisposition": "unanswered"
}
```

The user can adopt, adapt, defer, or reject counsel. Those responses are meaningful evidence:

- `adopted` means the user accepts the practice,
- `adapted` records the user's more fitting expression of the principle,
- `deferred` requires a stated boundary or revisit time rather than silent disappearance,
- `rejected` preserves the reason and prevents the same counsel from being repeated as if unheard,
- `completed` records action without assuming inner transformation,
- `examined` records fruit, harm, resistance, surprise, and needed repair.

The clock should govern differently at different scales:

| Scale | Governing form |
| --- | --- |
| moment | attend, speak, pause, begin, or refrain |
| hour | carry one quality through the present interval |
| day | follow an opening, labor, correction, and closeout rule |
| week | sustain one practice and repair one recurring failure |
| month | cultivate, complete, release, and recommit |
| season | accept the kind of work that can ripen now |
| year | order commitments around a governing lesson |
| decade | choose, maintain, or relinquish a chapter of responsibility |
| lifespan | practice fidelity, reconciliation, generativity, and wise return |
| era | distinguish personal anxiety from collective responsibility and service |

Governance safeguards:

- never optimize counsel for engagement, dependence, fear, or compulsive checking,
- never present symbolic timing as guaranteed causation or destiny,
- never use birth data or private history to manipulate compliance,
- do not make medical, legal, financial, or safety-critical decisions without appropriate evidence and professional authority,
- show the active sources, contributing scales, inference boundary, and confidence,
- prefer the smallest faithful action over theatrical or burdensome ritual,
- record consequences so repeated guidance can be corrected by reality,
- allow the user to disable a tradition or delete personal history without losing basic timekeeping.

## Physical Influence And Evidence Ladder

The clock should not treat the heavens as merely decorative symbols. Solar, lunar, terrestrial, and biological cycles include real physical influences. Their governing weight must follow the quality of evidence.

### Tier 1: Directly observed physical state

Examples:

- sunlight and darkness,
- sunrise, sunset, solar altitude, and photoperiod,
- lunar illumination, rise/set, distance, and orbital phase,
- local ocean-tide predictions where geographically relevant,
- Sun-Moon alignment associated with spring and neap tides,
- measured solar flares, coronal mass ejections, solar wind, and geomagnetic indices,
- solstice, equinox, season, weather, and local environmental conditions.

These may directly alter the runtime coordinate and practical context.

### Tier 2: Well-supported biological timing

Examples:

- circadian phase and light entrainment,
- sleep-wake timing,
- chronotype when supplied or responsibly inferred from repeated user records,
- ultradian work/rest or sleep patterns where supported,
- seasonal photoperiod effects.

These may strongly guide sleep protection, light exposure, work timing, rest, and attention, while avoiding diagnosis or treatment claims.

### Tier 3: Plausible, mixed, or person-dependent association

Examples:

- lunar-phase relationships with human sleep,
- temporary individual lunar synchrony,
- correlations between geomagnetic conditions and human physiology or mood that lack sufficient causal support,
- user-observed recurring patterns with limited samples.

These should appear as hypotheses to observe:

```text
Some evidence or your history suggests a possible relationship.
Do not assume it. Observe and record whether it recurs.
```

They must not generate strong commands or universal claims.

### Tier 4: Historical symbolic correspondence

Examples:

- planetary virtues and metals,
- zodiacal character,
- pentacle purposes,
- alchemical and grimoire timing,
- later spirit-sector attributions.

These can guide reflection and supply a traditional interpretive vocabulary, but the UI must label them as traditional or symbolic rather than measured physical causation.

### Tier 5: Generated or personal meaning

Examples:

- a proposed Tiger-Virgo resonance,
- an AI-generated life-chapter theme,
- a narrative connection among current scales,
- a pattern the user recognizes in lived history.

These remain editable interpretations. Repeated observed fruit may increase personal relevance, but cannot convert a symbolic claim into universal physical fact.

### Evidence-weighted governance

The resolver should preserve evidence class:

```json
{
  "signal": "morning-light-window",
  "evidenceTier": 2,
  "measurement": {},
  "interpretation": "",
  "allowedGovernance": ["attend", "practice", "time"],
  "prohibitedClaims": ["guaranteed outcome", "medical treatment"]
}
```

Recommended weighting:

- direct environmental and biological timing can set strong practical boundaries,
- mixed evidence can invite observation and journaling,
- historical symbolism can frame virtue and reflection,
- generated meaning can propose a question,
- no amount of symbolic alignment overrides measured conditions or demonstrated consequences.

This distinction should also exist within “solar influence”:

- daily sunlight and the light-dark cycle have direct biological relevance,
- seasonal photoperiod has ecological and biological relevance,
- solar storms have established space-weather and infrastructure effects,
- claims that geomagnetic storms directly determine an individual's mood or conduct require separate evidence and should not inherit the certainty of infrastructure effects.

### Heliobiology observation track

Solar activity reaches Earth through different phenomena and delays. The clock must not reduce them to one “solar activity” number:

| Signal | Meaning |
| --- | --- |
| sunspot number / solar-cycle phase | long-range activity context |
| flare class and X-ray flux | electromagnetic event reaching Earth at light speed |
| solar energetic particle flux | radiation exposure concern primarily for space and high-altitude/polar aviation |
| coronal mass ejection forecast | plasma and magnetic structure that may arrive hours or days later |
| solar-wind speed and interplanetary magnetic field | near-Earth driving conditions |
| Kp / Ap | global geomagnetic disturbance |
| Dst | ring-current and storm intensity |
| local magnetometer | geographically specific magnetic variation |

The product may present official operational conditions immediately. Human-effect interpretation should use a separate research contract:

```json
{
  "spaceWeatherEvent": {},
  "observationWindows": {
    "before": "",
    "during": "",
    "after": ""
  },
  "consentedUserSignals": {
    "sleep": null,
    "restingHeartRate": null,
    "heartRateVariability": null,
    "selfReportedEnergy": null,
    "selfReportedMood": null
  },
  "confounders": {
    "localWeather": null,
    "illness": null,
    "travel": null,
    "sleepOpportunity": null,
    "dayOfWeek": null
  },
  "sampleCount": 0,
  "personalAssociation": "insufficient-data"
}
```

Rules:

- do not infer personal sensitivity from a single storm or memorable experience,
- compare quiet and disturbed periods over enough observations,
- test lag windows rather than assuming the flare time is the biological exposure time,
- control obvious confounders where possible,
- do not expose raw medical or wearable data without explicit consent,
- do not issue a diagnosis, cardiovascular warning, or treatment recommendation from a correlation,
- allow a result of `no-personal-association`,
- label population-level observational findings separately from an individual's own repeated pattern.

This track can make the clock a transparent personal chronobiology instrument while contributing no claim stronger than its data.

## The Moment Vector

The runtime should resolve one immutable snapshot for the selected instant:

```json
{
  "asOf": "2026-07-19T14:32:00-05:00",
  "timezone": "America/Chicago",
  "location": {},
  "scales": {},
  "resonances": [],
  "tensions": [],
  "dominantTheme": {},
  "counterTheme": {},
  "presentCounsel": {},
  "provenance": []
}
```

Each scale returns the same semantic shape:

```json
{
  "scale": "week",
  "cycleId": "week:2026-W29",
  "position": 0.79,
  "phase": "completion",
  "beginsAt": "",
  "endsAt": "",
  "observedSignals": [],
  "evidenceProfile": {},
  "inheritedThemes": [],
  "virtues": [],
  "shadows": [],
  "questions": [],
  "practices": [],
  "sourceRefs": [],
  "confidence": "source-grounded"
}
```

`position` is normalized to `0..1`. It permits common radial geometry without pretending that unlike cycles have equal duration.

## Birth Imprint And Present Resonance

The clock needs two distinct coordinates:

```text
BirthVector  = the cyclic state at the person's entrance into life
MomentVector = the cyclic state now

personal reading = relationship(BirthVector, MomentVector, lived history)
```

The `BirthVector` is a stable reference, not a fixed destiny or a substitute for the user's actual history. It may contain multiple tradition-specific calculations:

```json
{
  "asOf": "",
  "timezone": "",
  "location": {},
  "western": {
    "solarSign": "",
    "fullChartStatus": "not-calculated"
  },
  "chinese": {
    "yearAnimal": "",
    "yearElement": "",
    "yearPolarity": "",
    "fourPillarsStatus": "not-calculated"
  },
  "provenance": []
}
```

The simple labels and the complete systems must not be confused:

- a Western Sun sign is one solar-season coordinate; a full natal chart also requires accurate birth date, time, place, and an explicit astrological tradition,
- a Chinese year animal is one twelve-year coordinate; a fuller Four Pillars reading uses year, month, day, and hour stem-branch pairs,
- Chinese year boundaries must be calculated from the chosen calendar tradition rather than assumed to begin on January 1,
- the two systems should be interpreted in parallel and then compared through the clock's shared virtue, shadow, life-domain, and phase vocabulary.

Example:

```text
Chinese birth-year layer: Tiger
  -> traditional field: strength, courage, majesty, vitality

Western solar-season layer: Virgo
  -> traditional field: mutable earth, Mercurial discernment,
     practical analysis, refinement, and service

possible resonance:
  courageous improvement
  decisive service
  protection expressed through skilled attention

possible counterpoint:
  force versus precision
  immediate action versus extended analysis
  independence versus duty

formation question:
  What deserves decisive improvement now, and what standard of
  perfection would prevent the needed action?
```

This example is a symbolic hypothesis, not a personality verdict. The clock should test it against lived history: whether the user recognizes the pattern, where it has matured into virtue, and where it has become distortion.

Present-time interpretation then asks:

1. Which current scales repeat a birth theme?
2. Which current scale supplies a stabilizing counter-theme?
3. Is the pattern appearing in mind, body, work, relationships, stewardship, vocation, household, or contemplation?
4. What has the user's recorded history shown when this combination recurs?
5. What small action would express the mature form of the pattern now?

Birth information is sensitive personal data. It must be private by default, collected only with clear purpose, editable by the user, and removable without damaging ordinary clock use.

## Signed-In Personal Time Profile

A signed-in user may create an optional private profile that connects birth coordinates, current environmental coordinates, and consented longitudinal observations.

These are separate inputs:

```text
birth date + birth-time precision + birth location
  -> BirthVector

current location + timezone
  -> current solar, lunar, seasonal, tidal, and geomagnetic context

sleep + HR/HRV + reflections + actions over time
  -> observed personal response
```

Birth data alone does not prove how the Sun, Moon, geomagnetic activity, or symbolic systems affect a person. It establishes a reference coordinate. Repeated personal observations supply the evidence for an individual relationship.

### Setup flow

1. Explain what will be calculated and how the data will be used.
2. Ask for birth date.
3. Ask for birth time with an explicit precision:
   - exact,
   - approximate,
   - unknown.
4. Ask for birth city/region and country, not a street address.
5. Resolve and show the historical timezone and daylight-saving offset for confirmation.
6. Keep current location separate:
   - manually selected default city,
   - one-time browser location,
   - no background tracking by default.
7. Let the user enable traditions independently:
   - Western solar sign only,
   - fuller Western natal calculation,
   - Chinese year animal only,
   - Chinese element and polarity,
   - Four Pillars,
   - other future traditions.
8. Preview the derived `BirthVector`, precision limits, and provenance before saving.
9. Ask separately whether the user wants personal observation comparison for sleep, HR/HRV, energy, mood, reflections, or actions.

Unknown birth time must not block basic use. It should disable or qualify only calculations that actually depend on time.

### Account record

Suggested profile:

```json
{
  "schemaVersion": "1",
  "birth": {
    "date": "",
    "time": "",
    "timePrecision": "unknown",
    "placeLabel": "",
    "countryCode": "",
    "latitude": null,
    "longitude": null,
    "timezone": "",
    "utcOffsetAtBirth": ""
  },
  "currentContext": {
    "locationMode": "manual",
    "placeLabel": "",
    "latitude": null,
    "longitude": null,
    "timezone": "",
    "updatedAt": ""
  },
  "traditions": {
    "westernSolar": true,
    "westernNatal": false,
    "chineseYear": true,
    "chineseFourPillars": false
  },
  "observationConsent": {
    "enabled": false,
    "sleep": false,
    "heartRate": false,
    "heartRateVariability": false,
    "energy": false,
    "mood": false,
    "reflections": false,
    "actions": false
  },
  "derived": {
    "birthVector": {},
    "calculatorVersions": {},
    "calculatedAt": ""
  }
}
```

Store calculator and ephemeris versions so a future correction can be distinguished from a change in user data.

### Service boundary

Use a dedicated account-scoped profile API such as:

```text
GET    /api/profile/time
PUT    /api/profile/time
DELETE /api/profile/time
GET    /api/profile/time/export
POST   /api/profile/time/recalculate
```

Requirements:

- require the same verified account subject used by signed-in history sync,
- do not permit guest client credentials to read or write the persistent profile,
- keep the profile in a separate storage namespace from daily history,
- derive ownership only from the verified bearer subject, never a request-body user ID,
- use `PUT` idempotently and validate all date, precision, coordinate, timezone, and tradition fields,
- deletion removes raw inputs, derived coordinates, and observation linkage,
- account export includes inputs, derived results, provenance, consent state, and calculator versions.

### Privacy boundary

- do not place birth data in identity-provider claims,
- do not send raw birth date, time, coordinates, health observations, or wearable records to Pericope or another model by default,
- when the user explicitly requests personalized counsel, send the minimum derived context needed rather than the raw profile,
- city-level birth coordinates are sufficient for ordinary astrological calculations; never request a hospital or street address,
- current browser geolocation is one-time unless the user deliberately enables another policy,
- location and health-data permissions are separate,
- changing or deleting the profile must not delete unrelated account history,
- deleting account history must not silently retain linked personal observations,
- display when a result depends on exact versus approximate birth time.

### Personalized reading

The primary signed-in reading should separate:

1. **Your birth coordinate:** stable, tradition-specific `BirthVector`.
2. **The present heavens and environment:** current `MomentVector`.
3. **Resonance and counterpoint:** interpretive relationship between the two.
4. **Observed in your history:** repeated personal association, insufficient data, or no detected association.
5. **Governing counsel:** practice and restraint weighted by evidence.

Example:

```text
Birth coordinate
  Tiger year + Virgo Sun

Present coordinate
  Mercury day + elevated geomagnetic activity + waning Moon

Symbolic resonance
  Virgo/Mercury repeats discernment and practical correction.

Physical observation
  Geomagnetic conditions are measured, but your profile has only
  two comparable observations: insufficient personal evidence.

Counsel
  Use the Mercurial interval for one concrete repair.
  Protect normal sleep and record tonight's result without assuming
  that space weather caused any change.
```

## Scale Architecture

### Moment / Minute

**Function:** attention, breath, interruption, decision threshold.

**What it reads:**

- current civil minute and solar context,
- active planetary-hour phase,
- user state when explicitly supplied,
- whether the current action is beginning, sustained, interrupted, or closing.

**Deep-content requirements:**

- short practices for attention, restraint, recollection, and return,
- brief Scripture and wisdom anchors,
- thresholds for pause-before-speech, begin-now, continue, or stop,
- no invented minute-by-minute divination.

**User output:** one sentence and one action that can be performed now.

### Hour / Canonical Phase

**Function:** the character of the present working or prayer interval.

**What it reads:**

- sunrise/sunset planetary hour,
- canonical hour or day phase,
- current hour ruler and its relation to the day ruler,
- active five-degree solar sector where historically and product-appropriately used.

**Deep-content requirements:**

- all day/night planetary-hour combinations,
- canonical-hour theology, psalmody, practice, and historical notes,
- alignment and tension interpretations such as Mars hour within Venus day,
- beginning, midpoint, and ending guidance within the hour.

**User output:** what this interval favors, what may distort it, and how to carry it well.

### Day

**Function:** a complete arc of opening, labor, correction, gratitude, examination, and rest.

**What it reads:**

- weekday and planetary-day ruler,
- solar and lunar conditions,
- liturgical or scriptural observance when enabled,
- the day's sequence of planetary hours,
- the user's adopted intention and closeout.

**Deep-content requirements:**

- seven historically grounded planetary-day profiles,
- morning, midday, evening, and night movements,
- daily virtue, shadow, Psalm/wisdom reading, embodied practice, and examination,
- explainable relationship to the enclosing week, month, season, and year.

**User output:** a daily rule with opening, present action, and evening return.

### Week

**Function:** a seven-part phrase rather than seven isolated days.

**What it reads:**

- progression through the planetary weekdays,
- practices attempted and neglected,
- repeated virtues, tensions, and life-domain signals,
- weekly sabbath/rest relationship.

**Deep-content requirements:**

- weekly archetypes for beginning, development, conflict, repair, culmination, and rest,
- seven-day thematic arcs generated from real daily content,
- weekly review questions and carry-forward rules,
- source-grounded Sabbath and monastic weekly rhythms.

**User output:** what the week is teaching, what remains unresolved, and what should be carried into the next week.

### Month / Lunation

**Function:** growth, culmination, release, and renewal across a lunar and civil month.

**What it reads:**

- actual lunar phase and lunation boundaries,
- civil-month responsibilities,
- four or five weekly arcs,
- accumulating Life Wheel and virtue patterns.

**Deep-content requirements:**

- astronomically accurate lunar-phase descriptions,
- historically differentiated lunar correspondences,
- new, waxing, full, waning, and dark-phase reflection patterns,
- monthly review, release, repair, and recommitment practices.

**User output:** what is emerging, maturing, overfull, declining, or ready to return.

### Season / Quarter

**Function:** a larger mode of life: emergence, expansion, harvest, decline, or stillness.

**What it reads:**

- equinoxes and solstices for the user's hemisphere,
- solar zodiac position,
- climatic season where location data supports it,
- three monthly patterns and current life circumstances.

**Deep-content requirements:**

- astronomical and ecological seasonal content,
- biblical, liturgical, agricultural, alchemical, and Taoist readings kept in parallel,
- hemisphere-aware symbolism,
- practices for sowing, tending, harvesting, relinquishing, and resting.

**User output:** the work of the season and what cannot be hurried.

### Year

**Function:** a complete orbit of formation.

**What it reads:**

- solar return and seasonal sequence,
- twelve monthly/lunation records,
- major commitments, losses, repairs, and transitions,
- annual liturgical, civic, and personal anniversaries.

**Deep-content requirements:**

- annual arc templates that do not reduce the year to twelve generic zodiac labels,
- anniversary and recurrence interpretation,
- annual virtue and life-domain narrative,
- a year-end rule of gratitude, truth, release, and reorientation.

**User output:** the year's governing lesson, unfinished movement, and next faithful direction.

### Multi-Year Passage

**Function:** make development visible between the year and decade scales.

**What it reads:**

- rolling 3-, 5-, and 7-year patterns,
- repeated annual themes,
- durable changes in vocation, household, relationship, body, and contemplation,
- user-declared passages rather than inferred diagnoses.

**Deep-content requirements:**

- historically sourced sabbatical and seven-year patterns where applicable,
- developmental content framed as questions rather than universal deterministic stages,
- distinction between cyclical recurrence and one-time life events.

**User output:** what is being formed slowly and what pattern now has enough history to be named.

### Decade

**Function:** a chapter of responsibility, identity, and accumulated consequence.

**What it reads:**

- ten annual narratives,
- commitments initiated, sustained, completed, or abandoned,
- changes in the user's roles and communities,
- social and historical conditions surrounding the decade.

**Deep-content requirements:**

- decade review and chapter-transition practices,
- vocation, stewardship, relationship, embodiment, and wisdom questions,
- no rigid claims that a numerical age determines a person's spiritual condition.

**User output:** the shape of the chapter, its cost and fruit, and the work of transition.

### Lifespan

**Function:** the whole personal arc of receiving, becoming, giving, relinquishing, and returning.

**What it reads:**

- user-entered life eras and milestones,
- long-term virtue and domain history,
- relationships, works, inheritances, losses, and promises,
- current age without deterministic age prophecy.

**Deep-content requirements:**

- multiple developmental traditions presented as lenses,
- vocation, generativity, mortality, legacy, reconciliation, and wisdom,
- private-by-default life narrative and explicit user correction.

**User output:** where the present moment stands within the whole life and what deserves fidelity now.

### Era / Historical Age

**Function:** locate one life within communal, civilizational, ecological, and religious history.

**What it reads:**

- dated public history from curated sources,
- generational and institutional context,
- technological, political, ecological, and cultural change,
- the user's actual communities and location where supplied.

**Deep-content requirements:**

- sourced historical timelines and competing interpretations,
- distinction between documented history and esoteric age systems,
- content on responsibility, inheritance, institutional memory, and service.

**User output:** what belongs to the age rather than merely to the individual, and what responsibility this moment places on the user.

## Harmonic Mathematics

### Phase, not forced equivalence

Every cyclic scale exposes:

- `period`,
- `position`,
- `phase`,
- `amplitude` or strength where measurable,
- `confidence`,
- `source`.

The same angle can visualize normalized phase, but shared angle does not imply shared cause.

### Musical proportion

Use musical ratios as interaction and interpretation models:

- `2:1` octave: the same theme returning at a larger scale,
- `3:2` fifth: mutually reinforcing but non-identical themes,
- `4:3` fourth: stabilizing counter-theme,
- `1:1` unison: direct alignment,
- suspension/dissonance: a tension requiring resolution rather than a negative score.

Applications:

- relate a day theme to its weekly or seasonal recurrence,
- rank resonances when independently derived scales converge on the same virtue or domain,
- structure visual spacing, motion cadence, and audio sonification,
- describe return and modulation without claiming physical planetary music.

### Golden ratio and Fibonacci

Use φ and Fibonacci selectively for:

- visual proportion and information hierarchy,
- progressive disclosure,
- reflection cadence experiments,
- sampling windows such as recent versus long-term history,
- non-percentage formation language already used by the journey tracks.

Do not use φ to fabricate minute, month, season, or life-stage boundaries.

### Harmony resolution

The engine should resolve:

```text
independent scale readings
  -> shared virtue and life-domain vocabulary
  -> resonance detection
  -> tension/counterpoint detection
  -> outer-scale context
  -> inner-scale action
  -> one present counsel
```

Example:

```text
hour: Mars / decisive action
day: Venus / reconciliation
week: repeated conflict repair
season: harvest / consequences becoming visible
year: stewardship

present counsel:
Address the conflict now, but seek repair rather than victory.
Name the concrete cost and make one just settlement before the hour closes.
```

No scale wins merely because it is larger. Larger scales constrain interpretation; smaller scales determine executable action.

## Tradition Content Lenses

Traditions contribute distinct commentary to the same temporal coordinate.

### Biblical and monastic

- canonical hours,
- Sabbath and feast rhythms,
- Scripture readings,
- virtue, examination, repentance, gratitude, and rule of life.

### Solomonic and grimoire

- planetary days and hours,
- pentacles and their actual source claims,
- ritual timing,
- spirit catalogues and historically later attributions,
- explicit provenance and ethical reinterpretation.

### Alchemical

- planetary metals,
- operation and transformation language,
- separation, purification, conjunction, maturation, and completion,
- historical material practice distinguished from modern inner-alchemy metaphor.

### Pythagorean and musical

- number, interval, proportion, harmony, consonance, and tension,
- octave-like recurrence across scales,
- no unsupported claim that all cycles follow one hidden numeric sequence.

### Taoist

- return and reversal,
- emptiness and usefulness,
- non-forcing and right timing,
- yielding, balance, simplicity, and the small participating in the great,
- passages selected by theme and source, not mechanically assigned to dates.

The *Dao De Jing* should function as a wisdom commentary on change and return, not be absorbed into a Solomonic genealogy or presented as teaching the same cosmology.

### Astronomical, ecological, and biological

- observed sunrise, sunset, lunar phase, solstice, equinox, and solar year,
- hemisphere and location,
- circadian, ultradian, and longer biological rhythms only where evidence supports the claim,
- no use of scientifically invalid generic “biorhythm” prediction.

### Personal formation

- actual practices, reflections, milestones, promises, and relationships,
- optional `BirthVector` comparison across clearly separated Western, Chinese, and other user-enabled traditions,
- user-authored meaning,
- transparent distinction between observed history and generated interpretation.

## Deep-Content Record

Every reusable content unit should be stored as a source-bearing record:

```json
{
  "id": "canonical_hour:compline:examination",
  "scale": ["hour", "day"],
  "phase": ["closing", "return"],
  "tradition": "monastic",
  "kind": "practice",
  "title": "Examination before rest",
  "claim": "",
  "interpretation": "",
  "virtues": ["truth", "humility", "hope"],
  "shadows": ["denial", "scrupulosity"],
  "lifeDomains": ["contemplation", "relationships"],
  "questions": [],
  "actions": [],
  "sourceRefs": [],
  "provenanceStatus": "primary-source-verified",
  "editorialStatus": "reviewed"
}
```

Required status distinctions:

- `primary-source-verified`,
- `scholarly-secondary`,
- `traditional-later-attribution`,
- `modern-interpretation`,
- `personalized-inference`.

## Content Production Matrix

Content is complete only when each scale has coverage for:

| Content family | Required output |
| --- | --- |
| Temporal meaning | beginning, rising, culmination, decline, ending, return |
| Virtue | invitation, mature expression, excess, deficiency |
| Shadow | distortion, avoidance, false harmony |
| Question | observation, discernment, examination |
| Practice | immediate, interval, daily, review |
| Scripture/wisdom | excerpt pointer, context, interpretation boundary |
| Historical meaning | source claim and period |
| Cross-scale relation | resonance and tension rules |
| Life domain | concrete place where the theme lands |
| Provenance | source, tradition, confidence, editorial status |
| Evidence | physical, biological, mixed, symbolic, or generated |

Initial editorial packets:

1. `8` canonical-hour packets.
2. `7` planetary-day packets.
3. `49` day-ruler/hour-ruler relationship packets.
4. Planetary-hour phase variants: opening, midpoint, closing.
5. `7` weekly-position packets plus weekly opening and review.
6. `5` lunar-phase packets.
7. `4` astronomical-season packets per hemisphere, with transitional gates.
8. `12` solar-month/sign packets treated as seasonal context.
9. Annual opening, quarter, anniversary, harvest, and closeout packets.
10. Multi-year, decade, lifespan, and era question/practice libraries.
11. Cross-tradition theme indexes for return, restraint, courage, harmony, stewardship, loss, rest, and renewal.

## Experience Contract

The primary clock surface must show:

1. `Now` as the fixed center.
2. The active state on every enabled temporal scale.
3. One visual indication of strongest resonance.
4. One visible counterpoint or tension when present.
5. One integrated present counsel.
6. The next meaningful boundary and when it occurs.
7. One practice, one restraint, and one later examination tied to observable conduct.

Interaction rules:

- clicking a scale explains its active contribution without changing `asOf`,
- dragging or browsing time enters an explicit `Study`, `History`, or `Forecast` state,
- leaving `now` displays the offset and a persistent `Return to Now`,
- titles never change without the underlying temporal coordinate changing,
- symbolic layers are subordinate to the time-scale reading,
- every generated claim exposes `Why this?` and provenance.

## Delivery Plan

### Stage 0: Correct the foundation

- Reconcile the current 44-pentacle distribution with the selected source tradition.
- Separate source-attested data from modern interpretation.
- Replace the mechanically asserted 72-spirit zodiac mapping with a provenance-aware optional attribution profile.
- Rename or source the current nine-celestial-seal synthesis.

**Exit:** no ring presents a modern synthesis as an ancient source fact.

### Stage 1: Define the scale contract

- Add the shared scale record and `MomentVector` schema.
- Add the optional, private `BirthVector` schema and tradition-specific calculation boundaries.
- Add the signed-in Personal Time Profile API, precision model, consent fields, derived-calculation versions, export, recalculation, and deletion.
- Add evidence tiers and allowed-governance rules for physical, biological, mixed, symbolic, and generated signals.
- Establish authoritative boundaries for solar, lunar, civil, liturgical, personal, and historical cycles.
- Define `now`, timezone, location, hemisphere, and explicit study offsets.

**Exit:** one runtime request returns the active coordinate at every implemented scale.

### Stage 2: Make minute through day deep

- Produce minute/threshold practices.
- Complete canonical-hour content.
- Complete the `7 x 7` day/hour relation matrix with phase variants.
- Integrate the daily opening and closeout into the same moment vector.
- Implement adopt, adapt, defer, reject, complete, and examine states for governing counsel.

**Exit:** every hour of every weekday produces source-bearing present counsel, one concrete practice, one restraint, and one examination rather than a renamed title.

### Stage 3: Build week, month, and season

- Generate weekly phrases from daily movements.
- Add actual lunation and lunar phase.
- Add astronomical and hemisphere-aware seasons.
- Add official solar/geomagnetic measurements and a consented heliobiology observation track with quiet-period comparison and lag analysis.
- Produce weekly and monthly reviews from recorded evidence.

**Exit:** the current moment visibly belongs to a coherent week, lunation, and season.

### Stage 4: Build year and recurrence

- Add annual arc, anniversaries, and seasonal return.
- Detect recurring themes only after sufficient observations.
- Distinguish recurrence, trend, and one-time event.

**Exit:** annual counsel cites the underlying month/week/day evidence.

### Stage 5: Build multi-year, decade, and lifespan

- Add user-authored milestones and chapter boundaries.
- Add rolling multi-year summaries.
- Create decade and lifespan review libraries.
- Require user confirmation before generated narrative becomes remembered life history.

**Exit:** long-range readings remain explainable, editable, private, and non-deterministic.

### Stage 6: Build era context

- Curate public historical timelines.
- Add community, institutional, technological, ecological, and civilizational context.
- Separate documented conditions from interpretive “age” systems.

**Exit:** era readings name sourced collective context and a bounded personal responsibility.

### Stage 7: Harmonic resolver and presentation

- Implement resonance, counterpoint, modulation, and return rules.
- Add musical-ratio-informed visualization and optional sonification.
- Keep the center anchored to `now`.
- Validate that scale selection deepens the current reading rather than replacing it.

**Exit:** the user can understand the moment from minute to era and receive one coherent action without opening a stack of unrelated panels.

## Validation

### Data

- all implemented scales return a boundary, normalized position, phase, and provenance,
- no impossible calendar nesting is assumed,
- lunar and solar boundaries match authoritative astronomical calculations,
- observed solar, lunar, tidal, seasonal, and geomagnetic values retain their source and measurement time,
- a physical effect in one domain cannot be generalized into an unsupported behavioral effect,
- timezone and hemisphere changes produce explainable results,
- source-derived and modern content cannot share the same provenance status.
- birth-year animals, solar signs, and fuller natal systems cannot be silently treated as equivalent-depth calculations.

### Content

- required content-family coverage is measurable per scale,
- quotations retain source and translation,
- cross-tradition parallels are labeled as comparison, not common origin,
- Taoist, monastic, Solomonic, and alchemical content receive tradition-specific review,
- long-range content avoids deterministic age or destiny claims.

### Experience

- ordinary clicks never silently change `asOf`,
- the active state of every visible scale is readable,
- the integrated counsel cites its strongest contributing scales,
- every counsel can be adopted, adapted, deferred, or rejected without obscuring user agency,
- completed actions are examined by observable fruit rather than assumed to have caused transformation,
- tension is represented as counterpoint requiring discernment, not as failure,
- the next boundary is visible,
- `Return to Now` is immediate from all study modes.

## First Publishable Slice

The narrow first release should cover:

- present minute threshold,
- planetary and canonical hour,
- planetary day,
- seven-day phrase,
- current lunation phase,
- astronomical season,
- current solar year position,
- one integrated counsel with resonance, counterpoint, practice, and provenance.

Decade, lifespan, and era should appear as declared future scales until their content and privacy models meet the same standard.
