# Solomonic Clock Runtime Engine

Purpose: define how the clock should compute live cosmic state in real time instead of treating `data/solomonic_clock_full.json` as a precomputed moment-by-moment source.

## Objective

Turn the clock from a symbolic viewer into a real-time time engine.

The runtime engine should compute:

1. `planetaryDay`
2. `planetaryHour`
3. `zodiacDegree`
4. `solomonicSector`

Once those are known, the rest of the system becomes lookup and resolution:

- spirit
- pentacle
- scripture
- guidance
- election windows
- oracle generation
- Pericope counsel context

## Global Angular Reference

Every visual layer should derive from one shared angular model.

Canonical angular grid:

- `0deg = Aries`
- `90deg = Cancer`
- `180deg = Libra`
- `270deg = Capricorn`

Implementation rule:

- keep zodiac longitude as the canonical angle source,
- apply one display rotation to the rendered SVG if Aries should appear at the top,
- derive sector, zodiac, life-domain, canonical-hour, and virtue-compass alignment from that same normalized angle.

Suggested helper:

```javascript
function normalizeAngle(angle) {
  return (angle + 360) % 360;
}
```

This keeps lookup and interaction simple:

```text
cursorAngle
  ->
sector
  ->
zodiac
  ->
domain
  ->
hour
```

## Runtime Pipeline

```text
local time
   |
   v
sunrise / sunset
   |
   v
planetary hour
   |
   v
planetary ruler
   |
   v
solar longitude
   |
   v
zodiac degree
   |
   v
Solomonic sector
   |
   v
guidance lookup
```

## Planetary Day

Planetary days follow the classical weekday mapping:

```javascript
const planetaryDay = {
  Sunday: "Sun",
  Monday: "Moon",
  Tuesday: "Mars",
  Wednesday: "Mercury",
  Thursday: "Jupiter",
  Friday: "Venus",
  Saturday: "Saturn"
};
```

This should be derived from local time, not hardcoded in the UI.

## Sunrise / Sunset

Planetary hours depend on solar intervals rather than civil clock hours.

Suggested implementation:

```javascript
import SunCalc from "suncalc";

const times = SunCalc.getTimes(new Date(), lat, lon);
const sunrise = times.sunrise;
const sunset = times.sunset;
```

Requirements:

- use user or configured latitude / longitude,
- support both daytime and nighttime planetary-hour calculations,
- cache solar times per day rather than recalculating excessively.

## Planetary Hour Calculation

Daytime:

- divide `sunrise -> sunset` into `12` equal planetary hours.

Nighttime:

- divide `sunset -> next sunrise` into `12` equal planetary hours.

Example:

```javascript
const dayLength = sunset - sunrise;
const planetaryHourLength = dayLength / 12;

const currentDayHour = Math.floor((now - sunrise) / planetaryHourLength);
```

Runtime requirements:

- detect whether `now` is in the daytime or nighttime segment,
- compute the correct interval length for the relevant segment,
- expose the hour number, start time, end time, and ruler.

## Planetary Hour Ruler

Planetary hours follow the Chaldean order:

```javascript
const chaldean = [
  "Saturn",
  "Jupiter",
  "Mars",
  "Sun",
  "Venus",
  "Mercury",
  "Moon"
];
```

Method:

1. determine the planetary day ruler,
2. find that ruler in the Chaldean sequence,
3. cycle forward hour by hour.

Example:

- Tuesday -> `Mars`
- Mars is the day ruler
- start the hourly sequence from the `Mars` position in the Chaldean order

The engine should expose both:

- `planetaryDay`
- `planetaryHour`

## Zodiac Longitude

Use real solar longitude rather than a static sign lookup.

Suggested implementation:

```javascript
import { SunPosition } from "astronomy-engine";

const sun = SunPosition(new Date());
const longitude = sun.elon;
```

Requirements:

- normalize longitude to `0-360`,
- compute degree precision enough for 5-degree sector resolution,
- support future use in election timing and orbital animation.

## Zodiac Sign

Once solar longitude is known:

```javascript
const zodiac = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const zodiacIndex = Math.floor(longitude / 30);
const currentZodiac = zodiac[zodiacIndex];
```

The engine should also expose:

- `degreeWithinSign`
- `zodiacRangeLabel`

## Solomonic Sector

Each Solomonic sector spans `5` degrees.

```javascript
const sectorIndex = Math.floor(longitude / 5);
```

Example:

- Gemini starts at `60`
- Gemini `5-10` spans `65-70`
- sector index resolves to the matching five-degree bucket

The runtime engine should then load:

```javascript
const sector = data.sectors[sectorIndex];
```

## Virtue Forecast Engine

Once current longitude and sector are known, the runtime engine can project short-horizon virtue forecasts.

Concept:

```text
current longitude
  ->
future longitude
  ->
future sector
  ->
future virtue
  ->
forecast guidance
```

Simple solar-rate approximation:

- the sun moves about `0.9856deg` per day,
- for short-horizon forecasts this is enough for a first pass,
- if higher fidelity is needed later, compute future solar longitude directly from the astronomy library instead of linear approximation.

Reference helper:

```javascript
function forecastLongitude(currentLongitude, daysAhead) {
  return normalizeAngle(currentLongitude + daysAhead * 0.9856);
}
```

Future sector resolution:

```javascript
function sectorFromLongitude(longitude) {
  return Math.floor(longitude / 5);
}
```

Suggested windows:

- next `6` hours,
- next `24` hours,
- next `7` days.

Example forecast builder:

