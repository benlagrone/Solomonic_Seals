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
const clockData = fs.readFileSync(path.join(repoRoot, "data", "solomonic_clock_full.json"), "utf8");

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
assert.ok(!html.includes("Read the day through Scripture-first counsel"), "main clock surface should not carry the long explanatory intro copy");
assertIncludes(html, "A Solomonic Clock of Spheres", "clock legacy line should use the current product wording");
assertIncludes(clockData, '"spirit": "#b8a46a"', "outer spirit ring should use muted brass instead of fuchsia/pink");
assertIncludes(js, 'const CLOCK_STATIC_DATA_VERSION = "20260620-spirit-brass1";', "clock data fetches should be versioned so palette changes are not stuck behind JSON cache");
assertIncludes(html, 'class="clock-readout"', "live clock readout should sit above the SVG instead of over the center of the clock");
assertIncludes(js, "function updateClockReadout", "clock render loop should hydrate the above-clock readout");
assertIncludes(css, "svg#clock .center-label", "SVG center text should be suppressed after moving the readout above the clock");
assertIncludes(html, 'class="primary-drawer-button"', "primary view should expose only the small drawer trigger");
assertIncludes(html, 'class="selected-clock-section drawer-section"', "drawer should own selected clock content");
assertIncludes(html, 'class="selected-clock-state"', "selected clock content should disclose daily/account track state");
assertIncludes(html, 'class="selected-track-panel"', "selected life tracks should expose their drawer-owned journey panel");
assertIncludes(html, 'class="selected-track-practice"', "selected life tracks should expose a direct practice action");
assertIncludes(html, 'class="selected-track-reflect"', "selected life tracks should expose a direct reflection action");
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
assertIncludes(js, "function getJourneyTrackHistory", "journey tracks should build a saved history trail");
assertIncludes(js, "function buildJourneyTrackProgress", "journey tracks should compute stage and cadence from saved history");
assertIncludes(js, "function setupSelectedTrackControls", "journey track panel actions should be wired");
assertIncludes(js, 'const CLOCK_WISDOM_ANCHOR_API_ENDPOINT = "/api/clock/wisdom-anchor";', "daily wisdom should use the Solomonic Clock wisdom API contract");
assertIncludes(js, 'const CLOCK_DATA_API_ENDPOINT = "/api/clock";', "clock frontend should prefer the clock-owned dataset API");
assertIncludes(js, 'const CLOCK_RUNTIME_API_ENDPOINT = "/api/clock/runtime";', "clock frontend should know the clock-owned runtime API");
assertIncludes(js, 'const CLOCK_DATA_FALLBACK_RESOURCE = "../data/solomonic_clock_full.json";', "bundled clock JSON should remain a fallback resource");
assertIncludes(js, "function fetchClockDataset", "clock frontend should centralize live dataset loading and fallback behavior");
assertIncludes(js, "function fetchClockRuntime", "clock frontend should fetch the compact runtime state contract");
assertIncludes(js, "getClockRuntimeForDisplay(displayNow)", "render loop should request runtime state for the displayed clock date");
assertIncludes(js, "function applyClockRuntimeToTimeState", "clock frontend should apply API runtime state to visible clock state");
assertIncludes(js, "applyClockRuntimeToTimeState(", "render loop should use backend runtime before updating visible clock surfaces");
assertIncludes(js, "clockRuntime?.degree?.solar_longitude", "runtime adoption should use solar longitude for spirit-ring state");
assertIncludes(js, "clockRuntime?.sector?.index", "runtime adoption should use API-owned sector resolution");
assertIncludes(js, "function getClockRuntimeHourSummary", "clock frontend should summarize runtime-owned planetary hour windows");
assertIncludes(js, "clockRuntime?.planetary_hour", "runtime hour summaries should use API-owned planetary hour state");
assertIncludes(js, "runtimeHour?.window", "ritual surfaces should show the API-owned solar hour interval");
assertIncludes(js, "clockRuntime", "Pericope launch context should carry clock runtime state when available");
assertIncludes(js, "fetchClockDataset()", "clock initialization should load clock data through the API-first dataset loader");
assert.ok(!js.includes('fetchJsonResource("../data/solomonic_clock_full.json", "clock data")'), "clock initialization should not prefer bundled clock JSON");
assertIncludes(js, "function fetchClockWisdomAnchor", "clock frontend should fetch wisdom through the clock-owned API");
assertIncludes(js, 'const CLOCK_CONTENT_BUNDLE_API_ENDPOINT = "/api/clock/content-bundle";', "daily bundle should use the Solomonic Clock content-bundle API contract");
assertIncludes(js, "function fetchClockContentBundle", "clock frontend should fetch the daily bundle through the clock-owned API");
assertIncludes(js, "fetchClockContentBundle(displayNow)", "daily content bundle should request the API bundle for the displayed clock date");
assertIncludes(js, "function renderDailyContentBundleFallback", "frontend bundle computation should remain fallback-only while the API path is adopted");
assertIncludes(js, 'const CLOCK_CONTEXT_API_ENDPOINT = "/api/clock/context";', "daily context surfaces should use the Solomonic Clock context API contract");
assertIncludes(js, "function fetchClockContext", "clock frontend should fetch daily context through the clock-owned API");
assertIncludes(js, "getClockContextForDisplay(displayNow)", "render loop should request API context for the displayed clock date");
assertIncludes(js, "function mergeClockApiContext", "Pericope launch context should be hydrated from API-owned clock context when available");
assertIncludes(js, "context?.clockApiContext", "Pericope launch ctx should prefer API-owned clock context when available");
assertIncludes(js, "why_selected: apiContext.why_selected", "Pericope launch ctx should preserve API why-selected reasoning");
assertIncludes(js, "selectedJourneyTrackId", "selected journey track should be stored with the daily entry");
assertIncludes(js, "journeyTracks", "daily history should include per-track selected/practiced/reflected state");
assertIncludes(js, "reflectionPrompt", "journey track reflection prompts should be persisted");
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
assertIncludes(js, "const JOURNEY_TRACK_STAGES", "journey tracks should define non-percentage stage gates");
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

