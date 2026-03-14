/* global d3 */
"use strict";

const WIDTH = 800;
const HEIGHT = 800;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const RING_THICKNESS = {
  core: 90,
  celestial: 70,
  planetary: 70,
  spirit: 70,
};

const MS_PER_DAY = 86_400_000;

const clockWrapper = d3.select(".clock-wrapper");
const tooltip = (() => {
  const existing = clockWrapper.select(".tooltip");
  return existing.empty()
    ? clockWrapper.append("div").attr("class", "tooltip")
    : existing;
})();

const svg = d3
  .select("#clock")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

const sealDefs = svg.append("defs").attr("class", "seal-sprite-defs");

const rootGroup = svg
  .append("g")
  .attr("class", "root")
  .attr("transform", `translate(${CENTER.x}, ${CENTER.y})`);

const ringGroups = {
  core: rootGroup.append("g").attr("class", "ring-core"),
  celestial: rootGroup.append("g").attr("class", "ring-celestial"),
  planetary: rootGroup.append("g").attr("class", "ring-planetary"),
  spirit: rootGroup.append("g").attr("class", "ring-spirit"),
};
const lifeWheelGroup = rootGroup
  .insert("g", ".ring-planetary")
  .attr("class", "life-wheel-overlay");
const planetarySealGlyphGroup = ringGroups.planetary
  .append("g")
  .attr("class", "planetary-seal-glyphs");
const activeSealFocusGroup = ringGroups.core
  .append("g")
  .attr("class", "active-seal-focus");
const scriptureOverlayGroup = rootGroup
  .append("g")
  .attr("class", "scripture-overlay");
const ritualOverlayGroup = rootGroup
  .append("g")
  .attr("class", "ritual-overlay");
const esotericOverlayGroup = rootGroup
  .append("g")
  .attr("class", "esoteric-overlay");
const historyPreviewGroup = rootGroup
  .append("g")
  .attr("class", "history-preview");
const lensFocusGroup = rootGroup
  .append("g")
  .attr("class", "lens-focus-overlay");
const lensAnnotationGroup = rootGroup
  .append("g")
  .attr("class", "lens-annotation-layer");
const centerModeGroup = rootGroup
  .append("g")
  .attr("class", "center-mode-control");

const centerGroup = rootGroup.append("g").attr("class", "center-label");
const centerDayLabel = centerGroup
  .append("text")
  .attr("class", "center-day")
  .attr("text-anchor", "middle")
  .attr("fill", "#f1f5f9")
  .attr("font-size", "26px")
  .attr("font-weight", "600")
  .attr("y", -12);

const centerTitleLabel = centerGroup
  .append("text")
  .attr("class", "center-title")
  .attr("text-anchor", "middle")
  .attr("fill", "#facc15")
  .attr("font-size", "18px")
  .attr("font-weight", "500")
  .attr("y", 18);

const centerSpiritLabel = centerGroup
  .append("text")
  .attr("class", "center-spirit")
  .attr("text-anchor", "middle")
  .attr("fill", "#cbd5f5")
  .attr("font-size", "16px")
  .attr("font-weight", "500")
  .attr("y", 48);

const centerPentacleLabel = centerGroup
  .append("text")
  .attr("class", "center-pentacle")
  .attr("text-anchor", "middle")
  .attr("fill", "#94a3b8")
  .attr("font-size", "14px")
  .attr("font-weight", "500")
  .attr("y", 72);

const drawerElements = {
  headerTitle: document.querySelector(".drawer-header h2"),
  drawer: document.querySelector(".drawer"),
  drawerBody: document.querySelector(".drawer-body"),
  drawerToggle: document.querySelector(".drawer-toggle"),
  planet: document.querySelector(".psalm-planet"),
  focus: document.querySelector(".psalm-focus"),
  list: document.querySelector(".psalm-list"),
  subtitle: document.querySelector(".drawer-subtitle"),
  lensStatus: document.querySelector(".lens-status"),
  lensButtons: Array.from(document.querySelectorAll(".lens-button[data-lens]")),
  sections: Array.from(document.querySelectorAll(".drawer-section[data-lenses]")),
  guidanceDay: document.querySelector(".guidance-day"),
  guidanceTone: document.querySelector(".guidance-tone"),
  guidanceList: document.querySelector(".guidance-list"),
  weeklyArcList: document.querySelector(".weekly-arc-list"),
  weeklyArcPrev: document.querySelector(".weekly-arc-prev"),
  weeklyArcNext: document.querySelector(".weekly-arc-next"),
  weeklyArcToday: document.querySelector(".weekly-arc-today"),
  profileDay: document.querySelector(".profile-day"),
  profilePentacle: document.querySelector(".profile-pentacle"),
  profileFocus: document.querySelector(".profile-focus"),
  profileColor: document.querySelector(".profile-color"),
  profileMetal: document.querySelector(".profile-metal"),
  profileAngel: document.querySelector(".profile-angel"),
  depthButtons: Array.from(document.querySelectorAll(".depth-button[data-depth]")),
  explainList: document.querySelector(".explain-list"),
  explainCitation: document.querySelector(".explain-citation"),
  bundlePsalmRef: document.querySelector(".bundle-psalm-ref"),
  bundlePsalmText: document.querySelector(".bundle-psalm-text"),
  bundleWisdomRef: document.querySelector(".bundle-wisdom-ref"),
  bundleWisdomText: document.querySelector(".bundle-wisdom-text"),
  bundleSolomonicRef: document.querySelector(".bundle-solomonic-ref"),
  bundleSolomonicText: document.querySelector(".bundle-solomonic-text"),
  surfaceLensLabel: document.querySelector(".surface-lens-label"),
  surfaceLensTitle: document.querySelector(".surface-lens-title"),
  surfaceLensBody: document.querySelector(".surface-lens-body"),
  surfaceRule: document.querySelector(".surface-rule"),
  surfaceRuleVirtue: document.querySelector(".surface-rule-virtue"),
  surfaceRuleDomain: document.querySelector(".surface-rule-domain"),
  surfaceRuleMorning: document.querySelector(".surface-rule-morning"),
  surfaceRuleMidday: document.querySelector(".surface-rule-midday"),
  surfaceRuleEvening: document.querySelector(".surface-rule-evening"),
  ruleSection: document.querySelector(".rule-of-life"),
  ruleVirtue: document.querySelector(".rule-virtue"),
  ruleDomain: document.querySelector(".rule-domain"),
  ruleMorning: document.querySelector(".rule-morning"),
  ruleMidday: document.querySelector(".rule-midday"),
  ruleEvening: document.querySelector(".rule-evening"),
};
let lastPsalmKey = null;
let lastGuidanceKey = null;
let lastWeeklyArcKey = null;
let lastProfileKey = null;
let lastExplainabilityKey = null;
let lastBundleKey = null;
let lastActiveSealFocusKey = null;
let lastLifeWheelKey = null;
let lastRuleOfLifeKey = null;
let currentPsalmRequestId = 0;
let currentBundleRequestId = 0;
let readingDepth = "short";
let hoveredPlanetaryKey = null;
let selectedDayOffset = 0;
let baseDrawerSubtitleText = "Live mapping for the active planetary pentacle.";
const uiState = {
  lens: "base",
  mode: "guidance",
  focusedRing: null,
  drawerOpen: false,
};
const psalmTextCache = new Map();
const bundledPsalmMap = new Map();
const PSALM_API_ENDPOINT = "/api/psalm";
const ENABLE_REMOTE_SCRIPTURE_FETCH = false;
const RULE_OF_LIFE_LIBRARY = {
  mind: {
    morning: "Read one demanding paragraph before messages or feeds.",
    midday: "Slow one decision until the terms are actually clear.",
    evening: "Write one sentence about what became clearer today.",
    repair: "Return to the question you avoided and name it plainly.",
  },
  body: {
    morning: "Begin with one deliberate act of physical order or movement.",
    midday: "Pause long enough to reset your pace, posture, and breath.",
    evening: "End the day with one act that restores strength rather than drains it.",
    repair: "Choose steadiness over excess in the next physical decision.",
  },
  relationships: {
    morning: "Send one clarifying or reconciling message before noon.",
    midday: "Answer tension with a calm sentence instead of a quick reaction.",
    evening: "Review one conversation and name where love held or failed.",
    repair: "Repair one strained edge before resentment hardens.",
  },
  stewardship: {
    morning: "Name one obligation and one resource before you spend or promise.",
    midday: "Check one exchange for fairness rather than convenience.",
    evening: "Put one account, note, or obligation back into order.",
    repair: "Restore order where waste or drift has appeared.",
  },
  vocation: {
    morning: "Do the resisted task first while your will is still clean.",
    midday: "Finish one difficult piece of work before changing context.",
    evening: "Name whether your labor served purpose or only motion today.",
    repair: "Return to the work you postponed and move it one step forward.",
  },
  household: {
    morning: "Put one room, surface, or routine into visible order.",
    midday: "Keep one boundary or domestic promise instead of improvising around it.",
    evening: "Restore one area of the house before ending the day.",
    repair: "Rebuild one neglected routine before it becomes clutter.",
  },
  contemplation: {
    morning: "Keep ten quiet minutes before noise, news, or requests.",
    midday: "Step back long enough to recover inward attention.",
    evening: "Close the day with one honest note, prayer, or silence.",
    repair: "Return to silence where distraction has ruled the day.",
  },
};
const RULE_OF_LIFE_DAY_TONES = {
  Sun: "with purpose",
  Moon: "with attention",
  Mars: "with courage",
  Mercury: "with clarity",
  Jupiter: "with breadth",
  Venus: "with gentleness",
  Saturn: "with discipline",
};
const READING_DEPTHS = new Set(["short", "medium", "long"]);
const LENS_DEFINITIONS = {
  base: {
    title: "Daily Guidance",
    subtitle: () => baseDrawerSubtitleText,
    status: "Base lens keeps the clock primary and now surfaces both current guidance and life-balance state.",
    focusRing: null,
  },
  scripture: {
    title: "Scripture Lens",
    subtitle: () => `${baseDrawerSubtitleText} Reading depth, verse mappings, and provenance are foregrounded.`,
    status: "Scripture lens surfaces psalms, wisdom excerpts, and explicit why-this-was-selected logic.",
    focusRing: "core",
    focusLabel: "Scripture Anchor",
    focusColor: "#facc15",
  },
  ritual: {
    title: "Ritual Lens",
    subtitle: () => "Planetary day, weekly arc, timing cues, and practical devotional use are foregrounded.",
    status: "Ritual lens emphasizes timing, focus, and the day’s practical devotional posture.",
    focusRing: "planetary",
    focusLabel: "Timing Ring",
    focusColor: "#60a5fa",
  },
  esoteric: {
    title: "Esoteric Lens",
    subtitle: () => "Pentacle correspondences, symbolic profile, and hidden structural logic are foregrounded.",
    status: "Esoteric lens pulls symbolic correspondences forward without replacing the base guidance.",
    focusRing: "spirit",
    focusLabel: "Correspondence Ring",
    focusColor: "#c4b5fd",
  },
  history: {
    title: "History Lens",
    subtitle: () => "Weekly arc is used as the current historical preview until Providence views are added.",
    status: "History lens shifts attention toward temporal continuity, recent arc, and future timeline layers.",
    focusRing: "history",
    focusLabel: "History Arc",
    focusColor: "#4ade80",
  },
};
const AVAILABLE_LENSES = new Set(Object.keys(LENS_DEFINITIONS));
const MODE_DEFINITIONS = {
  guidance: {
    title: "Guidance",
    shortLabel: "Guide",
    description: "Keep the current day, pentacle, and spirit reading centered.",
    focusRing: null,
    accentColor: "#facc15",
  },
  practice: {
    title: "Practice",
    shortLabel: "Do",
    description: "Surface the current life-domain action and make the wheel primary.",
    focusRing: "life",
    accentColor: "#34d399",
  },
  reflection: {
    title: "Reflection",
    shortLabel: "Reflect",
    description: "Turn the center toward examination and self-review.",
    focusRing: "core",
    accentColor: "#818cf8",
  },
  mentor: {
    title: "Mentor",
    shortLabel: "Mentor",
    description: "Render the center through a wisdom voice anchored to today’s ruler.",
    focusRing: "core",
    accentColor: "#c4b5fd",
  },
  forecast: {
    title: "Forecast",
    shortLabel: "Next",
    description: "Preview the next hour and tomorrow’s dominant movement.",
    focusRing: "planetary",
    accentColor: "#60a5fa",
  },
  timeline: {
    title: "Timeline",
    shortLabel: "Past",
    description: "Pull recent and upcoming arc markers around the outer band.",
    focusRing: "history",
    accentColor: "#4ade80",
  },
};
const AVAILABLE_MODES = new Set(Object.keys(MODE_DEFINITIONS));
const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const SEAL_SPRITE_SIZE = 100;
const SEAL_SPRITE_CENTER = SEAL_SPRITE_SIZE / 2;
const PLANETARY_DAY_GUIDANCE = {
  Sun: {
    tone: "Visibility, confidence, and leadership work are favored.",
    activities: ["Present your work publicly.", "Make decisions that set direction.", "Focus on vitality and renewal."],
  },
  Moon: {
    tone: "Reflection, receptivity, and home-centered work are favored.",
    activities: ["Journal dreams and emotional patterns.", "Cleanse your space and routines.", "Prioritize family and restoration."],
  },
  Mars: {
    tone: "Bold action, protection, and difficult tasks are favored.",
    activities: ["Handle conflict directly and clearly.", "Do hard tasks first.", "Set and defend boundaries."],
  },
  Mercury: {
    tone: "Communication, study, and planning are favored.",
    activities: ["Write, research, and organize ideas.", "Schedule key conversations.", "Review contracts and details."],
  },
  Jupiter: {
    tone: "Growth, opportunity, and wise leadership are favored.",
    activities: ["Plan expansion and long-range goals.", "Teach, mentor, or advise.", "Act on strategic opportunities."],
  },
  Venus: {
    tone: "Harmony, creativity, and relationship work are favored.",
    activities: ["Repair social friction with diplomacy.", "Make time for art or design.", "Strengthen key partnerships."],
  },
  Saturn: {
    tone: "Discipline, structure, and enduring work are favored.",
    activities: ["Set limits and simplify commitments.", "Complete long-term maintenance work.", "Focus on serious, patient progress."],
  },
};
const PLANETARY_CORRESPONDENCES = {
  Sun: {
    color: "Gold",
    metal: "Gold",
    angel: "Michael",
  },
  Moon: {
    color: "Silver",
    metal: "Silver",
    angel: "Gabriel",
  },
  Mars: {
    color: "Scarlet",
    metal: "Iron",
    angel: "Camael",
  },
  Mercury: {
    color: "Yellow",
    metal: "Quicksilver",
    angel: "Raphael",
  },
  Jupiter: {
    color: "Royal Blue",
    metal: "Tin",
    angel: "Sachiel",
  },
  Venus: {
    color: "Emerald",
    metal: "Copper",
    angel: "Anael",
  },
  Saturn: {
    color: "Black",
    metal: "Lead",
    angel: "Cassiel",
  },
};
const WISDOM_CONTENT_BY_RULER = {
  Sun: {
    ref: "Proverbs 4:18",
    text: "The path of the just is as the shining light, that shineth more and more unto the perfect day.",
  },
  Moon: {
    ref: "Ecclesiastes 3:1",
    text: "To every thing there is a season, and a time to every purpose under the heaven.",
  },
  Mars: {
    ref: "Proverbs 24:10",
    text: "If thou faint in the day of adversity, thy strength is small.",
  },
  Mercury: {
    ref: "Proverbs 18:21",
    text: "Death and life are in the power of the tongue.",
  },
  Jupiter: {
    ref: "Proverbs 11:25",
    text: "The liberal soul shall be made fat: and he that watereth shall be watered also himself.",
  },
  Venus: {
    ref: "Proverbs 15:1",
    text: "A soft answer turneth away wrath: but grievous words stir up anger.",
  },
  Saturn: {
    ref: "Proverbs 25:28",
    text: "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
  },
};
const FALLBACK_DAILY_PSALM_BY_RULER = {
  Sun: { chapter: 19, verse: 1 },
  Moon: { chapter: 63, verse: 6 },
  Mars: { chapter: 144, verse: 1 },
  Mercury: { chapter: 119, verse: 105 },
  Jupiter: { chapter: 112, verse: 3 },
  Venus: { chapter: 45, verse: 2 },
  Saturn: { chapter: 90, verse: 12 },
};
const LIFE_DOMAIN_FOCUS_KEYWORDS = [
  { pattern: /\b(study|learn|understand|message|speech|word|reason|clarity|think|mind)\b/i, domain: "mind" },
  { pattern: /\b(body|health|sleep|rest|strength|travel|journey|road|movement|discipline)\b/i, domain: "body" },
  { pattern: /\b(relationship|repair|peace|conflict|anger|friend|partner|love|reconcile)\b/i, domain: "relationships" },
  { pattern: /\b(money|wealth|trade|resource|budget|steward|provision|prosper)\b/i, domain: "stewardship" },
  { pattern: /\b(work|task|career|labor|courage|purpose|calling|vocation|lead)\b/i, domain: "vocation" },
  { pattern: /\b(home|house|household|order|routine|maintenance|boundary)\b/i, domain: "household" },
  { pattern: /\b(prayer|silence|reflect|contemplate|faith|spirit|mercy|devotion)\b/i, domain: "contemplation" },
];

