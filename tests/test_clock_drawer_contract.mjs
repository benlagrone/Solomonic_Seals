import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");

const html = fs.readFileSync(path.join(repoRoot, "web", "clock_visualizer.html"), "utf8");
const css = fs.readFileSync(path.join(repoRoot, "web", "style.css"), "utf8");
const js = fs.readFileSync(path.join(repoRoot, "web", "clock.js"), "utf8");

function assertIncludes(source, needle, message) {
  assert.ok(source.includes(needle), message || `expected source to include ${needle}`);
}

function extractCssBlock(selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `expected CSS selector ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  assert.ok(open > start && close > open, `expected CSS block for ${selector}`);
  return css.slice(open + 1, close);
}

assertIncludes(html, 'class="clock-page"', "clock page class should scope the primary instrument layout");
assertIncludes(html, 'class="primary-drawer-button"', "primary view should expose only the small drawer trigger");
assertIncludes(html, 'class="selected-clock-section drawer-section"', "drawer should own selected clock content");
assertIncludes(html, 'class="selected-clock-state"', "selected clock content should disclose daily/account track state");
assertIncludes(html, 'class="drawer-section drawer-controls"', "drawer should own migrated controls");

[
  ".account-bar",
  ".presentation-bar",
  ".presentation-status",
  ".lens-bar",
  ".lens-status",
  ".clock-surface-panel",
  ".action-loop",
  ".lens-deep-panel",
  ".scripture-reader-panel",
].forEach((selector) => {
  assertIncludes(js, `document.querySelector("${selector}")`, `${selector} should be migrated into the drawer`);
});

assertIncludes(js, "function handleClockElementSelection", "clock elements need a central click-selection handler");
assertIncludes(js, "const JOURNEY_TRACK_LIBRARY", "life aspects should have canonical journey track copy");
assertIncludes(js, "function patchJourneyTrackState", "journey track state should persist through daily history");
assertIncludes(js, "selectedJourneyTrackId", "selected journey track should be stored with the daily entry");
assertIncludes(js, "journeyTracks", "daily history should include per-track selected/practiced/reflected state");
assertIncludes(js, "updateSelectedClockDrawer(layerName, datum);", "clock clicks should update drawer content");
assertIncludes(js, "setDrawerOpen(true);", "selecting a clock element should open the drawer");
assertIncludes(js, "setDrawerOpen(false);", "clicking the selected element should close the drawer");
assertIncludes(js, 'selectAll("path.ring-path")', "SVG paths should receive selection state");
assertIncludes(js, 'selectAll("g.life-wheel-segment")', "life wheel segments should receive selection state");
assertIncludes(js, '.on("click", (event, datum) => handleClockElementSelection(layerName, datum, event))', "ring paths should be clickable");
assertIncludes(js, '.on("click", (event, domain) => handleClockElementSelection("life", domain, event))', "life domains should be clickable");

assertIncludes(js, 'return "Rhythm 80";', "journey pacing should use rhythm labels");
assertIncludes(js, 'return "Rhythm 68";', "journey pacing should include 68 rhythm");
assertIncludes(js, 'return "Rhythm 32";', "journey pacing should include 32 rhythm");
assertIncludes(js, 'return "Golden Return";', "journey pacing should include golden return fallback");
assert.ok(!/selected-clock-[\w-]+["'][^]*?\b\d{1,3}%/.test(html), "selected track copy should not use percent completion");

[
  "household",
  "work",
  "body",
  "mind",
  "relationships",
  "stewardship",
  "vocation",
  "contemplation",
].forEach((trackId) => {
  assertIncludes(js, `${trackId}: {`, `${trackId} journey track should be defined`);
});

const svgFocusBlock = extractCssBlock(`svg#clock,
svg#clock *,
svg#clock *:focus,
svg#clock *:focus-visible`);
assert.match(svgFocusBlock, /outline:\s*none\s*!important/, "native SVG focus rectangle should be suppressed");

const selectedRingBlock = extractCssBlock(".ring-path.is-selected");
assert.match(selectedRingBlock, /animation:\s*clock-touch-bounce/, "selected ring should have touch feedback");
assert.match(selectedRingBlock, /stroke:/, "selected ring should be highlighted by SVG stroke");
assert.match(selectedRingBlock, /fill-opacity:/, "selected ring should be highlighted by SVG fill opacity");
assert.doesNotMatch(selectedRingBlock, /\bborder\b|\bbox-shadow\b|\boutline\b/, "selected ring highlight must not be rectangular chrome");

const drawerButtonOpenBlock = extractCssBlock('body[data-drawer-open="true"] .primary-drawer-button');
assert.match(drawerButtonOpenBlock, /opacity:\s*0/, "drawer button should hide while drawer is open");
assert.match(drawerButtonOpenBlock, /pointer-events:\s*none/, "hidden drawer button should not sit in front of the open drawer");

console.log("clock drawer contract tests: PASS");
