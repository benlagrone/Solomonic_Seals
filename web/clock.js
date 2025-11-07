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
};
let lastPsalmKey = null;
let currentPsalmRequestId = 0;
const psalmTextCache = new Map();
const PSALM_API_ENDPOINT = "http://192.168.86.23:8001/get-verse";

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

function buildPsalmMap(psalmPayload) {
  const map = new Map();
  if (!psalmPayload || !Array.isArray(psalmPayload.pentacles)) {
    return map;
  }

  psalmPayload.pentacles.forEach(({ planet, pentacle, psalms }) => {
    if (!planet || typeof pentacle !== "number") {
      return;
    }
    const key = `${planet.toLowerCase()}-${pentacle}`;
    map.set(key, Array.isArray(psalms) ? psalms : []);
  });

  return map;
}

function updatePsalmDrawer(activePentacle, psalmMap) {
  let key = null;
  if (activePentacle) {
    key = `${activePentacle.planet.toLowerCase()}-${activePentacle.pentacle.index}`;
  }

  if (key === lastPsalmKey) {
    return;
  }
  lastPsalmKey = key;
  const requestId = ++currentPsalmRequestId;

  if (!drawerElements.planet || !drawerElements.focus || !drawerElements.list) {
    return;
  }

  drawerElements.list.innerHTML = "";

  if (!activePentacle || !key) {
    drawerElements.planet.textContent = "—";
    drawerElements.focus.textContent = "Select a pentacle to view its verses.";
    const li = document.createElement("li");
    li.textContent = "No pentacle selected.";
    drawerElements.list.appendChild(li);
    return;
  }

  drawerElements.planet.textContent = `Pentacle of ${activePentacle.planet} #${activePentacle.pentacle.index}`;
  drawerElements.focus.textContent = activePentacle.pentacle.focus || "Purpose unavailable";

  const psalms = psalmMap.get(key) || [];
  if (!psalms.length) {
    const li = document.createElement("li");
    li.textContent = "No psalms cited for this pentacle in the Key of Solomon notes.";
    drawerElements.list.appendChild(li);
    return;
  }

  psalms.forEach((entry) => {
    const li = document.createElement("li");
    const psalmNumber = entry.number ?? entry.psalm ?? "?";
    const verseLabel = entry.verses ? `:${entry.verses}` : "";
    li.textContent = `Psalm ${psalmNumber}${verseLabel}`;
    if (entry.verses) {
      const span = document.createElement("span");
      const label = entry.verses.includes(":") ? "Verses" : "Verse";
      span.textContent = `${label} ${entry.verses}`;
      li.appendChild(span);
    }
    const textBlock = document.createElement("div");
    textBlock.classList.add("psalm-text", "loading");
    textBlock.textContent = "Loading verse text…";
    li.appendChild(textBlock);
    drawerElements.list.appendChild(li);

    if (!entry.verses) {
      textBlock.classList.remove("loading");
      textBlock.textContent = "Verse reference not provided in source.";
      return;
    }

    const chapter = psalmNumber;
    const versesToFetch = expandVerseSpecification(entry.verses);
    if (!versesToFetch.length) {
      textBlock.classList.remove("loading");
      textBlock.textContent = "Unable to parse verse reference.";
      textBlock.classList.add("error");
      return;
    }

    Promise.all(versesToFetch.map((verse) => retrievePsalmText(chapter, verse))).then((results) => {
      if (currentPsalmRequestId !== requestId) {
        return;
      }
      const combined = results.filter(Boolean).join("\n\n");
      textBlock.classList.remove("loading");
      textBlock.textContent = combined || "No verse text returned by scripture service.";
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

function expandVerseSpecification(spec) {
  if (!spec) {
    return [];
  }

  const clean = String(spec).trim();
  if (!clean) {
    return [];
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

  const body = {
    book: "Psalm",
    chapter: String(chapter),
    translation: "KJV",
  };
  if (verse) {
    body.verse = String(verse);
  }

  const response = await fetch(PSALM_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const textPayload = await response.text();

  const tryParse = (payload) => {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return null;
    }
  };

  let data = tryParse(textPayload);
  if (typeof data === "string") {
    data = tryParse(data);
  }

  if (!data) {
    const normalized = textPayload.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"');
    data = tryParse(normalized);
  }

  if (!data || typeof data !== "object") {
    console.error("Unable to parse scripture response", textPayload);
    throw new Error("Invalid scripture response");
  }

  const verseText = (
    data.text ||
    (Array.isArray(data.verses) ? data.verses.map((entry) => entry.text).join("\n") : "")
  ).trim();
  psalmTextCache.set(key, verseText);
  return verseText;
}

async function initialiseClock() {
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
    const psalmMap = buildPsalmMap(psalmData);

    if (drawerElements.subtitle && psalmData?.metadata?.psalm_numbering) {
      drawerElements.subtitle.textContent = `Live mapping for the active planetary pentacle (${psalmData.metadata.psalm_numbering}).`;
    }

    renderClock(clockData, psalmMap);
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

function renderClock(data, psalmMap) {
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

  function frame() {
    const now = new Date();
    const timeState = computeTimeState(now, layers, derived);

    const spiritRotation = fractionToRotation(timeState.fractions.spirit, derived.spiritCount);
    const planetaryRotation = fractionToRotation(timeState.fractions.planetary, derived.planetaryGroupCount);
    const celestialRotation = fractionToRotation(timeState.fractions.celestial, derived.celestialCount);

    ringGroups.spirit.attr("transform", `rotate(${radiansToDegrees(spiritRotation)})`);
    ringGroups.planetary.attr("transform", `rotate(${radiansToDegrees(planetaryRotation)})`);
    ringGroups.celestial.attr("transform", `rotate(${radiansToDegrees(celestialRotation)})`);

    highlightLayer("spirit", timeState.indices.spirit);
    highlightLayer("planetary", timeState.indices.planetary);
    highlightLayer("celestial", timeState.indices.celestial);

    updateCenterLabels(layers.core.name, timeState);
    updatePsalmDrawer(timeState.active.pentacle, psalmMap);

    requestAnimationFrame(frame);
  }

  frame();
}

initialiseClock();