function getLensDefinition(lens) {
  return LENS_DEFINITIONS[lens] || LENS_DEFINITIONS.base;
}

function getModeDefinition(mode) {
  return MODE_DEFINITIONS[mode] || MODE_DEFINITIONS.guidance;
}

function applyLensState() {
  const lensDefinition = getLensDefinition(uiState.lens);
  const modeDefinition = getModeDefinition(uiState.mode);
  uiState.focusedRing = modeDefinition.focusRing || lensDefinition.focusRing || null;
  document.body.dataset.lens = uiState.lens;
  document.body.dataset.mode = uiState.mode;
  svg.attr("data-lens", uiState.lens);
  svg.attr("data-mode", uiState.mode);

  drawerElements.lensButtons.forEach((button) => {
    const buttonLens = String(button.dataset.lens || "").toLowerCase();
    const isActive = buttonLens === uiState.lens;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (drawerElements.headerTitle) {
    drawerElements.headerTitle.textContent = lensDefinition.title;
  }

  if (drawerElements.subtitle) {
    drawerElements.subtitle.textContent = lensDefinition.subtitle();
  }

  if (drawerElements.lensStatus) {
    drawerElements.lensStatus.textContent = lensDefinition.status;
  }

  drawerElements.sections.forEach((section) => {
    const supportedLenses = String(section.dataset.lenses || "")
      .split(/\s+/)
      .filter(Boolean);
    const isVisible = !supportedLenses.length || supportedLenses.includes(uiState.lens);
    section.hidden = !isVisible;
    section.classList.toggle("is-hidden", !isVisible);
  });
}

function setMode(nextMode) {
  const normalizedMode = String(nextMode || "").toLowerCase();
  if (!AVAILABLE_MODES.has(normalizedMode) || normalizedMode === uiState.mode) {
    return;
  }
  uiState.mode = normalizedMode;
  applyLensState();
}

function applyDrawerState() {
  if (!drawerElements.drawer || !drawerElements.drawerBody || !drawerElements.drawerToggle) {
    return;
  }

  drawerElements.drawer.classList.toggle("is-collapsed", !uiState.drawerOpen);
  drawerElements.drawerBody.hidden = !uiState.drawerOpen;
  drawerElements.drawerToggle.setAttribute("aria-expanded", uiState.drawerOpen ? "true" : "false");
  drawerElements.drawerToggle.textContent = uiState.drawerOpen ? "Hide Details" : "Show Details";
}

function setLens(nextLens) {
  const normalizedLens = String(nextLens || "").toLowerCase();
  if (!AVAILABLE_LENSES.has(normalizedLens) || normalizedLens === uiState.lens) {
    return;
  }

  uiState.lens = normalizedLens;
  applyLensState();
}

function setDrawerOpen(nextValue) {
  const normalized = Boolean(nextValue);
  if (normalized === uiState.drawerOpen) {
    return;
  }
  uiState.drawerOpen = normalized;
  applyDrawerState();
}

function updateLensFocusOverlay(radii) {
  lensFocusGroup.selectAll("*").remove();

  if (!uiState.focusedRing) {
    return;
  }

  const lensDefinition = getLensDefinition(uiState.lens);
  const focusRadius = {
    core: radii.core - 6,
    celestial: radii.celestial - 6,
    life: radii.celestial - 36,
    planetary: radii.planetary - 6,
    spirit: radii.spirit - 6,
    history: radii.spirit + 28,
  }[uiState.focusedRing];

  if (!focusRadius) {
    return;
  }

  const focusColor = lensDefinition.focusColor || "#facc15";
  const focusLabel = lensDefinition.focusLabel || "";
  const overlay = lensFocusGroup.append("g").attr("class", "lens-focus");

  overlay
    .append("circle")
    .attr("class", "lens-focus-circle")
    .attr("r", focusRadius)
    .attr("fill", "none")
    .attr("stroke", hexToRgba(focusColor, 0.75))
    .attr("stroke-width", 1.35)
    .attr("stroke-dasharray", "5 7");

  if (focusLabel) {
    overlay
      .append("text")
      .attr("class", "lens-focus-label")
      .attr("y", -focusRadius - 14)
      .attr("fill", hexToRgba(focusColor, 0.92))
      .attr("text-anchor", "middle")
      .text(focusLabel);
  }
}

function updateCenterModeControl(radii) {
  const modeEntries = [
    "guidance",
    "practice",
    "mentor",
    "forecast",
    "timeline",
    "reflection",
  ].map((modeKey, index) => ({
    modeKey,
    index,
    ...getModeDefinition(modeKey),
  }));

  const innerRadius = 92;
  const outerRadius = Math.min(radii.celestial - 4, 128);
  const step = (Math.PI * 2) / modeEntries.length;
  const startRotation = degreesToRadians(-120);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(8).padAngle(0.03);

  const segmentData = modeEntries.map((entry, index) => {
    const startAngle = startRotation + index * step;
    const endAngle = startRotation + (index + 1) * step;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPoint = polarPoint(0, 0, (innerRadius + outerRadius) / 2 + 1, midAngle);
    return {
      ...entry,
      startAngle,
      endAngle,
      midAngle,
      labelPoint,
      isActive: entry.modeKey === uiState.mode,
    };
  });

  const segments = centerModeGroup
    .selectAll("g.center-mode-segment")
    .data(segmentData, (entry) => entry.modeKey)
    .join((enter) => {
      const group = enter.append("g").attr("class", "center-mode-segment");
      group.append("path").attr("class", "center-mode-wedge");
      group.append("path").attr("class", "center-mode-hit");
      group.append("text").attr("class", "center-mode-label");
      return group;
    })
    .classed("is-active", (entry) => entry.isActive)
    .classed("is-inactive", (entry) => !entry.isActive);

  const hitArc = d3.arc().innerRadius(innerRadius - 10).outerRadius(outerRadius + 10).padAngle(0.02);

  segments
    .select("path.center-mode-hit")
    .attr("d", (entry) => hitArc(entry))
    .attr("fill", "rgba(15, 23, 42, 0.001)")
    .attr("stroke", "none")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (entry) => `${entry.title}: ${entry.description}`);

  segments
    .select("path.center-mode-wedge")
    .attr("d", (entry) => arc(entry))
    .attr("fill", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.22 : 0.08))
    .attr("stroke", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.88 : 0.38))
    .attr("stroke-width", (entry) => (entry.isActive ? 1.6 : 1));

  segments
    .select("text.center-mode-label")
    .attr("transform", (entry) => {
      const angle = radiansToDegrees(entry.midAngle);
      const flip = angle > 90 || angle < -90 ? 180 : 0;
      return `translate(${entry.labelPoint.x}, ${entry.labelPoint.y}) rotate(${angle + 90 + flip})`;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.96 : 0.82))
    .text((entry) => entry.shortLabel);

  segments.style("cursor", "pointer");
  segments
    .select("path.center-mode-hit")
    .on("click", (_event, entry) => setMode(entry.modeKey))
    .on("keydown", (event, entry) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setMode(entry.modeKey);
      }
    });

  bindTooltip(segments.select("path.center-mode-hit"), (entry) => `${entry.title} • ${entry.description}`);
}

function setupLensControls() {
  if (!drawerElements.lensButtons.length) {
    return;
  }

  drawerElements.lensButtons.forEach((button) => {
    const lens = String(button.dataset.lens || "").toLowerCase();
    if (!AVAILABLE_LENSES.has(lens)) {
      return;
    }
    button.addEventListener("click", () => {
      setLens(lens);
    });
  });

  applyLensState();
}

function setupDrawerToggle() {
  if (!drawerElements.drawerToggle) {
    return;
  }

  drawerElements.drawerToggle.addEventListener("click", () => {
    setDrawerOpen(!uiState.drawerOpen);
  });

  applyDrawerState();
}

function computeRingLayout(items) {
  if (!items || !items.length) {
    return [];
  }

  const step = (Math.PI * 2) / items.length;
  return items.map((item, index) => ({
    ...item,
    startAngle: index * step,
    endAngle: (index + 1) * step,
    index,
  }));
}

function radiansToDegrees(rad) {
  return (rad * 180) / Math.PI;
}

function drawSpiritTooltipText(entry) {
  if (uiState.lens === "esoteric") {
    return `Sector ${entry.sector} – ${entry.zodiac} ${entry.degrees} – ${entry.spirit} (${entry.rank})`;
  }
  return `${entry.zodiac} ${entry.degrees} – ${entry.spirit} (${entry.rank})`;
}

function drawCelestialTooltipText(entry) {
  return `${entry.name} – ${entry.virtue}`;
}

function drawPlanetaryTooltipText(entry) {
  if (uiState.lens === "esoteric") {
    const correspondences = PLANETARY_CORRESPONDENCES[entry.name] || {};
    return `${entry.name} – Angel: ${correspondences.angel || "—"} • Metal: ${correspondences.metal || "—"} • Color: ${correspondences.color || "—"}`;
  }
  if (uiState.lens === "ritual") {
    const themes = Array.isArray(entry.themes) && entry.themes.length
      ? entry.themes.join(" • ")
      : "Themes unavailable";
    return `${entry.day} – ${entry.name} • ${themes}`;
  }
  return `${entry.name} – ${entry.day} (${entry.pentacles.length} seals)`;
}

function slugifyIdPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSealSymbolId(planet, pentacleIndex) {
  return `seal-${slugifyIdPart(planet)}-${String(pentacleIndex)}`;
}

function buildPentacleDataKey(planet, pentacleIndex) {
  return `${slugifyIdPart(planet)}_${String(pentacleIndex)}`;
}