```javascript
function buildVirtueForecast(forecastTimes, currentLongitude, virtueFromSector) {
  return forecastTimes.map(({ time, daysAhead }) => {
    const futureLongitude = forecastLongitude(currentLongitude, daysAhead);
    const sector = sectorFromLongitude(futureLongitude);
    const virtue = virtueFromSector(sector);

    return { time, futureLongitude, sector, virtue };
  });
}
```

Example output:

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

This allows the instrument to answer:

- what virtue is active now,
- what virtue is likely next,
- what weekly pattern is emerging.

## Runtime State Object

The UI should consume a compact resolved state object:

```json
{
  "time": "2026-03-10T18:11:00-06:00",
  "planetaryDay": "Mars",
  "planetaryHour": "Sun",
  "zodiac": "Gemini",
  "degree": 67,
  "sector": 13,
  "spirit": "Leraje",
  "pentacle": "Mars_5"
}
```

Recommended additions:

- `sunrise`
- `sunset`
- `hourStart`
- `hourEnd`
- `degreeWithinSign`
- `canonicalHour`
- `lifeDomainFocus`
- `normalizedAngle`
- `displayRotation`
- `lifeRingRotation`
- `virtueCompassDirection`
- `virtueForecast`
- `forecastWindow`
- `forecastArc`

## Guidance Resolution

Once runtime state is computed:

```javascript
updateClock(clockState);
updateGuidance(clockState);
```

This keeps the symbolic dataset static and the time engine dynamic.

## Refresh Strategy

The runtime engine does not need per-frame astronomical recalculation.

Recommended refresh cadence:

- recompute state every `60` seconds,
- recompute solar times on date or location change,
- recompute continuously only for visual interpolation if desired.

Example:

```javascript
setInterval(updateClockState, 60000);
```

## Animation Model

The outer ring can visually reflect solar motion:

```text
rotation = solar longitude
```

Suggested behavior:

- sector geometry remains fixed,
- highlight and label state updates from runtime calculations,
- optional slow orbital rotation can visually reflect longitude without reindexing the whole dataset.

## Instrument-Style Motion

Animation should make the clock feel like a living instrument, not a theatrical widget.

Motion layers:

| Ring / Element | Behavior | Tempo |
| --- | --- | --- |
| outer Solomonic ring | tracks solar longitude | `360deg / year` |
| zodiac ring | tracks with outer ring or remains structurally aligned | `360deg / year` |
| canonical hour ring | steps between hour states | about every `3` hours |
| active sector | glow / fade transition | sub-second |
| center seal | subtle pulse | multi-second |

### Solar Rotation

Use solar longitude as the primary rotational value:

```javascript
const rotation = longitude;
solomonicRing.style.transform = `rotate(${rotation}deg)`;
```

This should feel slow and natural, roughly `~1deg` per day.

### Canonical Ring Step

The canonical ring should move in discrete steps rather than drifting.

```javascript
const hourAngle = currentHour * 45;
hourRing.style.transform = `rotate(${hourAngle}deg)`;
```

Suggested easing:

```css
transition: transform 1s ease-in-out;
```

Canonical-hour anchor model:

- `Lauds = 0deg`
- `Prime = 45deg`
- `Terce = 90deg`
- `Sext = 135deg`
- `None = 180deg`
- `Vespers = 225deg`
- `Compline = 270deg`
- `Matins = 315deg`

This keeps the day-phase ring aligned to the same shared angular grid as the zodiac and sector layers.

### Active Sector Glow

The active sector should fade into emphasis rather than switching abruptly.

```css
.active-sector {
  filter: drop-shadow(0 0 10px gold);
  transition: all 0.6s ease;
}
```

### Center Seal Pulse

The center seal can carry a near-imperceptible pulse:

```css
.centerSeal {
  animation: pulse 6s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
```

### Future Life-Wheel Feedback

When the Life Wheel is implemented, domain segments should animate only on state change:

- weaken with a slow fade when a domain score drops,
- brighten gently when a domain recovers,
- avoid constant motion so the wheel still reads as a calm map.

## Grounding Principle

Even when the design language is symbolic, the system remains:

- a calendar,
- a reflection tool,
- a visualization engine.

Animation should reinforce those functions calmly and methodically rather than trying to imply supernatural activity.

## Architectural Separation

Keep a strict split between:

- canonical symbolic dataset,
- runtime engine,
- user-state / Life OS overlays.

In other words:

- `solomonic_clock_full.json` = lookup and symbolic metadata
- runtime engine = current cosmic state computation
- `user_state` = domain scores, reflections, and history

## Implementation Modules

Suggested modules:

- `planetary_day_engine`
- `planetary_hour_engine`
- `solar_event_engine`
- `solar_longitude_engine`
- `sector_resolver`
- `clock_state_builder`

## Dependency Suggestions

Likely libraries:

- `suncalc` for sunrise / sunset
- `astronomy-engine` for solar longitude

These should be wrapped behind internal adapters so the UI does not depend on library-specific APIs directly.

## Validation

Add validation for runtime calculations:

- weekday -> planetary day mapping
- sunrise/sunset ordering
- day/night hour segmentation
- Chaldean hour sequence correctness
- `0-360` longitude normalization
- `0-71` sector resolution
- sector-to-zodiac consistency

## Why This Matters

Without the runtime engine, the clock remains a visually strong symbolic browser. With it, the system becomes a live cosmological instrument:

- local time
- solar rhythm
- planetary day
- planetary hour
- zodiac degree
- Solomonic sector
- guidance

That shift is what makes the clock suitable for dynamic guidance, election windows, Pericope integration, and Life OS behavior.
