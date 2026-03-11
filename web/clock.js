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
const planetarySealGlyphGroup = ringGroups.planetary
  .append("g")
  .attr("class", "planetary-seal-glyphs");
const activeSealFocusGroup = ringGroups.core
  .append("g")
  .attr("class", "active-seal-focus");

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
  planet: document.querySelector(".psalm-planet"),
  focus: document.querySelector(".psalm-focus"),
  list: document.querySelector(".psalm-list"),
  subtitle: document.querySelector(".drawer-subtitle"),
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
};
let lastPsalmKey = null;
let lastGuidanceKey = null;
let lastWeeklyArcKey = null;
let lastProfileKey = null;
let lastExplainabilityKey = null;
let lastBundleKey = null;
let currentPsalmRequestId = 0;
let currentBundleRequestId = 0;
let readingDepth = "short";
let hoveredPlanetaryKey = null;
let selectedDayOffset = 0;
const psalmTextCache = new Map();
const PSALM_API_ENDPOINT = "/api/psalm";
const READING_DEPTHS = new Set(["short", "medium", "long"]);
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
  return `${entry.zodiac} ${entry.degrees} – ${entry.spirit} (${entry.rank})`;
}

function drawCelestialTooltipText(entry) {
  return `${entry.name} – ${entry.virtue}`;
}

function drawPlanetaryTooltipText(entry) {
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

function updateActiveSealFocus(activePentacle) {
  const focusData = activePentacle ? [activePentacle] : [];
  const selection = activeSealFocusGroup
    .selectAll("g.active-seal-preview")
    .data(focusData, (entry) => getPentacleKey(entry));

  const entered = selection
    .enter()
    .append("g")
    .attr("class", "active-seal-preview")
    .attr("transform", "translate(0, 0)");

  entered.append("circle").attr("class", "active-seal-focus-halo").attr("r", 86);
  entered
    .append("use")
    .attr("class", "active-seal-focus-use")
    .attr("x", -82)
    .attr("y", -82)
    .attr("width", 164)
    .attr("height", 164);
  entered.append("circle").attr("class", "active-seal-focus-ring").attr("r", 80);

  selection
    .merge(entered)
    .select("use.active-seal-focus-use")
    .attr("href", (entry) => `#${buildSealSymbolId(entry.planet, entry.pentacle.index)}`);

  selection.exit().remove();
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

function updateCenterLabels(coreName, timeState) {
  centerTitleLabel.text(coreName);

  if (!timeState) {
    return;
  }

  const { dayLabel, clockText, active } = timeState;
  centerDayLabel.text(`${dayLabel.dayText} – ${dayLabel.rulerText} • ${clockText}`);

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

function getPrimaryPsalmEntry(record) {
  if (!record || !Array.isArray(record.psalms)) {
    return null;
  }
  return record.psalms.find((entry) => {
    const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
    return !Number.isNaN(chapter);
  }) || null;
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
  setupReadingDepthControls();
  setupWeeklyArcControls();

  try {
    const [clockResponse, psalmResponse] = await Promise.all([
      fetch("../data/solomonic_clock_full.json"),
      fetch("../data/pentacle_psalms.json"),
    ]);

    if (!clockResponse.ok) {
      throw new Error(`HTTP ${clockResponse.status} while loading clock data`);
    }

    if (!psalmResponse.ok) {
      throw new Error(`HTTP ${psalmResponse.status} while loading psalm data`);
    }

    const [clockData, psalmData] = await Promise.all([clockResponse.json(), psalmResponse.json()]);
    const referenceMap = buildPentacleReferenceMap(psalmData);

    if (drawerElements.subtitle && psalmData?.metadata?.psalm_numbering) {
      drawerElements.subtitle.textContent = `Live mapping for the active planetary pentacle (${psalmData.metadata.psalm_numbering}).`;
    }

    renderClock(clockData, referenceMap, psalmData?.metadata || {});
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

function renderClock(data, referenceMap, psalmMetadata) {
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
    updateActiveSealFocus(timeState.active.pentacle);

    updateCenterLabels(layers.core.name, timeState);
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