function hashString(input) {
  let hash = 0;
  const text = String(input || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function polarPoint(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function describeArcPath(radius, startDegrees, endDegrees) {
  const startAngle = degreesToRadians(startDegrees);
  const endAngle = degreesToRadians(endDegrees);
  const start = polarPoint(0, 0, radius, startAngle);
  const end = polarPoint(0, 0, radius, endAngle);
  const delta = ((endDegrees - startDegrees) + 360) % 360;
  const largeArc = delta > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function buildAlternatingPolygonPath(cx, cy, points, outerRadius, innerRadius, rotation = -Math.PI / 2) {
  const vertices = [];
  const total = points * 2;
  for (let index = 0; index < total; index += 1) {
    const angle = rotation + (Math.PI * index) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertices.push(polarPoint(cx, cy, radius, angle));
  }
  return `${vertices.map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")} Z`;
}

function buildRegularPolygonPath(cx, cy, sides, radius, rotation = -Math.PI / 2) {
  const vertices = [];
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    vertices.push(polarPoint(cx, cy, radius, angle));
  }
  return `${vertices.map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")} Z`;
}

function buildCrossPath(cx, cy, size, armWidth) {
  const half = size / 2;
  const arm = armWidth / 2;
  return [
    `M ${cx - arm} ${cy - half}`,
    `L ${cx + arm} ${cy - half}`,
    `L ${cx + arm} ${cy - arm}`,
    `L ${cx + half} ${cy - arm}`,
    `L ${cx + half} ${cy + arm}`,
    `L ${cx + arm} ${cy + arm}`,
    `L ${cx + arm} ${cy + half}`,
    `L ${cx - arm} ${cy + half}`,
    `L ${cx - arm} ${cy + arm}`,
    `L ${cx - half} ${cy + arm}`,
    `L ${cx - half} ${cy - arm}`,
    `L ${cx - arm} ${cy - arm}`,
    "Z",
  ].join(" ");
}

function buildCrescentPath(cx, cy, outerRadius, innerRadius, offsetX) {
  return [
    `M ${cx} ${cy - outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 ${cx + offsetX} ${cy - innerRadius}`,
    "Z",
  ].join(" ");
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "").replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) {
    return `rgba(250, 204, 21, ${alpha})`;
  }
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function appendSealSymbol(planet, pentacleIndex) {
  const symbolId = buildSealSymbolId(planet, pentacleIndex);
  if (!sealDefs.select(`#${symbolId}`).empty()) {
    return symbolId;
  }

  const seed = hashString(`${planet}:${pentacleIndex}`);
  const spokeCount = 6 + (seed % 4);
  const starPoints = 5 + (seed % 3);
  const knotPoints = 7 + (seed % 4);
  const rotation = ((seed % 360) * Math.PI) / 180;
  const initial = String(planet || "?").slice(0, 1).toUpperCase();

  const symbol = sealDefs
    .append("symbol")
    .attr("id", symbolId)
    .attr("viewBox", `0 0 ${SEAL_SPRITE_SIZE} ${SEAL_SPRITE_SIZE}`)
    .attr("overflow", "visible");

  symbol
    .append("circle")
    .attr("class", "seal-outer")
    .attr("cx", SEAL_SPRITE_CENTER)
    .attr("cy", SEAL_SPRITE_CENTER)
    .attr("r", 43.5);

  symbol
    .append("circle")
    .attr("class", "seal-inner")
    .attr("cx", SEAL_SPRITE_CENTER)
    .attr("cy", SEAL_SPRITE_CENTER)
    .attr("r", 32);

  for (let index = 0; index < spokeCount; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / spokeCount;
    const inner = polarPoint(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, 14, angle);
    const outer = polarPoint(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, 42, angle);
    symbol
      .append("line")
      .attr("class", "seal-line")
      .attr("x1", inner.x)
      .attr("y1", inner.y)
      .attr("x2", outer.x)
      .attr("y2", outer.y);
  }

  symbol
    .append("path")
    .attr("class", "seal-star")
    .attr("d", buildAlternatingPolygonPath(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, starPoints, 27, 11, rotation));

  symbol
    .append("path")
    .attr("class", "seal-knot")
    .attr("d", buildAlternatingPolygonPath(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, knotPoints, 18, 8, rotation / 2));

  symbol
    .append("text")
    .attr("class", "seal-initial")
    .attr("x", SEAL_SPRITE_CENTER)
    .attr("y", 23)
    .attr("text-anchor", "middle")
    .text(initial);

  symbol
    .append("text")
    .attr("class", "seal-index")
    .attr("x", SEAL_SPRITE_CENTER)
    .attr("y", 86)
    .attr("text-anchor", "middle")
    .text(String(pentacleIndex));

  return symbolId;
}

function ensureSealSymbols(flatPentacles) {
  (flatPentacles || []).forEach((entry, index) => {
    const planet = entry?.planet || "unknown";
    const pentacleIndex = Number.isFinite(entry?.pentacle?.index)
      ? entry.pentacle.index
      : index + 1;
    appendSealSymbol(planet, pentacleIndex);
  });
}

function buildPlanetarySealGlyphData(groups, outerRadius) {
  const ringData = computeRingLayout(groups || []);
  const innerRadius = Math.max(0, outerRadius - RING_THICKNESS.planetary);
  const centroidArc = d3
    .arc()
    .innerRadius(innerRadius + 6)
    .outerRadius(outerRadius - 6);
  const glyphs = [];

  ringData.forEach((group) => {
    const pentacles = Array.isArray(group.pentacles) ? group.pentacles : [];
    const count = pentacles.length;
    if (!count) {
      return;
    }

    const segmentSpan = group.endAngle - group.startAngle;
    pentacles.forEach((pentacle, index) => {
      const sectionStart = group.startAngle + (segmentSpan * index) / count;
      const sectionEnd = group.startAngle + (segmentSpan * (index + 1)) / count;
      const [x, y] = centroidArc.centroid({
        startAngle: sectionStart,
        endAngle: sectionEnd,
      });
      const radius = Math.hypot(x, y);
      const sectionArcLength = radius * Math.max(0.02, sectionEnd - sectionStart);
      const size = Math.max(13, Math.min(28, sectionArcLength * 0.58));
      const pentacleIndex = Number.isFinite(pentacle?.index) ? pentacle.index : index + 1;
      const groupKey = slugifyIdPart(group.name || "");

      glyphs.push({
        key: `${String(group.name || "").toLowerCase()}-${pentacleIndex}`,
        planet: group.name || "Unknown",
        groupKey,
        pentacleIndex,
        focus: pentacle?.focus || "",
        x,
        y,
        size,
        symbolId: appendSealSymbol(group.name || "unknown", pentacleIndex),
      });
    });
  });

  return glyphs;
}

function drawPlanetarySealGlyphs(groups, outerRadius) {
  const glyphs = buildPlanetarySealGlyphData(groups, outerRadius);
  const selection = planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .data(glyphs, (entry) => entry.key)
    .join("use")
    .attr("class", "ring-seal-glyph")
    .attr("href", (entry) => `#${entry.symbolId}`)
    .attr("x", (entry) => entry.x - entry.size / 2)
    .attr("y", (entry) => entry.y - entry.size / 2)
    .attr("width", (entry) => entry.size)
    .attr("height", (entry) => entry.size);

  updatePlanetarySealGlyphVisibility();

  bindTooltip(
    selection,
    (entry) => `Seal of ${entry.planet} #${entry.pentacleIndex}${entry.focus ? ` — ${entry.focus}` : ""}`
  );
}

function updatePlanetarySealGlyphVisibility() {
  planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .classed("visible", (entry) => Boolean(hoveredPlanetaryKey) && entry.groupKey === hoveredPlanetaryKey);
}

function updateActivePlanetarySealGlyph(activePentacle) {
  const activeKey = getPentacleKey(activePentacle);
  planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .classed("active", (entry) => Boolean(activeKey) && entry.key === activeKey);
}

function formatPsalmReference(entry) {
  if (!entry) {
    return "";
  }
  const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
  if (Number.isNaN(chapter)) {
    return "";
  }
  const verseLabel = entry.verses ? `:${entry.verses}` : "";
  return `PS ${chapter}${verseLabel}`;
}

function renderCircularGlyphs(group, text, radius, color, startAngle = -105, endAngle = 105) {
  const glyphs = String(text || "")
    .split("")
    .filter(Boolean)
    .map((value, index, array) => {
      const divisor = Math.max(array.length - 1, 1);
      return {
        value,
        angle: startAngle + ((endAngle - startAngle) * index) / divisor,
      };
    });

  group
    .selectAll("text")
    .data(glyphs)
    .join("text")
    .attr("class", "dynamic-pentacle-scripture-glyph")
    .attr("fill", color)
    .attr(
      "transform",
      (entry) => `rotate(${entry.angle} 0 0) translate(0 ${-radius}) rotate(${entry.angle > 90 || entry.angle < -90 ? 180 : 0})`
    )
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.value);
}

function renderRingSymbols(group, symbols, radius, color) {
  const entries = (symbols || []).map((value, index, array) => ({
    value,
    angle: -45 + (360 * index) / Math.max(array.length, 1),
  }));

  group
    .selectAll("text")
    .data(entries)
    .join("text")
    .attr("class", "dynamic-pentacle-symbol")
    .attr("fill", color)
    .attr("transform", (entry) => `rotate(${entry.angle} 0 0) translate(0 ${-radius})`)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.value);
}

function renderPentacleGeometry(group, config) {
  const accent = config.color;
  const geometryLayer = group.append("g").attr("class", "dynamic-pentacle-geometry");

  if (config.centerShape === "hexagram") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildAlternatingPolygonPath(0, 0, 6, 30, 13));
  } else if (config.centerShape === "pentagram") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildAlternatingPolygonPath(0, 0, 5, 30, 12));
  } else if (config.centerShape === "square") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildRegularPolygonPath(0, 0, 4, 28, Math.PI / 4));
  } else if (config.centerShape === "cross") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildCrossPath(0, 0, 58, 16));
  } else if (config.centerShape === "crescent") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape dynamic-pentacle-shape--filled")
      .attr("fill", hexToRgba(accent, 0.18))
      .attr("stroke", accent)
      .attr("d", buildCrescentPath(0, 0, 28, 23, 14));
  } else {
    geometryLayer
      .append("circle")
      .attr("class", "dynamic-pentacle-shape")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 28)
      .attr("stroke", accent);
    geometryLayer
      .append("circle")
      .attr("class", "dynamic-pentacle-shape")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 16)
      .attr("stroke", accent);
    geometryLayer
      .append("line")
      .attr("class", "dynamic-pentacle-shape")
      .attr("x1", -28)
      .attr("y1", 0)
      .attr("x2", 28)
      .attr("y2", 0)
      .attr("stroke", accent);
    geometryLayer
      .append("line")
      .attr("class", "dynamic-pentacle-shape")
      .attr("x1", 0)
      .attr("y1", -28)
      .attr("x2", 0)
      .attr("y2", 28)
      .attr("stroke", accent);
  }
}

function getPentacleRenderConfig(activePentacle, pentacleData, referenceMap) {
  if (!activePentacle) {
    return null;
  }

  const key = buildPentacleDataKey(activePentacle.planet, activePentacle.pentacle.index);
  const planetSlug = slugifyIdPart(activePentacle.planet);
  const planetStyle = pentacleData?.planetStyles?.[planetSlug] || {};
  const pentacleRecord = pentacleData?.pentacles?.[key] || {};
  const referenceRecord = referenceMap.get(getPentacleKey(activePentacle));
  const scriptureRef = formatPsalmReference(getPrimaryPsalmEntry(referenceRecord)) || "PSALM";

  return {
    key,
    planetSlug,
    color: planetStyle.color || "#f8fafc",
    centerShape: pentacleRecord.centerShape || planetStyle.centerShape || "circle_grid",
    symbols: pentacleRecord.symbols || planetStyle.symbols || [planetStyle.glyph || activePentacle.planet.slice(0, 1).toUpperCase()],
    glyph: planetStyle.glyph || activePentacle.planet.slice(0, 1).toUpperCase(),
    virtue: pentacleRecord.virtue || planetStyle.virtue || activePentacle.planet,
    scriptureRef,
  };
}

function renderDynamicPentacle(group, config) {
  group.selectAll("*").remove();
  group.attr("class", `dynamic-pentacle planet-${config.planetSlug}`);

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--outer")
    .attr("r", 74)
    .attr("stroke", hexToRgba(config.color, 0.95));

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--text")
    .attr("r", 62)
    .attr("stroke", hexToRgba(config.color, 0.8));

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--inner")
    .attr("r", 47)
    .attr("stroke", hexToRgba(config.color, 0.72));

  renderCircularGlyphs(
    group.append("g").attr("class", "dynamic-pentacle-scripture-ring"),
    config.scriptureRef,
    62,
    hexToRgba(config.color, 0.92)
  );

  renderRingSymbols(
    group.append("g").attr("class", "dynamic-pentacle-symbol-ring"),
    config.symbols,
    50,
    hexToRgba(config.color, 0.95)
  );

  renderPentacleGeometry(group, config);

  group
    .append("text")
    .attr("class", "dynamic-pentacle-planet-glyph")
    .attr("fill", hexToRgba(config.color, 0.96))
    .attr("x", 0)
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .text(config.glyph);

  group
    .append("text")
    .attr("class", "dynamic-pentacle-virtue")
    .attr("fill", "#f8fafc")
    .attr("x", 0)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .text(String(config.virtue || "?").slice(0, 1).toUpperCase());
}

function updateActiveSealFocus(activePentacle, pentacleData, referenceMap) {
  const config = getPentacleRenderConfig(activePentacle, pentacleData, referenceMap);
  const nextKey = config?.key || null;

  if (nextKey === lastActiveSealFocusKey) {
    return;
  }
  lastActiveSealFocusKey = nextKey;

  activeSealFocusGroup.selectAll("*").remove();
  if (!config) {
    return;
  }

  const preview = activeSealFocusGroup
    .append("g")
    .attr("class", "active-seal-preview")
    .attr("transform", "translate(0, 0)");

  preview
    .append("circle")
    .attr("class", "active-seal-focus-halo")
    .attr("r", 86)
    .attr("stroke", hexToRgba(config.color, 0.38));

  renderDynamicPentacle(preview.append("g").attr("class", "active-seal-dynamic"), config);

  preview
    .append("circle")
    .attr("class", "active-seal-focus-ring")
    .attr("r", 80)
    .attr("stroke", hexToRgba(config.color, 0.8));
}

function positionTooltip(event) {
  const [x, y] = d3.pointer(event, clockWrapper.node());
  tooltip.style("left", `${x}px`).style("top", `${y}px`);
}

function bindTooltip(selection, formatter) {
  selection
    .on("mouseenter", (event, d) => {
      tooltip.text(formatter(d)).classed("visible", true);
      positionTooltip(event);
    })
    .on("mousemove", (event) => {
      positionTooltip(event);
    })
    .on("mouseleave", () => {
      tooltip.classed("visible", false);
    });
}

function drawArcRing(layerName, items, outerRadius, color, tooltipFormatter) {
  const data = computeRingLayout(items);
  const innerRadius = Math.max(0, outerRadius - (RING_THICKNESS[layerName] || 70));
  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .padAngle(layerName === "spirit" ? 0.002 : 0.01)
    .cornerRadius(layerName === "spirit" ? 2 : 4);

  const group = ringGroups[layerName];
  const selection = group
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("class", `ring-path ring-${layerName}`)
    .attr("d", arc)
    .attr("fill", color)
    .attr("fill-opacity", layerName === "spirit" ? 0.55 : 0.38)
    .attr("stroke", "rgba(12, 19, 33, 0.9)")
    .attr("stroke-width", layerName === "spirit" ? 0.5 : 1.2);

  if (tooltipFormatter) {
    bindTooltip(selection, tooltipFormatter);
  }

  if (layerName === "planetary") {
    selection
      .attr("data-planetary-key", (entry) => slugifyIdPart(entry?.name || ""))
      .on("mouseenter.seal-hover", (_event, entry) => {
        hoveredPlanetaryKey = slugifyIdPart(entry?.name || "");
        updatePlanetarySealGlyphVisibility();
      })
      .on("mouseleave.seal-hover", () => {
        hoveredPlanetaryKey = null;
        updatePlanetarySealGlyphVisibility();
      });
  }

  return data;
}

function drawCore(coreInfo, radius, color) {
  const group = ringGroups.core;
  group
    .selectAll("circle")
    .data([coreInfo])
    .join("circle")
    .attr("r", radius)
    .attr("fill", color)
    .attr("fill-opacity", 0.18)
    .attr("stroke", color)
    .attr("stroke-width", 2);

  centerGroup.raise();
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(now) {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - startOfYear) / MS_PER_DAY);
}

function getDayProgress(now) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (now - startOfDay) / MS_PER_DAY;
}

function getWeekFraction(now) {
  const hoursIntoDay =
    now.getHours() + (now.getMinutes() + (now.getSeconds() + now.getMilliseconds() / 1000) / 60) / 60;
  return ((now.getDay() + hoursIntoDay / 24) / 7) % 1;
}

function getPlanetaryDayLabel(now) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const planetaryRulers = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const index = now.getDay();
  return {
    dayText: dayNames[index],
    rulerText: planetaryRulers[index],
  };
}

function flattenPentacles(groups) {
  const flat = [];
  groups.forEach((group, groupIndex) => {
    (group.pentacles || []).forEach((pentacle, pentacleIndex) => {
      flat.push({
        groupIndex,
        pentacleIndex,
        planet: group.name,
        pentacle,
        group,
      });
    });
  });
  return flat;
}

function fractionToRotation(fraction, count) {
  if (!count || count <= 0) {
    return -Math.PI / 2;
  }
  const segment = (Math.PI * 2) / count;
  return -(fraction * Math.PI * 2) - Math.PI / 2 + segment / 2;
}

function highlightLayer(layerName, activeIndex) {
  const paths = ringGroups[layerName].selectAll("path");
  paths.classed("active", (_, index) => index === activeIndex);
}

