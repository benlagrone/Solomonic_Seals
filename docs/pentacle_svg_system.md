# Dynamic Pentacle SVG System

Purpose: generate planetary pentacle diagrams as SVG components that integrate with the Solomonic Clock, the Life OS guidance layers, and the rose-window UI without relying only on static image assets.

## Goal

Pentacles should:

- render dynamically from data,
- align visually with the rose-window clock geometry,
- reflect planet, virtue, scripture, and sector state,
- remain modular so new pentacles can be added without custom drawing code for each one.

## Placement in the Stack

The pentacle renderer belongs to the UI layer, but it should read guidance-state output rather than inventing its own logic.

```text
Clock Service
  ->
Virtue Engine
  ->
Guidance Service
  ->
Pentacle Renderer
  ->
SVG Output
```

Example state input:

```json
{
  "planet": "Mars",
  "pentacle": "mars_4",
  "virtue": "Temperance",
  "scripture": "Psalm 110:5"
}
```

## Data Source

Create a dedicated pentacle rendering dataset such as:

- `data/pentacles.json`

Example:

```json
{
  "mars_4": {
    "planet": "Mars",
    "name": "Pentacle of Mars IV",
    "purpose": "Protection from harm",
    "rings": 3,
    "centerShape": "hexagram",
    "scripture": "Psalm 110:5",
    "symbols": ["cross", "hexagram"]
  }
}
```

This data can remain a separate render-oriented file or be merged into the canonical `pentacles` schema under a `render` key.

## Standard SVG Structure

Every pentacle should follow the same layered structure so the renderer stays generic.

```xml
<svg>
  <g id="outerRing"></g>
  <g id="textRing"></g>
  <g id="symbolRing"></g>
  <g id="centerGeometry"></g>
</svg>
```

Base template:

```xml
<svg viewBox="0 0 500 500" class="pentacle">
  <circle cx="250" cy="250" r="220" class="outer-circle"/>
  <circle cx="250" cy="250" r="200" class="text-circle"/>
  <circle cx="250" cy="250" r="160" class="inner-circle"/>
  <g id="center"></g>
</svg>
```

## Planet Styling

Use the same planetary palette as the clock so the pentacle does not feel visually separate.

| Planet | Color |
| --- | --- |
| `Sun` | gold |
| `Moon` | silver |
| `Mars` | crimson |
| `Mercury` | violet |
| `Jupiter` | royal blue |
| `Venus` | emerald |
| `Saturn` | black |

Example:

```css
.pentacle.mars circle {
  stroke: crimson;
}
```

## Procedural Geometry

Center geometry should be generated procedurally from the pentacle record.

Example helper:

```javascript
function drawHexagram(cx, cy, r) {
  const angle = Math.PI / 3;
  const points = [];

  for (let i = 0; i < 6; i += 1) {
    points.push([
      cx + r * Math.cos(i * angle),
      cy + r * Math.sin(i * angle)
    ]);
  }

  return `<polygon points="${points.map((p) => p.join(",")).join(" ")}"/>`;
}
```

Suggested starter shape map:

| Shape | Typical Usage |
| --- | --- |
| `hexagram` | Mars |
| `square` | Jupiter |
| `pentagram` | Venus |
| `cross` | Sun |
| `circle_grid` | Mercury |

## Scripture Ring

Scripture text should render around the middle ring.

Rendering approach:

- split text into characters or short tokens,
- place them on a ring radius,
- rotate each glyph around the center point.

Example:

```javascript
function renderTextArc(text, radius) {
  const chars = text.split("");
  const step = 360 / chars.length;

  return chars.map((char, index) => {
    const angle = index * step;
    return `<text transform="rotate(${angle} 250 250) translate(250 ${250 - radius})">${char}</text>`;
  }).join("");
}
```

## Symbol Ring

Place symbols, sigils, or planetary marks evenly around the inner ring.

Example:

```javascript
function placeSymbols(symbols, radius) {
  const step = 360 / symbols.length;

  return symbols.map((symbol, index) => {
    const angle = index * step;
    return `<text transform="rotate(${angle} 250 250) translate(250 ${250 - radius})">${symbol}</text>`;
  }).join("");
}
```

## Center Core

The center should align with the Guidance Compass and center-seal control surface rather than feeling like a separate illustration.

Suggested center stack:

- outer circle,
- inner geometry,
- virtue glyph or letter,
- optional active glow tied to current mode.

Example:

```xml
<circle cx="250" cy="250" r="60"/>
<polygon points="..."/>
<text x="250" y="250" text-anchor="middle" dominant-baseline="middle">T</text>
```

`T` can represent the currently resolved virtue in compact view.

## UI Placement

The same pentacle renderer should support three display contexts:

1. center overlay of the clock,
2. expanded guidance or study view,
3. mentor reflection mode.

This keeps pentacle imagery consistent across the instrument instead of creating separate hand-built assets for each panel.

## Update Flow

When clock state changes:

```javascript
function updatePentacle(clockState, pentacleData) {
  const pentacle = pentacleData[clockState.pentacle];
  return renderPentacle(pentacle, clockState);
}
```

The renderer should respond to:

- active planet,
- active pentacle,
- current virtue focus,
- scripture anchor,
- current seal mode when relevant.

## Motion

Use restrained motion only.

Examples:

```css
.pentacle circle {
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.4));
}

.pentacle {
  animation: slowSpin 120s linear infinite;
}
```

Only the center or active state should animate noticeably. Avoid turning the pentacle into a decorative spinner.

## Suggested File Layout

```text
/data
  pentacles.json
/src
  pentacleRenderer.js
  geometry.js
/ui
  PentacleComponent.jsx
/styles
  pentacles.css
```

## Service Contract

The renderer should stay thin. It receives resolved state and returns SVG.

Example request shape:

```json
{
  "planet": "Mars",
  "pentacle": "mars_4",
  "virtue": "Temperance",
  "scripture": "Psalm 110:5",
  "mode": "Guidance"
}
```

Example result:

- SVG markup string, or
- component props consumed by a framework renderer.

## Design Alignment

Pentacles should reinforce the same hierarchy already used everywhere else:

```text
cosmos -> clock sectors
virtue -> pentacle center
practice -> guidance text
```

That keeps the renderer symbolically consistent with the rest of the Life OS rather than making pentacles feel like detached illustrations.

## Future Extensions

Possible next steps:

- virtue-driven geometry selection,
- animated sigils,
- mentor quotes around the ring,
- hover-to-reveal hidden symbols,
- seven starter templates, one per planet.