assertIncludes(css, "Target screen modes: regular phone, Fold cover, Fold inner, and Android TV.", "responsive target modes should be documented in CSS");
assertIncludes(css, "@media (max-width: 640px)", "regular phone mode should have an explicit breakpoint");
assertIncludes(css, "height: min(82dvh, 42rem);", "phone drawer should behave as a bottom sheet");
assertIncludes(css, "transform: translateY(calc(100% + 2px));", "phone drawer should collapse vertically");
assertIncludes(css, "@media (max-width: 380px) and (min-height: 700px)", "Fold cover/narrow phone mode should have a dedicated breakpoint");
assertIncludes(css, "@media (min-width: 700px) and (max-width: 1180px) and (min-height: 600px)", "Fold inner mode should have a compact tablet breakpoint");
assertIncludes(html, 'class="daily-meditation drawer-section"', "default drawer tab should expose a composed Solomonic meditation");
assertIncludes(html, 'class="meditation-clock-text"', "Clock anchor should explain the clock signal");
assertIncludes(html, 'class="meditation-pentacle-text"', "Counsel tab should carry the pentacle correspondence");
assert.ok(!html.includes('class="meditation-psalm-text"'), "Counsel tab should not show Psalm excerpts");
assert.ok(!html.includes('class="meditation-wisdom-text"'), "Counsel tab should not show Proverb excerpts");
assertIncludes(html, 'data-drawer-tab="proverb"', "Proverb should be a top-level drawer tab");
assertIncludes(html, 'data-drawer-tab="psalm"', "Psalm should be a top-level drawer tab");
assert.ok(!html.includes('data-drawer-tab="reading"'), "generic Reading tab should be replaced by Proverb and Psalm tabs");
assertIncludes(js, "function updateDailyMeditationPanel", "drawer should compose clock, pentacle, and practice context into Counsel");
assertIncludes(js, "clockExplanation", "daily meditation should explain the clock hour or clock signal");
assertIncludes(css, 'body.clock-page[data-drawer-tab="now"] .drawer .daily-meditation', "default drawer tab should show the composed meditation instead of raw sections");
assertIncludes(css, ".clock-page .meditation-body", "Solomonic meditation body should have explicit flow styling");
assertIncludes(css, "overflow: visible;", "Solomonic meditation body should not create a nested scroll area");
assertIncludes(css, ".illuminated-heading::first-letter", "drawer tab headings should share the manuscript-style illuminated initial");
assertIncludes(html, 'class="meditation-title illuminated-heading"', "Counsel tab title should use the illuminated heading treatment");
assertIncludes(html, 'class="scripture-reader-title illuminated-heading"', "Psalm and Proverb reader titles should use the illuminated heading treatment");
assertIncludes(html, 'class="lens-deep-title illuminated-heading"', "Practice tab title should use the illuminated heading treatment");
assertIncludes(html, 'class="rule-heading illuminated-heading illuminated-heading--compact"', "Rule of Life subheader should use the compact illuminated treatment");
assertIncludes(html, 'class="weekly-arc-heading illuminated-heading illuminated-heading--compact"', "Weekly Arc subheader should use the compact illuminated treatment");
assertIncludes(html, 'class="history-heading illuminated-heading illuminated-heading--compact"', "History tab title should use the compact illuminated treatment");
assertIncludes(js, 'let readingDepth = "long";', "Psalm tab should default to the full long passage instead of exposing competing depth choices");
assertIncludes(css, 'body.clock-page[data-drawer-tab="proverb"] .drawer .scripture-reader-panel', "full Proverb content should be available through the Proverb tab reader");
assertIncludes(js, "getWisdomTextForReference(wisdomRef)", "Proverb tab should route missing text through the explicit wisdom fallback hook");
assertIncludes(js, "Wisdom passage unavailable.", "Proverb tab should show an unavailable state instead of hardcoded scripture text when source resolution fails");
assertIncludes(css, 'body.clock-page[data-drawer-tab="psalm"] .drawer .scripture-reader-panel', "full Psalm content should be available through the Psalm tab reader");
assert.ok(!html.includes('class="reading-depth drawer-section"'), "Psalm/Proverb tabs should not expose short/medium/long depth buttons");
assert.ok(!css.includes('body.clock-page[data-drawer-tab="proverb"] .drawer .daily-bundle,'), "Proverb tab should not duplicate the daily bundle underneath the reader");
assert.ok(!css.includes('body.clock-page[data-drawer-tab="psalm"] .drawer .daily-bundle,'), "Psalm tab should not duplicate the daily bundle underneath the reader");
assertIncludes(js, 'const practicePageActive = uiState.drawerTab === "practice";', "Practice tab should expose reflection capture as page content rather than a middle toggle");
assertIncludes(css, ".clock-page .drawer-controls .action-daily-opening,", "Practice tab should hide Daily Opening from the middle button row");
assertIncludes(css, ".clock-page .drawer-controls .action-adopt,", "Practice tab should hide the inert Practice Chosen/Adopt control");
assertIncludes(css, ".clock-page .drawer-controls .action-reflect,", "Practice tab should hide Reflect Tonight as a page toggle");
assertIncludes(css, ".clock-page .drawer-controls .action-pericope-guided", "Practice tab should retain guided chat as the bottom CTA");
assert.ok(!css.includes('body.clock-page[data-drawer-tab="practice"] .drawer .selected-clock-section,'), "Practice tab should combine Daily Guidance into the practice frame instead of showing a second guidance card");
assertIncludes(js, 'kicker: "Daily Guidance"', "Practice frame should carry the Daily Guidance label after combining the sections");
assertIncludes(js, 'title: "One act, one repair, one horizon"', "Practice frame should keep the concise practice hierarchy after combining sections");
assert.ok(!html.includes('class="history-weekly-summary"'), "History tab should combine Weekly Summary into the Weekly Review card");
assertIncludes(html, 'class="history-weekly-review"', "History tab should retain one combined weekly review section");
assertIncludes(css, 'body[data-drawer-open="true"] .page', "Fold inner mode should preserve the clock beside the drawer");
assertIncludes(css, "margin-right: min(390px, 38vw);", "Fold inner mode should reserve drawer space");
assertIncludes(css, "@media (min-width: 1280px) and (min-height: 700px) and (hover: none)", "Android TV mode should have a remote-oriented breakpoint");
assertIncludes(css, "outline-offset: 4px;", "Android TV mode should emphasize focus visibility");
assertIncludes(css, "@media (pointer: coarse)", "touch targets should be sized for phones and foldables");
assertIncludes(css, "min-height: 44px;", "touch controls should meet mobile target size");

console.log("clock drawer contract tests: PASS");