function updateCenterLabels(coreName, timeState, referenceMap, now, derived, lifeState) {
  if (!timeState) {
    return;
  }

  const { dayLabel, clockText, active } = timeState;
  const hourRule = getPlanetaryHourRuler(now, dayLabel.rulerText);
  const pentacleKey = getPentacleKey(active.pentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(pentacleRecord);
  const readablePsalm = formatReadablePsalmReference(primaryPsalm);
  const wisdom = WISDOM_CONTENT_BY_RULER[dayLabel.rulerText];
  const correspondences = PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {};
  const ritualThemes = Array.isArray(active.planetary?.themes) && active.planetary.themes.length
    ? active.planetary.themes.join(" • ")
    : null;
  const weeklyEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);
  const modePresentation = getModePresentation(timeState, referenceMap, now, derived, lifeState);

  centerDayLabel.text(`${dayLabel.dayText} – ${dayLabel.rulerText} • ${clockText}`);

  if (modePresentation) {
    centerTitleLabel.text(modePresentation.centerTitle);
    centerSpiritLabel.text(modePresentation.centerSpirit);
    centerPentacleLabel.text(modePresentation.centerPentacle);
    return;
  }

  if (uiState.lens === "scripture") {
    centerTitleLabel.text(readablePsalm || coreName);
    centerSpiritLabel.text(wisdom?.ref ? `Wisdom anchor • ${wisdom.ref}` : "Scripture lens");
    centerPentacleLabel.text(
      active.pentacle
        ? `Mapped via ${active.pentacle.planet} #${active.pentacle.pentacle.index} • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
        : "No active pentacle mapping available."
    );
    return;
  }

  if (uiState.lens === "ritual") {
    centerTitleLabel.text(hourRule?.ruler ? `Hour of ${hourRule.ruler}` : coreName);
    centerSpiritLabel.text(ritualThemes ? `Themes • ${ritualThemes}` : "Ritual lens");
    centerPentacleLabel.text(
      active.pentacle?.pentacle?.focus
        ? `Practice focus • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
        : "Practice focus unavailable."
    );
    return;
  }

  if (uiState.lens === "esoteric") {
    centerTitleLabel.text(
      [correspondences.angel, correspondences.metal].filter(Boolean).join(" • ") || coreName
    );
    centerSpiritLabel.text(
      active.spirit
        ? `${active.spirit.zodiac} ${active.spirit.degrees} • ${active.spirit.spirit} (${active.spirit.rank})`
        : "No active spirit sector."
    );
    centerPentacleLabel.text(
      [correspondences.color, active.pentacle ? `${active.pentacle.planet} #${active.pentacle.pentacle.index}` : ""]
        .filter(Boolean)
        .join(" • ") || "Esoteric lens"
    );
    return;
  }

  if (uiState.lens === "history") {
    centerTitleLabel.text(weeklyEntry.dateLabel);
    centerSpiritLabel.text(`${weeklyEntry.rulerText} • ${weeklyEntry.psalmRef}`);
    centerPentacleLabel.text(toSnippet(weeklyEntry.focus, 76));
    return;
  }

  centerTitleLabel.text(coreName);
  if (active.spirit) {
    centerSpiritLabel.text(
      `${active.spirit.zodiac} ${active.spirit.degrees} • ${active.spirit.spirit}`
    );
  } else {
    centerSpiritLabel.text("");
  }

  if (active.pentacle) {
    centerPentacleLabel.text(
      `Pentacle of ${active.pentacle.planet} #${active.pentacle.pentacle.index}: ${active.pentacle.pentacle.focus}`
    );
  } else {
    centerPentacleLabel.text("");
  }
}

function updateDailyGuidance(timeState) {
  if (!drawerElements.guidanceDay || !drawerElements.guidanceTone || !drawerElements.guidanceList) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const key = `${dayText}-${rulerText}`;

  if (key === lastGuidanceKey) {
    return;
  }
  lastGuidanceKey = key;

  const guidance = PLANETARY_DAY_GUIDANCE[rulerText];
  drawerElements.guidanceDay.textContent = `${dayText} (${rulerText})`;
  drawerElements.guidanceTone.textContent =
    guidance?.tone || "Use this day for steady, intentional progress with focused attention.";

  drawerElements.guidanceList.innerHTML = "";
  const activities = guidance?.activities || ["Review priorities.", "Do one high-value task deeply.", "End with reflection."];
  activities.forEach((activity) => {
    const li = document.createElement("li");
    li.textContent = activity;
    drawerElements.guidanceList.appendChild(li);
  });
}

function buildWeeklyArcEntry(baseDate, offset, derived, referenceMap) {
  const target = new Date(baseDate);
  target.setHours(12, 0, 0, 0);
  target.setDate(target.getDate() + offset);

  const dayLabel = getPlanetaryDayLabel(target);
  const guidance = PLANETARY_DAY_GUIDANCE[dayLabel.rulerText];
  const wisdom = WISDOM_CONTENT_BY_RULER[dayLabel.rulerText];

  const weekFraction = derived.planetaryGroupCount ? getWeekFraction(target) : 0;
  const pentacleIndex = derived.totalPentacles
    ? Math.floor(weekFraction * derived.totalPentacles) % derived.totalPentacles
    : -1;
  const activePentacle = pentacleIndex >= 0 ? derived.flatPentacles[pentacleIndex] : null;
  const pentacleKey = getPentacleKey(activePentacle);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const psalmRef = (() => {
    if (primaryPsalm) {
      const chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
      const verseLabel = primaryPsalm.verses ? `:${primaryPsalm.verses}` : "";
      return `Psalm ${chapter}${verseLabel}`;
    }
    const fallback = FALLBACK_DAILY_PSALM_BY_RULER[dayLabel.rulerText] || { chapter: 1, verse: 1 };
    return `Psalm ${fallback.chapter}:${fallback.verse}`;
  })();

  return {
    isToday: offset === 0,
    dateLabel: target.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    rulerText: dayLabel.rulerText,
    pentacleLabel: activePentacle
      ? `${activePentacle.planet} #${activePentacle.pentacle.index}`
      : "Unavailable",
    focus: activePentacle?.pentacle?.focus || "Focus unavailable",
    tone: guidance?.tone || "Steady, practical action is favored.",
    psalmRef,
    wisdomRef: wisdom?.ref || "Proverbs 16:3",
  };
}

function updateWeeklyArcPanel(now, derived, referenceMap) {
  if (
    !drawerElements.weeklyArcList ||
    !drawerElements.weeklyArcPrev ||
    !drawerElements.weeklyArcNext ||
    !drawerElements.weeklyArcToday
  ) {
    return;
  }

  const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}|${selectedDayOffset}`;
  if (key === lastWeeklyArcKey) {
    return;
  }
  lastWeeklyArcKey = key;

  drawerElements.weeklyArcToday.disabled = selectedDayOffset === 0;

  const entry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);

  drawerElements.weeklyArcList.innerHTML = "";
  const li = document.createElement("li");
  if (entry.isToday) {
    li.classList.add("today");
  }

  const dayLine = document.createElement("p");
  dayLine.classList.add("weekly-arc-day");
  dayLine.textContent = `${entry.dateLabel} (${entry.rulerText})${entry.isToday ? " • Today" : ""}`;
  li.appendChild(dayLine);

  const pentacleLine = document.createElement("p");
  pentacleLine.classList.add("weekly-arc-pentacle");
  pentacleLine.textContent = `Pentacle ${entry.pentacleLabel}`;
  li.appendChild(pentacleLine);

  const focusLine = document.createElement("p");
  focusLine.classList.add("weekly-arc-focus");
  focusLine.textContent = entry.focus;
  li.appendChild(focusLine);

  const citationLine = document.createElement("p");
  citationLine.classList.add("weekly-arc-citation");
  citationLine.textContent = `${entry.psalmRef} • ${entry.wisdomRef}`;
  li.appendChild(citationLine);

  drawerElements.weeklyArcList.appendChild(li);
}

function updateDailyProfile(timeState) {
  if (
    !drawerElements.profileDay ||
    !drawerElements.profilePentacle ||
    !drawerElements.profileFocus ||
    !drawerElements.profileColor ||
    !drawerElements.profileMetal ||
    !drawerElements.profileAngel
  ) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleId = activePentacle
    ? `${activePentacle.planet}-${activePentacle.pentacle.index}`
    : "none";
  const key = `${dayText}-${rulerText}-${pentacleId}`;
  if (key === lastProfileKey) {
    return;
  }
  lastProfileKey = key;

  const correspondences = PLANETARY_CORRESPONDENCES[rulerText] || {
    color: "Unspecified",
    metal: "Unspecified",
    angel: "Unspecified",
  };

  drawerElements.profileDay.textContent = `${dayText} ruled by ${rulerText}`;
  drawerElements.profilePentacle.textContent = activePentacle
    ? `Active pentacle: ${activePentacle.planet} #${activePentacle.pentacle.index}`
    : "Active pentacle: unavailable";
  drawerElements.profileFocus.textContent = activePentacle?.pentacle?.focus
    ? `Suggested focus: ${activePentacle.pentacle.focus}`
    : "Suggested focus: center attention on deliberate, disciplined action.";
  drawerElements.profileColor.textContent = correspondences.color;
  drawerElements.profileMetal.textContent = correspondences.metal;
  drawerElements.profileAngel.textContent = correspondences.angel;
}

function getLifeWheelSeedScores(lifeConfig) {
  const scores = {};
  (lifeConfig?.domains || []).forEach((domain) => {
    scores[domain.id] = Math.max(0, Math.min(100, Number(domain.seedScore) || 0));
  });
  return scores;
}

function loadLifeWheelScores(lifeConfig) {
  const seeds = getLifeWheelSeedScores(lifeConfig);
  const storageKey = String(lifeConfig?.storageKey || "").trim();

  if (!storageKey || typeof window === "undefined" || !window.localStorage) {
    return seeds;
  }

  try {
    const storedRaw = window.localStorage.getItem(storageKey);
    if (!storedRaw) {
      window.localStorage.setItem(storageKey, JSON.stringify(seeds));
      return seeds;
    }

    const stored = JSON.parse(storedRaw);
    const merged = { ...seeds };
    Object.keys(seeds).forEach((domainId) => {
      if (Object.prototype.hasOwnProperty.call(stored, domainId)) {
        merged[domainId] = Math.max(0, Math.min(100, Number(stored[domainId]) || seeds[domainId]));
      }
    });
    return merged;
  } catch (_error) {
    return seeds;
  }
}

function getLifeDomainShortLabel(domainId, fallbackName) {
  return {
    mind: "Mind",
    body: "Body",
    relationships: "Relations",
    stewardship: "Steward",
    vocation: "Vocation",
    household: "Home",
    contemplation: "Contempl.",
  }[domainId] || fallbackName || domainId;
}

function resolveLifeWheelFocusDomain(timeState, lifeConfig) {
  const focusText = [
    timeState?.active?.pentacle?.pentacle?.focus || "",
    timeState?.active?.planetary?.themes?.join(" ") || "",
    timeState?.active?.spirit?.spirit || "",
    timeState?.active?.spirit?.zodiac || "",
  ]
    .join(" ")
    .trim();

  const keywordMatch = LIFE_DOMAIN_FOCUS_KEYWORDS.find((entry) => entry.pattern.test(focusText));
  if (keywordMatch) {
    return keywordMatch.domain;
  }

  const rulerText = timeState?.dayLabel?.rulerText || "";
  const planetFocus = lifeConfig?.planetFocus?.[rulerText];
  if (planetFocus) {
    return planetFocus;
  }

  return lifeConfig?.domains?.[0]?.id || "mind";
}

function getLifeWheelState(timeState, lifeConfig) {
  if (!lifeConfig || !Array.isArray(lifeConfig.domains) || !lifeConfig.domains.length) {
    return null;
  }

  const scores = loadLifeWheelScores(lifeConfig);
  const focusDomainId = resolveLifeWheelFocusDomain(timeState, lifeConfig);
  const domains = lifeConfig.domains.map((domain) => ({
    ...domain,
    score: scores[domain.id] ?? 50,
    shortLabel: getLifeDomainShortLabel(domain.id, domain.name),
  }));

  const weakestDomain = domains.reduce((lowest, candidate) => {
    if (!lowest || candidate.score < lowest.score) {
      return candidate;
    }
    return lowest;
  }, null);
  const focusedDomain = domains.find((domain) => domain.id === focusDomainId) || domains[0];

  return {
    domains,
    focusedDomain,
    weakestDomain,
  };
}

function updateLifeWheel(timeState, radii, lifeConfig) {
  const lifeState = getLifeWheelState(timeState, lifeConfig);
  if (!lifeState) {
    lifeWheelGroup.selectAll("*").remove();
    return null;
  }

  const key = [
    lifeState.focusedDomain?.id || "none",
    lifeState.weakestDomain?.id || "none",
    ...lifeState.domains.map((domain) => `${domain.id}:${domain.score}`),
  ].join("|");

  if (key === lastLifeWheelKey) {
    return lifeState;
  }
  lastLifeWheelKey = key;

  lifeWheelGroup.selectAll("*").remove();

  const outerRadius = radii.celestial - 6;
  const innerRadius = Math.max(0, radii.celestial - 70);
  const labelRadius = radii.celestial + 18;
  const rotationDegrees = -65;
  const segmentStep = (Math.PI * 2) / lifeState.domains.length;
  const pad = 0.03;

  const segmentData = lifeState.domains.map((domain, index) => {
    const startAngle = degreesToRadians(rotationDegrees) + index * segmentStep + pad / 2;
    const endAngle = degreesToRadians(rotationDegrees) + (index + 1) * segmentStep - pad / 2;
    const midAngle = (startAngle + endAngle) / 2;
    const scoreOuterRadius = innerRadius + ((outerRadius - innerRadius) * domain.score) / 100;
    const labelPoint = polarPoint(0, 0, labelRadius, midAngle);
    return {
      ...domain,
      startAngle,
      endAngle,
      midAngle,
      scoreOuterRadius,
      labelPoint,
      isFocused: domain.id === lifeState.focusedDomain?.id,
      isWeakest: domain.id === lifeState.weakestDomain?.id,
    };
  });

  const trackArc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(8);
  const fillArc = d3.arc().innerRadius(innerRadius).cornerRadius(8);
  const group = lifeWheelGroup.append("g").attr("class", "life-wheel");

  const segments = group
    .selectAll("g.life-wheel-segment")
    .data(segmentData, (domain) => domain.id)
    .join("g")
    .attr("class", (domain) => [
      "life-wheel-segment",
      domain.isFocused ? "is-focused" : "",
      domain.isWeakest ? "is-weakest" : "",
    ].filter(Boolean).join(" "));

  segments
    .append("path")
    .attr("class", "life-wheel-track")
    .attr("d", (domain) => trackArc(domain))
    .attr("fill", "rgba(15, 23, 42, 0.46)")
    .attr("stroke", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.78 : 0.34))
    .attr("stroke-width", (domain) => (domain.isFocused ? 1.8 : 1));

  segments
    .append("path")
    .attr("class", "life-wheel-fill")
    .attr("d", (domain) => fillArc({
      ...domain,
      outerRadius: domain.scoreOuterRadius,
    }))
    .attr("fill", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.52 : 0.34))
    .attr("stroke", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.92 : 0.64))
    .attr("stroke-width", (domain) => (domain.isFocused ? 1.4 : 1));

  segments
    .filter((domain) => domain.isWeakest)
    .append("circle")
    .attr("class", "life-wheel-weakness-dot")
    .attr("cx", (domain) => polarPoint(0, 0, outerRadius + 6, domain.midAngle).x)
    .attr("cy", (domain) => polarPoint(0, 0, outerRadius + 6, domain.midAngle).y)
    .attr("r", 3.6)
    .attr("fill", "#fca5a5")
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.1);

  const labels = group
    .selectAll("g.life-wheel-label")
    .data(segmentData, (domain) => domain.id)
    .join("g")
    .attr("class", "life-wheel-label")
    .attr("transform", (domain) => `translate(${domain.labelPoint.x}, ${domain.labelPoint.y})`);

  labels
    .append("text")
    .attr("class", "life-wheel-label-name")
    .attr("fill", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.96 : 0.82))
    .attr("text-anchor", (domain) => (Math.abs(domain.labelPoint.x) < 14 ? "middle" : domain.labelPoint.x > 0 ? "start" : "end"))
    .attr("y", -2)
    .text((domain) => domain.shortLabel);

  labels
    .append("text")
    .attr("class", "life-wheel-label-score")
    .attr("fill", "#cbd5f5")
    .attr("text-anchor", (domain) => (Math.abs(domain.labelPoint.x) < 14 ? "middle" : domain.labelPoint.x > 0 ? "start" : "end"))
    .attr("y", 10)
    .text((domain) => `${domain.score}%`);

  bindTooltip(
    segments,
    (domain) => {
      const status = domain.isFocused
        ? "Current focus"
        : domain.isWeakest
          ? "Weakest domain"
          : "Life domain";
      return `${domain.name} • ${domain.score}% • ${domain.virtue} • ${status}`;
    }
  );

  return lifeState;
}

function updateHistoryPreview(now, derived, referenceMap, outerRadius) {
  const previewOffsets = [-3, -2, -1, 0, 1, 2, 3];
  const entries = previewOffsets.map((offset) => {
    const entry = buildWeeklyArcEntry(now, selectedDayOffset + offset, derived, referenceMap);
    const angleDegrees = -90 + offset * 24;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const point = polarPoint(0, 0, outerRadius, angleRadians);
    const color = hexToRgba(
      {
        Sun: "#facc15",
        Moon: "#cbd5f5",
        Mars: "#ef4444",
        Mercury: "#f59e0b",
        Jupiter: "#60a5fa",
        Venus: "#34d399",
        Saturn: "#a78bfa",
      }[entry.rulerText] || "#cbd5f5",
      offset === 0 ? 0.95 : 0.78
    );

    return {
      ...entry,
      offset,
      x: point.x,
      y: point.y,
      color,
      shortLabel: entry.dateLabel.split(" ").slice(0, 2).join(" "),
    };
  });

  const selection = historyPreviewGroup
    .selectAll("g.history-node")
    .data(entries, (entry) => `${entry.dateLabel}-${entry.offset}`)
    .join((enter) => {
      const group = enter.append("g").attr("class", "history-node");
      group.append("circle").attr("class", "history-node-dot");
      group.append("text").attr("class", "history-node-label").attr("text-anchor", "middle");
      return group;
    })
    .attr("transform", (entry) => `translate(${entry.x}, ${entry.y})`)
    .classed("is-selected", (entry) => entry.offset === 0)
    .classed("is-today", (entry) => entry.isToday);

  selection
    .select("circle.history-node-dot")
    .attr("r", (entry) => (entry.offset === 0 ? 7 : 5))
    .attr("fill", (entry) => entry.color)
    .attr("stroke", "#0f172a")
    .attr("stroke-width", (entry) => (entry.offset === 0 ? 2 : 1.4));

  selection
    .select("text.history-node-label")
    .attr("y", -11)
    .attr("fill", (entry) => (entry.offset === 0 ? "#f8fafc" : "#cbd5f5"))
    .attr("font-size", (entry) => (entry.offset === 0 ? 11 : 10))
    .text((entry) => entry.shortLabel);

  bindTooltip(
    selection,
    (entry) => `${entry.dateLabel} • ${entry.rulerText} • ${entry.focus}`
  );
}

function updateScriptureOverlay(timeState, referenceMap, now, radii) {
  scriptureOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "scripture" || !timeState?.dayLabel) {
    return;
  }

  const activePentacle = timeState.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord)) || "Psalm Mapping";
  const wisdomRef = WISDOM_CONTENT_BY_RULER[timeState.dayLabel.rulerText]?.ref || "Wisdom Anchor";
  const bandColor = "#facc15";
  const outerRadius = radii.core + 34;
  const innerRadius = radii.core + 18;
  const topPathId = "scripture-overlay-arc-top";
  const bottomPathId = "scripture-overlay-arc-bottom";

  const defsSelection = scriptureOverlayGroup.append("defs");
  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerRadius, 206, 334));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerRadius, 26, 154));

  const bandLayer = scriptureOverlayGroup.append("g").attr("class", "scripture-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "scripture-overlay-arc scripture-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerRadius - 6,
      outerRadius: outerRadius + 6,
      startAngle: degreesToRadians(206),
      endAngle: degreesToRadians(334),
    }))
    .attr("fill", hexToRgba(bandColor, 0.12))
    .attr("stroke", hexToRgba(bandColor, 0.86))
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "scripture-overlay-arc scripture-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerRadius - 5,
      outerRadius: innerRadius + 5,
      startAngle: degreesToRadians(26),
      endAngle: degreesToRadians(154),
    }))
    .attr("fill", "rgba(250, 204, 21, 0.07)")
    .attr("stroke", "rgba(253, 230, 138, 0.74)")
    .attr("stroke-width", 1.05);

  const markers = [
    { degrees: 206, radius: outerRadius, emphasis: true },
    { degrees: 334, radius: outerRadius, emphasis: true },
    { degrees: 26, radius: innerRadius, emphasis: false },
    { degrees: 154, radius: innerRadius, emphasis: false },
  ];

  scriptureOverlayGroup
    .append("g")
    .attr("class", "scripture-overlay-markers")
    .selectAll("circle")
    .data(markers)
    .join("circle")
    .attr("class", "scripture-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.2 : 2.4))
    .attr("fill", (entry) => (entry.emphasis ? "#fef08a" : "#fde68a"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.2);

  const textLayer = scriptureOverlayGroup.append("g").attr("class", "scripture-overlay-text-layer");

  const topText = textLayer
    .append("text")
    .attr("class", "scripture-overlay-text scripture-overlay-text--primary")
    .attr("fill", "#fef3c7");
  topText
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(`${primaryPsalm} • PRIMARY`);

  const bottomText = textLayer
    .append("text")
    .attr("class", "scripture-overlay-text scripture-overlay-text--secondary")
    .attr("fill", "#fde68a");
  bottomText
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(`${wisdomRef} • WISDOM`);

  const focusLabelPoint = polarPoint(0, 0, outerRadius + 16, degreesToRadians(-90));
  scriptureOverlayGroup
    .append("text")
    .attr("class", "scripture-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Scripture Band");
}

function updateRitualOverlay(timeState, now, radii) {
  ritualOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "ritual" || !timeState?.dayLabel) {
    return;
  }

  const hourRule = getPlanetaryHourRuler(now, timeState.dayLabel.rulerText);
  const dayText = `${timeState.dayLabel.dayText.toUpperCase()} • ${timeState.dayLabel.rulerText.toUpperCase()} DAY`;
  const themeText = Array.isArray(timeState.active?.planetary?.themes) && timeState.active.planetary.themes.length
    ? timeState.active.planetary.themes.slice(0, 2).join(" • ").toUpperCase()
    : "TIMING";
  const hourText = `HOUR OF ${(hourRule?.ruler || "UNKNOWN").toUpperCase()} • ${themeText}`;
  const bandColor = "#60a5fa";
  const outerTextRadius = radii.planetary - 18;
  const innerTextRadius = radii.planetary - 50;
  const timingRadius = radii.planetary + 10;
  const topPathId = "ritual-overlay-arc-top";
  const bottomPathId = "ritual-overlay-arc-bottom";
  const defsSelection = ritualOverlayGroup.append("defs");

  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerTextRadius, 206, 334));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerTextRadius, 24, 156));

  const bandLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "ritual-overlay-arc ritual-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerTextRadius - 7,
      outerRadius: outerTextRadius + 7,
      startAngle: degreesToRadians(206),
      endAngle: degreesToRadians(334),
    }))
    .attr("fill", "rgba(96, 165, 250, 0.12)")
    .attr("stroke", "rgba(96, 165, 250, 0.82)")
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "ritual-overlay-arc ritual-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerTextRadius - 6,
      outerRadius: innerTextRadius + 6,
      startAngle: degreesToRadians(24),
      endAngle: degreesToRadians(156),
    }))
    .attr("fill", "rgba(147, 197, 253, 0.1)")
    .attr("stroke", "rgba(191, 219, 254, 0.78)")
    .attr("stroke-width", 1.05);

  const timingLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-timing");
  const currentHourIndex = Number.isFinite(hourRule?.hourIndex) ? hourRule.hourIndex : 0;
  const hourSteps = d3.range(24).map((hourIndex) => {
    const degrees = -90 + hourIndex * 15;
    const isCurrent = hourIndex === currentHourIndex;
    const isNext = hourIndex === (currentHourIndex + 1) % 24;
    return {
      hourIndex,
      degrees,
      isCurrent,
      isNext,
      isMinor: !isCurrent && !isNext,
    };
  });

  timingLayer
    .selectAll("line")
    .data(hourSteps)
    .join("line")
    .attr("class", (entry) => {
      if (entry.isCurrent) {
        return "ritual-overlay-tick ritual-overlay-tick--current";
      }
      if (entry.isNext) {
        return "ritual-overlay-tick ritual-overlay-tick--next";
      }
      return "ritual-overlay-tick ritual-overlay-tick--minor";
    })
    .attr("x1", (entry) => polarPoint(0, 0, timingRadius - (entry.isMinor ? 2 : 5), degreesToRadians(entry.degrees)).x)
    .attr("y1", (entry) => polarPoint(0, 0, timingRadius - (entry.isMinor ? 2 : 5), degreesToRadians(entry.degrees)).y)
    .attr("x2", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 13 : entry.isNext ? 9 : 4), degreesToRadians(entry.degrees)).x)
    .attr("y2", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 13 : entry.isNext ? 9 : 4), degreesToRadians(entry.degrees)).y);

  timingLayer
    .selectAll("circle")
    .data(hourSteps.filter((entry) => entry.isCurrent || entry.isNext))
    .join("circle")
    .attr("class", (entry) => entry.isCurrent ? "ritual-overlay-hour-dot ritual-overlay-hour-dot--current" : "ritual-overlay-hour-dot ritual-overlay-hour-dot--next")
    .attr("cx", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 18 : 13), degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 18 : 13), degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => entry.isCurrent ? 4 : 3);

  ritualOverlayGroup
    .append("g")
    .attr("class", "ritual-overlay-markers")
    .selectAll("circle")
    .data([
      { degrees: 206, radius: outerTextRadius, emphasis: true },
      { degrees: 334, radius: outerTextRadius, emphasis: true },
      { degrees: 24, radius: innerTextRadius, emphasis: false },
      { degrees: 156, radius: innerTextRadius, emphasis: false },
    ])
    .join("circle")
    .attr("class", "ritual-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.1 : 2.3))
    .attr("fill", (entry) => (entry.emphasis ? "#bfdbfe" : "#dbeafe"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.15);

  const textLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-text-layer");

  textLayer
    .append("text")
    .attr("class", "ritual-overlay-text ritual-overlay-text--primary")
    .attr("fill", "#dbeafe")
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(dayText);

  textLayer
    .append("text")
    .attr("class", "ritual-overlay-text ritual-overlay-text--secondary")
    .attr("fill", "#bfdbfe")
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(hourText);

  const focusLabelPoint = polarPoint(0, 0, outerTextRadius + 18, degreesToRadians(-90));
  ritualOverlayGroup
    .append("text")
    .attr("class", "ritual-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Ritual Window");

  const windowLabelPoint = polarPoint(0, 0, timingRadius + 28, degreesToRadians(90));
  ritualOverlayGroup
    .append("text")
    .attr("class", "ritual-overlay-caption ritual-overlay-caption--secondary")
    .attr("x", windowLabelPoint.x)
    .attr("y", windowLabelPoint.y)
    .attr("text-anchor", "middle")
    .text(`Now ${String(currentHourIndex).padStart(2, "0")}:00 • Next ${String((currentHourIndex + 1) % 24).padStart(2, "0")}:00`);
}

function updateEsotericOverlay(timeState, radii, derived) {
  esotericOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "esoteric" || !timeState?.dayLabel || !timeState?.active?.spirit) {
    return;
  }

  const activeSpirit = timeState.active.spirit;
  const correspondences = PLANETARY_CORRESPONDENCES[timeState.dayLabel.rulerText] || {};
  const activePentacle = timeState.active?.pentacle || null;
  const bandColor = "#c4b5fd";
  const outerTextRadius = radii.spirit - 16;
  const innerTextRadius = radii.spirit - 44;
  const beaconRadius = radii.spirit + 18;
  const segmentDegrees = derived?.spiritCount ? 360 / derived.spiritCount : 5;
  const ringRotationDegrees = derived?.spiritCount
    ? radiansToDegrees(fractionToRotation(timeState.fractions.spirit, derived.spiritCount))
    : -90;
  const activeCenterDegrees = ringRotationDegrees + ((timeState.indices.spirit + 0.5) * segmentDegrees);
  const activeRadians = degreesToRadians(activeCenterDegrees);
  const topPathId = "esoteric-overlay-arc-top";
  const bottomPathId = "esoteric-overlay-arc-bottom";
  const defsSelection = esotericOverlayGroup.append("defs");

  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerTextRadius, 214, 326));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerTextRadius, 34, 146));

  const bandLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "esoteric-overlay-arc esoteric-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerTextRadius - 7,
      outerRadius: outerTextRadius + 7,
      startAngle: degreesToRadians(214),
      endAngle: degreesToRadians(326),
    }))
    .attr("fill", "rgba(196, 181, 253, 0.11)")
    .attr("stroke", "rgba(196, 181, 253, 0.84)")
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "esoteric-overlay-arc esoteric-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerTextRadius - 6,
      outerRadius: innerTextRadius + 6,
      startAngle: degreesToRadians(34),
      endAngle: degreesToRadians(146),
    }))
    .attr("fill", "rgba(221, 214, 254, 0.09)")
    .attr("stroke", "rgba(233, 213, 255, 0.74)")
    .attr("stroke-width", 1.05);

  const markers = [
    { degrees: 214, radius: outerTextRadius, emphasis: true },
    { degrees: 326, radius: outerTextRadius, emphasis: true },
    { degrees: 34, radius: innerTextRadius, emphasis: false },
    { degrees: 146, radius: innerTextRadius, emphasis: false },
  ];

  esotericOverlayGroup
    .append("g")
    .attr("class", "esoteric-overlay-markers")
    .selectAll("circle")
    .data(markers)
    .join("circle")
    .attr("class", "esoteric-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.1 : 2.3))
    .attr("fill", (entry) => (entry.emphasis ? "#ede9fe" : "#ddd6fe"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.15);

  const textLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-text-layer");
  const primaryText = `${String(activeSpirit.spirit || "Spirit").toUpperCase()} • ${String(activeSpirit.rank || "Rank").toUpperCase()} • SECTOR ${activeSpirit.sector}`;
  const secondaryParts = [
    `${String(activeSpirit.zodiac || "").toUpperCase()} ${String(activeSpirit.degrees || "").toUpperCase()}`.trim(),
    correspondences.angel ? `ANGEL ${String(correspondences.angel).toUpperCase()}` : "",
    correspondences.metal ? `METAL ${String(correspondences.metal).toUpperCase()}` : "",
  ].filter(Boolean);
  const secondaryText = secondaryParts.join(" • ");

  textLayer
    .append("text")
    .attr("class", "esoteric-overlay-text esoteric-overlay-text--primary")
    .attr("fill", "#ede9fe")
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(primaryText);

  textLayer
    .append("text")
    .attr("class", "esoteric-overlay-text esoteric-overlay-text--secondary")
    .attr("fill", "#ddd6fe")
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(secondaryText);

  const activeLineStart = polarPoint(0, 0, radii.spirit - 8, activeRadians);
  const activeLineEnd = polarPoint(0, 0, beaconRadius, activeRadians);
  const activeDot = polarPoint(0, 0, beaconRadius + 6, activeRadians);
  const activeLabel = polarPoint(0, 0, beaconRadius + 34, activeRadians);
  const labelAnchor = activeLabel.x >= 12 ? "start" : activeLabel.x <= -12 ? "end" : "middle";
  const pentacleLabel = activePentacle
    ? `${activePentacle.planet.toUpperCase()} ${activePentacle.pentacle.index}`
    : "ACTIVE PENTACLE";

  const beaconLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-beacon");

  beaconLayer
    .append("line")
    .attr("class", "esoteric-overlay-beacon-line")
    .attr("x1", activeLineStart.x)
    .attr("y1", activeLineStart.y)
    .attr("x2", activeLineEnd.x)
    .attr("y2", activeLineEnd.y)
    .attr("stroke", hexToRgba(bandColor, 0.92))
    .attr("stroke-width", 1.8);

  beaconLayer
    .append("circle")
    .attr("class", "esoteric-overlay-beacon-dot")
    .attr("cx", activeDot.x)
    .attr("cy", activeDot.y)
    .attr("r", 4.2)
    .attr("fill", "#ede9fe")
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.2);

  beaconLayer
    .append("text")
    .attr("class", "esoteric-overlay-caption esoteric-overlay-caption--beacon")
    .attr("x", activeLabel.x)
    .attr("y", activeLabel.y)
    .attr("text-anchor", labelAnchor)
    .text(pentacleLabel);

  const badgeEntries = [
    {
      text: `${String(activeSpirit.spirit || "Spirit").toUpperCase()} • ${String(activeSpirit.rank || "Rank").toUpperCase()}`,
      radius: radii.spirit - 92,
      angle: -144,
      color: "#e9d5ff",
    },
    {
      text: [correspondences.angel, correspondences.metal].filter(Boolean).join(" • ").toUpperCase() || "ANGEL • METAL",
      radius: radii.spirit - 92,
      angle: -36,
      color: "#ddd6fe",
    },
    {
      text: [
        correspondences.color ? String(correspondences.color).toUpperCase() : "",
        activePentacle ? `${activePentacle.planet.toUpperCase()} ${activePentacle.pentacle.index}` : "",
      ].filter(Boolean).join(" • ") || "COLOR • PENTACLE",
      radius: radii.spirit - 98,
      angle: 34,
      color: "#c4b5fd",
    },
  ];

  const badgeNodes = esotericOverlayGroup
    .append("g")
    .attr("class", "esoteric-overlay-badges")
    .selectAll("g")
    .data(badgeEntries)
    .join("g")
    .attr("class", "esoteric-overlay-badge")
    .attr("transform", (entry) => {
      const point = polarPoint(0, 0, entry.radius, degreesToRadians(entry.angle));
      return `translate(${point.x}, ${point.y})`;
    });

  badgeNodes
    .append("rect")
    .attr("class", "esoteric-overlay-badge-pill")
    .attr("x", (entry) => -(Math.max(92, entry.text.length * 5.8) / 2))
    .attr("y", -10)
    .attr("width", (entry) => Math.max(92, entry.text.length * 5.8))
    .attr("height", 20)
    .attr("rx", 10)
    .attr("fill", "rgba(15, 23, 42, 0.82)")
    .attr("stroke", (entry) => hexToRgba(entry.color, 0.88))
    .attr("stroke-width", 1.1);

  badgeNodes
    .append("text")
    .attr("class", "esoteric-overlay-badge-text")
    .attr("fill", (entry) => hexToRgba(entry.color, 0.96))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.text);

  const focusLabelPoint = polarPoint(0, 0, outerTextRadius + 18, degreesToRadians(-90));
  esotericOverlayGroup
    .append("text")
    .attr("class", "esoteric-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Esoteric Band");
}

function setReadingDepth(nextDepth) {
  const normalized = String(nextDepth || "").toLowerCase();
  if (!READING_DEPTHS.has(normalized) || normalized === readingDepth) {
    return;
  }
  readingDepth = normalized;
  lastPsalmKey = null;
}

function setupReadingDepthControls() {
  if (!drawerElements.depthButtons.length) {
    return;
  }

  drawerElements.depthButtons.forEach((button) => {
    const buttonDepth = String(button.dataset.depth || "").toLowerCase();
    if (!READING_DEPTHS.has(buttonDepth)) {
      return;
    }

    const isActive = buttonDepth === readingDepth;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.addEventListener("click", () => {
      setReadingDepth(buttonDepth);
      drawerElements.depthButtons.forEach((candidate) => {
        const candidateDepth = String(candidate.dataset.depth || "").toLowerCase();
        const active = candidateDepth === readingDepth;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  });
}

function setSelectedDayOffset(nextOffset) {
  const normalized = Number.parseInt(nextOffset, 10);
  if (Number.isNaN(normalized) || normalized === selectedDayOffset) {
    return;
  }
  selectedDayOffset = normalized;
  lastWeeklyArcKey = null;
}

function shiftSelectedDay(delta) {
  const step = Number.parseInt(delta, 10);
  if (Number.isNaN(step) || step === 0) {
    return;
  }
  setSelectedDayOffset(selectedDayOffset + step);
}

function withSelectedDayOffset(now) {
  if (!selectedDayOffset) {
    return now;
  }
  const shifted = new Date(now);
  shifted.setDate(shifted.getDate() + selectedDayOffset);
  return shifted;
}

function setupWeeklyArcControls() {
  if (!drawerElements.weeklyArcPrev || !drawerElements.weeklyArcNext || !drawerElements.weeklyArcToday) {
    return;
  }

  drawerElements.weeklyArcPrev.addEventListener("click", () => {
    shiftSelectedDay(-1);
  });
  drawerElements.weeklyArcNext.addEventListener("click", () => {
    shiftSelectedDay(1);
  });
  drawerElements.weeklyArcToday.addEventListener("click", () => {
    setSelectedDayOffset(0);
  });
}

function getPentacleKey(activePentacle) {
  if (!activePentacle) {
    return null;
  }
  return `${activePentacle.planet.toLowerCase()}-${activePentacle.pentacle.index}`;
}

function getPlanetaryHourRuler(now, dayRuler) {
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
  if (startIndex < 0) {
    return null;
  }
  const hourIndex = now.getHours();
  return {
    hourIndex,
    ruler: CHALDEAN_ORDER[(startIndex + hourIndex) % CHALDEAN_ORDER.length],
  };
}

function getNextPlanetaryHourRuler(now, dayRuler) {
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
  if (startIndex < 0) {
    return null;
  }
  const nextHourIndex = (now.getHours() + 1) % 24;
  return {
    hourIndex: nextHourIndex,
    ruler: CHALDEAN_ORDER[(startIndex + nextHourIndex) % CHALDEAN_ORDER.length],
  };
}

function getPrimaryPsalmEntry(record) {
  if (!record || !Array.isArray(record.psalms)) {
    return null;
  }
  return record.psalms.find((entry) => {
    const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
    return !Number.isNaN(chapter);
  }) || null;
}

function formatReadablePsalmReference(entry) {
  if (!entry) {
    return null;
  }

  const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
  if (Number.isNaN(chapter)) {
    return null;
  }

  const verseLabel = entry.verses ? `:${entry.verses}` : "";
  return `Psalm ${chapter}${verseLabel}`;
}

function toSnippet(text, maxLength = 220) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function withTerminalPunctuation(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function sentenceCase(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

function buildRuleOfLife(timeState, referenceMap, now, derived, lifeState) {
  const focused = lifeState?.focusedDomain;
  const weakest = lifeState?.weakestDomain;
  if (!focused) {
    return null;
  }

  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const readablePsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const focusTemplates = RULE_OF_LIFE_LIBRARY[focused.id] || RULE_OF_LIFE_LIBRARY.mind;
  const weakestTemplates = RULE_OF_LIFE_LIBRARY[weakest?.id] || focusTemplates;
  const tone = RULE_OF_LIFE_DAY_TONES[dayLabel?.rulerText] || "with steadiness";
  const pentacleFocus = activePentacle?.pentacle?.focus
    ? sentenceCase(activePentacle.pentacle.focus.toLowerCase())
    : "";
  const repairLine = weakest
    ? `Repair ${weakest.name.toLowerCase()} before the day closes.`
    : "Keep the whole wheel in view before the day closes.";

  const morning = `${focusTemplates.morning} Begin ${tone}.`;
  const middayBase = weakest && weakest.id !== focused.id
    ? weakestTemplates.repair
    : focusTemplates.midday;
  const midday = `${middayBase}${pentacleFocus ? ` Let ${pentacleFocus.toLowerCase()} govern the hard moment.` : ""}`;
  const evening = `${focusTemplates.evening}${readablePsalm ? ` Close with ${readablePsalm}.` : ""}`;
  const summary = weakest
    ? `${dayLabel?.rulerText || "Today"} leans toward ${focused.name.toLowerCase()} through ${focused.virtue.toLowerCase()}. ${repairLine}`
    : `${dayLabel?.rulerText || "Today"} leans toward ${focused.name.toLowerCase()} through ${focused.virtue.toLowerCase()}.`;

  return {
    virtue: focused.virtue,
    domain: focused.name,
    focusedDomain: focused.name,
    weakestDomain: weakest?.name || null,
    weakestScore: weakest?.score ?? null,
    summary: withTerminalPunctuation(summary),
    morning: withTerminalPunctuation(morning),
    midday: withTerminalPunctuation(midday),
    evening: withTerminalPunctuation(evening),
    repairNote: repairLine,
    anchor: readablePsalm || (activePentacle?.pentacle?.focus ? sentenceCase(activePentacle.pentacle.focus) : ""),
  };
}

function updateRuleOfLifePanels(rule) {
  const key = rule
    ? [rule.virtue, rule.domain, rule.morning, rule.midday, rule.evening].join("|")
    : "none";

  if (key === lastRuleOfLifeKey) {
    return;
  }
  lastRuleOfLifeKey = key;

  const showRule = Boolean(rule);

  if (drawerElements.surfaceRule) {
    drawerElements.surfaceRule.hidden = !showRule;
  }
  if (drawerElements.ruleSection) {
    drawerElements.ruleSection.hidden = !showRule;
  }

  if (!showRule) {
    return;
  }

  if (drawerElements.surfaceRuleVirtue) {
    drawerElements.surfaceRuleVirtue.textContent = rule.virtue;
  }
  if (drawerElements.surfaceRuleDomain) {
    drawerElements.surfaceRuleDomain.textContent = rule.domain;
  }
  if (drawerElements.surfaceRuleMorning) {
    drawerElements.surfaceRuleMorning.textContent = rule.morning;
  }
  if (drawerElements.surfaceRuleMidday) {
    drawerElements.surfaceRuleMidday.textContent = rule.midday;
  }
  if (drawerElements.surfaceRuleEvening) {
    drawerElements.surfaceRuleEvening.textContent = rule.evening;
  }

  if (drawerElements.ruleVirtue) {
    drawerElements.ruleVirtue.textContent = rule.virtue;
  }
  if (drawerElements.ruleDomain) {
    drawerElements.ruleDomain.textContent = rule.domain;
  }
  if (drawerElements.ruleMorning) {
    drawerElements.ruleMorning.textContent = rule.morning;
  }
  if (drawerElements.ruleMidday) {
    drawerElements.ruleMidday.textContent = rule.midday;
  }
  if (drawerElements.ruleEvening) {
    drawerElements.ruleEvening.textContent = rule.evening;
  }
}

function getModePresentation(timeState, referenceMap, now, derived, lifeState) {
  const mode = uiState.mode;
  if (mode === "guidance") {
    return null;
  }

  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const readablePsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const wisdom = dayLabel ? WISDOM_CONTENT_BY_RULER[dayLabel.rulerText] : null;
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const nextHourRule = dayLabel ? getNextPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const todayEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);
  const tomorrowEntry = buildWeeklyArcEntry(now, selectedDayOffset + 1, derived, referenceMap);
  const yesterdayEntry = buildWeeklyArcEntry(now, selectedDayOffset - 1, derived, referenceMap);

  if (mode === "practice") {
    const ruleOfLife = buildRuleOfLife(timeState, referenceMap, now, derived, lifeState);
    return {
      centerTitle: ruleOfLife ? "Rule of Life" : "Practice Mode",
      centerSpirit: ruleOfLife
        ? `${ruleOfLife.domain} • ${ruleOfLife.virtue}`
        : "Life Wheel determines the primary practice domain.",
      centerPentacle: ruleOfLife
        ? ruleOfLife.repairNote
        : "Turn today’s focus into a concrete action.",
      surfaceLabel: "Practice Mode",
      surfaceTitle: "Rule of Life",
      surfaceBody: ruleOfLife
        ? ruleOfLife.summary
        : "Practice mode turns the active day into one concrete task.",
      ruleOfLife,
    };
  }

  if (mode === "reflection") {
    const weakest = lifeState?.weakestDomain;
    return {
      centerTitle: "Reflection",
      centerSpirit: weakest
        ? `Where did ${weakest.virtue.toLowerCase()} fail or appear in ${weakest.name.toLowerCase()} today?`
        : "Examine where your attention was most tested today.",
      centerPentacle: readablePsalm
        ? `Anchor • ${readablePsalm}`
        : "Review the day with honesty and precision.",
      surfaceLabel: "Reflection Mode",
      surfaceTitle: "Examine the Day",
      surfaceBody: weakest
        ? `Ask what strengthened or weakened ${weakest.name.toLowerCase()} today, and record one honest note.`
        : "Reflection mode turns the center toward examination rather than action.",
    };
  }

  if (mode === "mentor") {
    return {
      centerTitle: "Mentor • Solomon",
      centerSpirit: wisdom?.ref ? `Counsel anchor • ${wisdom.ref}` : "Wisdom voice",
      centerPentacle: wisdom?.text
        ? toSnippet(wisdom.text, 84)
        : "The center speaks through a wisdom voice anchored to the ruling day.",
      surfaceLabel: "Mentor Mode",
      surfaceTitle: "Solomonic Counsel",
      surfaceBody: wisdom?.text
        ? toSnippet(wisdom.text, 116)
        : "Mentor mode frames the current moment through a single guiding voice.",
    };
  }

  if (mode === "forecast") {
    return {
      centerTitle: nextHourRule?.ruler ? `Forecast • ${nextHourRule.ruler}` : "Forecast",
      centerSpirit: nextHourRule
        ? `Next hour ${String(nextHourRule.hourIndex).padStart(2, "0")}:00 • ${nextHourRule.ruler}`
        : "Preview the next movement before acting.",
      centerPentacle: tomorrowEntry?.focus
        ? `Tomorrow • ${toSnippet(tomorrowEntry.focus, 72)}`
        : "Tomorrow’s guidance will appear here.",
      surfaceLabel: "Forecast Mode",
      surfaceTitle: nextHourRule?.ruler ? `Next: ${nextHourRule.ruler}` : "Forecast",
      surfaceBody: `${tomorrowEntry.rulerText} tomorrow • ${toSnippet(tomorrowEntry.focus, 96)}`,
    };
  }

  if (mode === "timeline") {
    return {
      centerTitle: `Timeline • ${todayEntry.dateLabel}`,
      centerSpirit: `Yesterday ${yesterdayEntry.rulerText} • Tomorrow ${tomorrowEntry.rulerText}`,
      centerPentacle: `Today's arc • ${toSnippet(todayEntry.focus, 72)}`,
      surfaceLabel: "Timeline Mode",
      surfaceTitle: todayEntry.dateLabel,
      surfaceBody: `Yesterday: ${toSnippet(yesterdayEntry.focus, 52)} • Tomorrow: ${toSnippet(tomorrowEntry.focus, 52)}`,
    };
  }

  return null;
}

function updateSurfacePanel(timeState, referenceMap, now, derived, lifeState) {
  if (!drawerElements.surfaceLensLabel || !drawerElements.surfaceLensTitle || !drawerElements.surfaceLensBody) {
    return;
  }

  const lensDefinition = getLensDefinition(uiState.lens);
  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const activePlanetary = timeState?.active?.planetary || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(pentacleRecord);
  const readablePsalm = formatReadablePsalmReference(primaryPsalm);
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const wisdom = dayLabel ? WISDOM_CONTENT_BY_RULER[dayLabel.rulerText] : null;
  const correspondences = dayLabel ? (PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {}) : {};
  const weeklyEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);

  const modePresentation = getModePresentation(timeState, referenceMap, now, derived, lifeState);
  drawerElements.surfaceLensLabel.textContent = modePresentation
    ? `${lensDefinition.title} • ${modePresentation.surfaceLabel}`
    : lensDefinition.title;

  if (modePresentation) {
    drawerElements.surfaceLensTitle.textContent = modePresentation.surfaceTitle;
    drawerElements.surfaceLensBody.textContent = modePresentation.surfaceBody;
    updateRuleOfLifePanels(modePresentation.ruleOfLife || null);
    return;
  }

  updateRuleOfLifePanels(null);

  if (uiState.lens === "scripture") {
    drawerElements.surfaceLensTitle.textContent = readablePsalm || "Scripture Anchor";
    drawerElements.surfaceLensBody.textContent = wisdom?.ref
      ? `${wisdom.ref} stays near the center while the mapped psalm governs today’s reading.`
      : "Current scripture mapping is foregrounded on the instrument surface.";
    return;
  }

  if (uiState.lens === "ritual") {
    drawerElements.surfaceLensTitle.textContent = hourRule?.ruler
      ? `Hour of ${hourRule.ruler}`
      : "Ritual Timing";
    drawerElements.surfaceLensBody.textContent = Array.isArray(activePlanetary?.themes) && activePlanetary.themes.length
      ? activePlanetary.themes.join(" • ")
      : "Day themes and practical timing are pulled forward here.";
    return;
  }

  if (uiState.lens === "esoteric") {
    drawerElements.surfaceLensTitle.textContent = [correspondences.angel, correspondences.metal]
      .filter(Boolean)
      .join(" • ") || "Esoteric Correspondences";
    drawerElements.surfaceLensBody.textContent = activeSpirit
      ? `${activeSpirit.spirit} rules the active sector in ${activeSpirit.zodiac} ${activeSpirit.degrees}.`
      : "Symbolic correspondences are foregrounded here.";
    return;
  }

  if (uiState.lens === "history") {
    drawerElements.surfaceLensTitle.textContent = weeklyEntry.dateLabel;
    drawerElements.surfaceLensBody.textContent = `${weeklyEntry.rulerText} • ${weeklyEntry.focus}`;
    return;
  }

  if (lifeState?.focusedDomain && lifeState?.weakestDomain) {
    drawerElements.surfaceLensTitle.textContent = `${lifeState.focusedDomain.name} • ${lifeState.focusedDomain.virtue}`;
    drawerElements.surfaceLensBody.textContent = `Focus today leans toward ${lifeState.focusedDomain.name.toLowerCase()}. Weakest domain: ${lifeState.weakestDomain.name} (${lifeState.weakestDomain.score}%).`;
    return;
  }

  drawerElements.surfaceLensTitle.textContent = activePentacle
    ? `${activePentacle.planet} #${activePentacle.pentacle.index}`
    : "Current Guidance";
  drawerElements.surfaceLensBody.textContent = activePentacle?.pentacle?.focus
    ? toSnippet(activePentacle.pentacle.focus, 96)
    : "The clock surface summarizes the active day, pentacle, and spirit state.";
}

function getLensAnnotations(timeState, referenceMap, now, radii) {
  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const activePlanetary = timeState?.active?.planetary || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const correspondences = dayLabel ? (PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {}) : {};

  if (uiState.lens === "scripture") {
    return [];
  }

  if (uiState.lens === "ritual") {
    return [];
  }

  if (uiState.lens === "esoteric") {
    return [];
  }

  if (uiState.lens === "history") {
    return [
      { text: "Past", radius: radii.spirit + 52, angle: -138, color: "#4ade80" },
      { text: "Today", radius: radii.spirit + 52, angle: -90, color: "#86efac" },
      { text: "Next", radius: radii.spirit + 52, angle: -42, color: "#bbf7d0" },
    ];
  }

  return [];
}

function updateLensAnnotations(timeState, referenceMap, now, radii) {
  const annotations = getLensAnnotations(timeState, referenceMap, now, radii);
  lensAnnotationGroup.selectAll("*").remove();

  if (!annotations.length) {
    return;
  }

  const nodes = lensAnnotationGroup
    .selectAll("g.lens-annotation")
    .data(annotations)
    .join("g")
    .attr("class", "lens-annotation")
    .attr("transform", (entry) => {
      const point = polarPoint(0, 0, entry.radius, (entry.angle * Math.PI) / 180);
      return `translate(${point.x}, ${point.y})`;
    });

  nodes
    .append("rect")
    .attr("class", "lens-annotation-pill")
    .attr("x", (entry) => -(Math.max(48, entry.text.length * 6.3) / 2))
    .attr("y", -10)
    .attr("width", (entry) => Math.max(48, entry.text.length * 6.3))
    .attr("height", 20)
    .attr("rx", 10)
    .attr("fill", "rgba(15, 23, 42, 0.82)")
    .attr("stroke", (entry) => hexToRgba(entry.color, 0.85))
    .attr("stroke-width", 1.1);

  nodes
    .append("text")
    .attr("class", "lens-annotation-text")
    .attr("fill", (entry) => hexToRgba(entry.color, 0.96))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.text);
}

function updateExplainabilityPanel(now, timeState, referenceMap, psalmMetadata) {
  if (!drawerElements.explainList || !drawerElements.explainCitation) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const hourRule = getPlanetaryHourRuler(now, rulerText);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const key = [
    dayText,
    rulerText,
    pentacleKey || "none",
    activeSpirit?.sector || "none",
    hourRule?.ruler || "none",
    primaryPsalm?.number ?? primaryPsalm?.psalm ?? "none",
    primaryPsalm?.verses || "none",
  ].join("|");
  if (key === lastExplainabilityKey) {
    return;
  }
  lastExplainabilityKey = key;

  const reasons = [
    `${dayText} is ruled by ${rulerText}, so ${rulerText}-aligned intentions are prioritized.`,
  ];

  if (hourRule) {
    reasons.push(
      `Planetary hour proxy: local hour ${hourRule.hourIndex + 1} resolves to ${hourRule.ruler} in the Chaldean sequence.`
    );
  }

  if (activeSpirit) {
    reasons.push(
      `Active spirit sector: ${activeSpirit.zodiac} ${activeSpirit.degrees} (${activeSpirit.spirit}) informs the sign layer.`
    );
  }

  if (activePentacle) {
    reasons.push(
      `Active pentacle rule: ${activePentacle.planet} #${activePentacle.pentacle.index} (${activePentacle.pentacle.focus}).`
    );
  }

  if (primaryPsalm) {
    const chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
    const verseLabel = primaryPsalm.verses ? `:${primaryPsalm.verses}` : "";
    reasons.push(`Primary scripture citation: Psalm ${chapter}${verseLabel}.`);
  } else {
    reasons.push("Primary scripture citation: fallback psalm is used when this pentacle has no direct Psalm note.");
  }

  drawerElements.explainList.innerHTML = "";
  reasons.forEach((reason) => {
    const li = document.createElement("li");
    li.textContent = reason;
    drawerElements.explainList.appendChild(li);
  });

  const sourceLabel = psalmMetadata?.source || "Key of Solomon mapping";
  if (primaryPsalm) {
    const chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
    const verseLabel = primaryPsalm.verses ? `:${primaryPsalm.verses}` : "";
    drawerElements.explainCitation.textContent = `Citation source: ${sourceLabel} • Psalm ${chapter}${verseLabel}.`;
    return;
  }

  const supplementalSource = record?.supplementalReferences?.[0]?.source_path;
  drawerElements.explainCitation.textContent = supplementalSource
    ? `Citation source: ${sourceLabel} • Supplemental note: ${supplementalSource}`
    : `Citation source: ${sourceLabel}`;
}

function updateDailyContentBundle(timeState, referenceMap, psalmMetadata) {
  if (
    !drawerElements.bundlePsalmRef ||
    !drawerElements.bundlePsalmText ||
    !drawerElements.bundleWisdomRef ||
    !drawerElements.bundleWisdomText ||
    !drawerElements.bundleSolomonicRef ||
    !drawerElements.bundleSolomonicText
  ) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const key = `${dayText}|${rulerText}|${pentacleKey || "none"}|${primaryPsalm?.number ?? primaryPsalm?.psalm ?? "fallback"}|${primaryPsalm?.verses || "none"}`;
  if (key === lastBundleKey) {
    return;
  }
  lastBundleKey = key;

  const requestId = ++currentBundleRequestId;
  const wisdom = WISDOM_CONTENT_BY_RULER[rulerText] || {
    ref: "Proverbs 16:3",
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
  };
  drawerElements.bundleWisdomRef.textContent = wisdom.ref;
  drawerElements.bundleWisdomText.textContent = wisdom.text;

  if (activePentacle) {
    drawerElements.bundleSolomonicRef.textContent = `Key of Solomon, Book II • ${activePentacle.planet} Pentacle #${activePentacle.pentacle.index}`;
    drawerElements.bundleSolomonicText.textContent = activePentacle.pentacle.focus
      ? `Purpose: ${activePentacle.pentacle.focus}.`
      : "Purpose unavailable for this pentacle.";
  } else {
    drawerElements.bundleSolomonicRef.textContent = "Key of Solomon, Book II";
    drawerElements.bundleSolomonicText.textContent = "No active pentacle focus available.";
  }

  let chapter = Number.NaN;
  let verse = null;
  let citationMode = "mapped";
  if (primaryPsalm) {
    chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
    verse = expandVerseSpecification(primaryPsalm.verses || "")[0] || null;
  }
  if (Number.isNaN(chapter)) {
    const fallback = FALLBACK_DAILY_PSALM_BY_RULER[rulerText] || { chapter: 1, verse: 1 };
    chapter = fallback.chapter;
    verse = String(fallback.verse);
    citationMode = "fallback";
  }

  const verseLabel = verse ? `:${verse}` : "";
  const sourceLabel = psalmMetadata?.source || "Key of Solomon mapping";
  drawerElements.bundlePsalmRef.textContent = citationMode === "mapped"
    ? `Psalm ${chapter}${verseLabel} (${sourceLabel})`
    : `Psalm ${chapter}${verseLabel} (day-ruler fallback)`;
  drawerElements.bundlePsalmText.textContent = "Loading psalm excerpt…";

  retrievePsalmText(chapter, verse).then((text) => {
    if (requestId !== currentBundleRequestId) {
      return;
    }
    const snippet = toSnippet(text);
    drawerElements.bundlePsalmText.textContent = snippet || "No psalm text returned.";
  }).catch((error) => {
    console.error("Failed to fetch daily bundle psalm excerpt", error);
    if (requestId !== currentBundleRequestId) {
      return;
    }
    drawerElements.bundlePsalmText.textContent = "Unable to fetch psalm excerpt.";
  });
}

function computeTimeState(now, layers, derived) {
  const yearLength = isLeapYear(now.getFullYear()) ? 366 : 365;
  const dayIndex = getDayOfYear(now);
  const dayProgress = getDayProgress(now);
  const yearFraction = (dayIndex + dayProgress) / yearLength;
  const spiritFraction = derived.spiritCount ? (yearFraction % 1) : 0;
  const weekFraction = derived.planetaryGroupCount ? getWeekFraction(now) : 0;
  const yearsSinceEpoch = now.getFullYear() - 2000 + yearFraction;
  const celestialFraction = derived.celestialCount ? ((yearsSinceEpoch % 9) / 9) : 0;

  const spiritIndex = derived.spiritCount
    ? Math.floor(spiritFraction * derived.spiritCount) % derived.spiritCount
    : -1;
  const planetaryIndex = derived.planetaryGroupCount
    ? Math.floor(weekFraction * derived.planetaryGroupCount) % derived.planetaryGroupCount
    : -1;
  const celestialIndex = derived.celestialCount
    ? Math.floor(celestialFraction * derived.celestialCount) % derived.celestialCount
    : -1;

  const pentacleIndex = derived.totalPentacles
    ? Math.floor(weekFraction * derived.totalPentacles) % derived.totalPentacles
    : -1;

  const clockText = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dayLabel = getPlanetaryDayLabel(now);

  return {
    fractions: {
      spirit: spiritFraction,
      planetary: weekFraction,
      celestial: celestialFraction,
    },
    indices: {
      spirit: spiritIndex,
      planetary: planetaryIndex,
      celestial: celestialIndex,
      pentacle: pentacleIndex,
    },
    active: {
      spirit: spiritIndex >= 0 ? layers.spirit.sectors[spiritIndex] : null,
      planetary: planetaryIndex >= 0 ? layers.planetary.groups[planetaryIndex] : null,
      celestial: celestialIndex >= 0 ? layers.celestial.seals[celestialIndex] : null,
      pentacle: pentacleIndex >= 0 ? derived.flatPentacles[pentacleIndex] : null,
    },
    clockText,
    dayLabel,
  };
}

function buildPentacleReferenceMap(psalmPayload) {
  const map = new Map();
  if (!psalmPayload || !Array.isArray(psalmPayload.pentacles)) {
    return map;
  }

  psalmPayload.pentacles.forEach(({ planet, pentacle, psalms, supplemental_references: supplementalReferences }) => {
    if (!planet || typeof pentacle !== "number") {
      return;
    }
    const key = `${planet.toLowerCase()}-${pentacle}`;
    map.set(key, {
      psalms: Array.isArray(psalms) ? psalms : [],
      supplementalReferences: Array.isArray(supplementalReferences) ? supplementalReferences : [],
    });
  });

  return map;
}

function buildBundledPsalmMap(scripturePayload) {
  bundledPsalmMap.clear();
  const psalms = scripturePayload?.psalms;
  if (!psalms || typeof psalms !== "object") {
    return bundledPsalmMap;
  }

  Object.entries(psalms).forEach(([key, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const chapter = Number.parseInt(entry.psalm_number_vulgate ?? key, 10);
    if (Number.isNaN(chapter)) {
      return;
    }
    bundledPsalmMap.set(String(chapter), entry);
  });

  return bundledPsalmMap;
}

function getBundledPsalmText(chapter) {
  const entry = bundledPsalmMap.get(String(chapter));
  if (!entry) {
    return null;
  }

  const excerpt = String(entry.translation_excerpt || entry.latin_excerpt || "").trim();
  return excerpt || null;
}

function updatePsalmDrawer(activePentacle, referenceMap) {
  let pentacleKey = null;
  if (activePentacle) {
    pentacleKey = `${activePentacle.planet.toLowerCase()}-${activePentacle.pentacle.index}`;
  }
  const key = `${pentacleKey || "none"}|${readingDepth}`;

  if (key === lastPsalmKey) {
    return;
  }
  lastPsalmKey = key;
  const requestId = ++currentPsalmRequestId;

  if (!drawerElements.planet || !drawerElements.focus || !drawerElements.list) {
    return;
  }

  drawerElements.list.innerHTML = "";

  if (!activePentacle || !pentacleKey) {
    drawerElements.planet.textContent = "—";
    drawerElements.focus.textContent = "Select a pentacle to view its verses.";
    const li = document.createElement("li");
    li.textContent = "No pentacle selected.";
    drawerElements.list.appendChild(li);
    return;
  }

  drawerElements.planet.textContent = `Pentacle of ${activePentacle.planet} #${activePentacle.pentacle.index}`;
  drawerElements.focus.textContent = activePentacle.pentacle.focus || "Purpose unavailable";

  const record = referenceMap.get(pentacleKey);
  const psalms = record?.psalms || [];
  if (!psalms.length) {
    const li = document.createElement("li");
    li.textContent = "No psalms cited for this pentacle in the Key of Solomon notes.";
    drawerElements.list.appendChild(li);
    return;
  }

  psalms.forEach((entry) => {
    const li = document.createElement("li");
    const psalmNumber = Number.parseInt(entry.number ?? entry.psalm, 10);
    if (Number.isNaN(psalmNumber)) {
      li.textContent = "Psalm reference missing a numeric chapter value.";
      drawerElements.list.appendChild(li);
      return;
    }
    const verseLabel = entry.verses ? `:${entry.verses}` : "";
    li.textContent = `Psalm ${psalmNumber}${verseLabel}`;

    const modeLabel = document.createElement("span");
    if (readingDepth === "long") {
      modeLabel.textContent = "Reading mode: full chapter";
    } else if (readingDepth === "medium") {
      modeLabel.textContent = "Reading mode: 3-5 verses";
    } else {
      modeLabel.textContent = "Reading mode: single verse";
    }
    li.appendChild(modeLabel);

    const textBlock = document.createElement("div");
    textBlock.classList.add("psalm-text", "loading");
    textBlock.textContent = readingDepth === "long" ? "Loading chapter text…" : "Loading verse text…";
    li.appendChild(textBlock);
    drawerElements.list.appendChild(li);

    if (!entry.verses && readingDepth !== "long") {
      textBlock.classList.remove("loading");
      textBlock.textContent = "Verse reference not provided in source.";
      return;
    }

    if (readingDepth === "long") {
      retrievePsalmText(psalmNumber).then((chapterText) => {
        if (currentPsalmRequestId !== requestId) {
          return;
        }
        textBlock.classList.remove("loading");
        textBlock.textContent = chapterText || "No chapter text returned by scripture service.";
      }).catch((error) => {
        console.error("Failed to fetch psalm chapter", error);
        if (currentPsalmRequestId !== requestId) {
          return;
        }
        textBlock.classList.remove("loading");
        textBlock.classList.add("error");
        textBlock.textContent = "Unable to fetch chapter text.";
      });
      return;
    }

    const versesToFetch = selectVersesForDepth(entry.verses, readingDepth);
    if (!versesToFetch.length) {
      textBlock.classList.remove("loading");
      textBlock.textContent = "Unable to parse verse reference.";
      textBlock.classList.add("error");
      return;
    }

    Promise.allSettled(
      versesToFetch.map(async (verse) => ({
        verse,
        text: await retrievePsalmText(psalmNumber, verse),
      }))
    ).then((results) => {
      if (currentPsalmRequestId !== requestId) {
        return;
      }
      const combined = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((entryResult) => Boolean(entryResult.text))
        .map((entryResult) => `Psalm ${psalmNumber}:${entryResult.verse} ${entryResult.text}`)
        .join("\n\n");
      textBlock.classList.remove("loading");
      textBlock.textContent = combined || "No verse text returned by scripture service.";
      if (!combined) {
        textBlock.classList.add("error");
      }
    }).catch((error) => {
      console.error("Failed to fetch psalm text", error);
      if (currentPsalmRequestId !== requestId) {
        return;
      }
      textBlock.classList.remove("loading");
      textBlock.classList.add("error");
      textBlock.textContent = "Unable to fetch verse text.";
    });
  });
}

function selectVersesForDepth(spec, depth) {
  const base = expandVerseSpecification(spec);
  if (!base.length) {
    return [];
  }

  if (depth === "short") {
    return [base[0]];
  }

  if (depth !== "medium") {
    return base;
  }

  const medium = base.slice(0, 5);
  const firstVerse = Number.parseInt(base[0], 10);
  if (medium.length < 3 && !Number.isNaN(firstVerse)) {
    for (let offset = 1; medium.length < 3; offset += 1) {
      medium.push(String(firstVerse + offset));
    }
  }

  const deduped = [];
  const seen = new Set();
  medium.forEach((verse) => {
    if (!seen.has(verse)) {
      seen.add(verse);
      deduped.push(verse);
    }
  });
  return deduped.slice(0, 5);
}

function expandVerseSpecification(spec) {
  if (!spec) {
    return [];
  }

  const clean = String(spec).trim();
  if (!clean) {
    return [];
  }

  if (/^\d+(?:,\d+)+$/.test(clean)) {
    return clean
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (/^\d+(?:-\d+){2,}$/.test(clean)) {
    return clean
      .split("-")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (clean.includes("-")) {
    const [startRaw, endRaw] = clean.split("-").map((value) => value.replace(/[^0-9]/g, ""));
    const start = Number.parseInt(startRaw, 10);
    const end = Number.parseInt(endRaw, 10);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return [];
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx));
  }

  const numeric = clean.replace(/[^0-9]/g, "");
  return numeric ? [numeric] : [];
}

async function retrievePsalmText(chapter, verse) {
  const key = `${chapter}:${verse ?? ""}`;
  if (psalmTextCache.has(key)) {
    return psalmTextCache.get(key);
  }

  const bundledText = getBundledPsalmText(chapter);
  if (bundledText) {
    psalmTextCache.set(key, bundledText);
    return bundledText;
  }

  if (!ENABLE_REMOTE_SCRIPTURE_FETCH) {
    const fallbackText = verse
      ? `Psalm ${chapter}:${verse} is not bundled in this standalone clock yet.`
      : `Psalm ${chapter} is not bundled in this standalone clock yet.`;
    psalmTextCache.set(key, fallbackText);
    return fallbackText;
  }

  const params = new URLSearchParams({ chapter: String(chapter) });
  if (verse) {
    params.set("verse", String(verse));
  }
  const response = await fetch(`${PSALM_API_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  const verseText = (
    data.text ||
    (Array.isArray(data.verses) ? data.verses.map((entry) => entry.text).join("\n") : "")
  ).trim();
  psalmTextCache.set(key, verseText);
  return verseText;
}

async function initialiseClock() {
  setupLensControls();
  setupDrawerToggle();
  setupReadingDepthControls();
  setupWeeklyArcControls();

  try {
    const [clockResponse, psalmResponse, pentacleResponse, lifeDomainResponse, scriptureResponse] = await Promise.all([
      fetch("../data/solomonic_clock_full.json"),
      fetch("../data/pentacle_psalms.json"),
      fetch("../data/pentacles.json"),
      fetch("../data/life_domains.json"),
      fetch("../data/scripture_mappings.json"),
    ]);

    if (!clockResponse.ok) {
      throw new Error(`HTTP ${clockResponse.status} while loading clock data`);
    }

    if (!psalmResponse.ok) {
      throw new Error(`HTTP ${psalmResponse.status} while loading psalm data`);
    }

    if (!pentacleResponse.ok) {
      throw new Error(`HTTP ${pentacleResponse.status} while loading pentacle data`);
    }

    if (!lifeDomainResponse.ok) {
      throw new Error(`HTTP ${lifeDomainResponse.status} while loading life domain data`);
    }

    if (!scriptureResponse.ok) {
      throw new Error(`HTTP ${scriptureResponse.status} while loading scripture mappings`);
    }

    const [clockData, psalmData, pentacleData, lifeDomainData, scriptureData] = await Promise.all([
      clockResponse.json(),
      psalmResponse.json(),
      pentacleResponse.json(),
      lifeDomainResponse.json(),
      scriptureResponse.json(),
    ]);
    const referenceMap = buildPentacleReferenceMap(psalmData);
    buildBundledPsalmMap(scriptureData);

    if (psalmData?.metadata?.psalm_numbering) {
      baseDrawerSubtitleText = `Live mapping for the active planetary pentacle (${psalmData.metadata.psalm_numbering}).`;
      applyLensState();
    }

    renderClock(clockData, referenceMap, psalmData?.metadata || {}, pentacleData, lifeDomainData);
  } catch (error) {
    console.error("Failed to initialise clock", error);
    svg
      .append("text")
      .attr("x", WIDTH / 2)
      .attr("y", HEIGHT / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#ef4444")
      .attr("font-size", "20px")
      .text("Unable to load Solomonic clock data");
  }
}

function renderClock(data, referenceMap, psalmMetadata, pentacleData, lifeDomainData) {
  const { visual_parameters: visual, layers } = data;
  const colors = visual.color_scheme;
  const radii = visual.radius;

  drawCore(layers.core, radii.core - 12, colors.core);
  drawArcRing("celestial", layers.celestial.seals, radii.celestial, colors.celestial, drawCelestialTooltipText);
  drawArcRing("planetary", layers.planetary.groups, radii.planetary, colors.planetary, drawPlanetaryTooltipText);
  drawArcRing("spirit", layers.spirit.sectors, radii.spirit, colors.spirit, drawSpiritTooltipText);

  const derived = {
    spiritCount: layers.spirit.sectors.length,
    celestialCount: layers.celestial.seals.length,
    planetaryGroupCount: layers.planetary.groups.length,
  };
  derived.flatPentacles = flattenPentacles(layers.planetary.groups);
  derived.totalPentacles = derived.flatPentacles.length;
  ensureSealSymbols(derived.flatPentacles);
  drawPlanetarySealGlyphs(layers.planetary.groups, radii.planetary);

  function frame() {
    const now = new Date();
    const displayNow = withSelectedDayOffset(now);
    const timeState = computeTimeState(displayNow, layers, derived);

    const spiritRotation = fractionToRotation(timeState.fractions.spirit, derived.spiritCount);
    const planetaryRotation = fractionToRotation(timeState.fractions.planetary, derived.planetaryGroupCount);
    const celestialRotation = fractionToRotation(timeState.fractions.celestial, derived.celestialCount);

    ringGroups.spirit.attr("transform", `rotate(${radiansToDegrees(spiritRotation)})`);
    ringGroups.planetary.attr("transform", `rotate(${radiansToDegrees(planetaryRotation)})`);
    ringGroups.celestial.attr("transform", `rotate(${radiansToDegrees(celestialRotation)})`);

    highlightLayer("spirit", timeState.indices.spirit);
    highlightLayer("planetary", timeState.indices.planetary);
    highlightLayer("celestial", timeState.indices.celestial);
    updateActivePlanetarySealGlyph(timeState.active.pentacle);
    updateActiveSealFocus(timeState.active.pentacle, pentacleData, referenceMap);
    updateCenterModeControl(radii);
    updateScriptureOverlay(timeState, referenceMap, now, radii);
    updateRitualOverlay(timeState, now, radii);
    updateEsotericOverlay(timeState, radii, derived);
    const lifeState = updateLifeWheel(timeState, radii, lifeDomainData);
    updateHistoryPreview(now, derived, referenceMap, radii.spirit + 28);
    updateLensFocusOverlay(radii);
    updateLensAnnotations(timeState, referenceMap, now, radii);

    updateCenterLabels(layers.core.name, timeState, referenceMap, now, derived, lifeState);
    updateSurfacePanel(timeState, referenceMap, now, derived, lifeState);
    updateDailyGuidance(timeState);
    updateWeeklyArcPanel(now, derived, referenceMap);
    updateDailyProfile(timeState);
    updateExplainabilityPanel(displayNow, timeState, referenceMap, psalmMetadata);
    updateDailyContentBundle(timeState, referenceMap, psalmMetadata);
    updatePsalmDrawer(timeState.active.pentacle, referenceMap);

    requestAnimationFrame(frame);
  }

  frame();
}

initialiseClock();
