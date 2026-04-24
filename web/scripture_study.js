"use strict";

const PSALM_API_ENDPOINT = "/api/psalm";
const BOOK_PARTIAL_API_ENDPOINT = "/api/pericope/book-partial";
const SCRIPTURE_MAPPINGS_PATH = "/data/scripture_mappings.json";
const PENTACLE_PSALMS_PATH = "/data/pentacle_psalms.json";
const PENTACLES_PATH = "/data/pentacles.json";
const CLOCK_PATH = "/clock";
const DOC = typeof document !== "undefined" ? document : null;
const SCRIPTURE_INITIAL_FRAME_REMOTE_URL = "https://assets.pericopeai.com/scriptorium-initials/v1/frame-gold.svg";
const SCRIPTURE_INITIAL_FRAME_LOCAL_URL = "/asset-library/scriptorium-initials/v1/frame-gold.svg";
const PERICOPE_CHAT_URL = String(DOC?.body?.dataset?.pericopeChatUrl || "https://pericopeai.com/chat").trim();

function isLoopbackHost(hostname = typeof window !== "undefined" ? window.location.hostname : "") {
  const normalized = String(hostname || "").trim().toLowerCase();
  return normalized === "localhost"
    || normalized === "127.0.0.1"
    || normalized === "::1";
}

function configureScriptureInitialAssetUrl() {
  if (!DOC?.documentElement) {
    return;
  }
  const targetUrl = isLoopbackHost() ? SCRIPTURE_INITIAL_FRAME_LOCAL_URL : SCRIPTURE_INITIAL_FRAME_REMOTE_URL;
  DOC.documentElement.style.setProperty("--scripture-initial-frame-url", `url("${targetUrl}")`);
}

configureScriptureInitialAssetUrl();

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
  Sun: { chapter: 19, verse: "1" },
  Moon: { chapter: 63, verse: "6" },
  Mars: { chapter: 144, verse: "1" },
  Mercury: { chapter: 119, verse: "105" },
  Jupiter: { chapter: 112, verse: "3" },
  Venus: { chapter: 45, verse: "2" },
  Saturn: { chapter: 90, verse: "12" },
};

const STUDY_DEPTHS = ["anchor", "context", "crossrefs", "discuss"];

const elements = {
  title: DOC?.querySelector(".study-page-title"),
  primaryRef: DOC?.querySelector(".study-primary-ref"),
  originLine: DOC?.querySelector(".study-origin-line"),
  contextSummary: DOC?.querySelector(".study-context-summary"),
  contextList: DOC?.querySelector(".study-context-list"),
  depthButtons: Array.from(DOC?.querySelectorAll("[data-depth-button]") || []),
  depthPanels: Array.from(DOC?.querySelectorAll("[data-depth-panel]") || []),
  anchorHeading: DOC?.querySelector(".study-anchor-heading"),
  readingStatus: DOC?.querySelector(".study-reading-status"),
  anchorText: DOC?.querySelector(".study-anchor-text"),
  whyText: DOC?.querySelector(".study-why-text"),
  whyList: DOC?.querySelector(".study-why-list"),
  contextHeading: DOC?.querySelector(".study-context-heading"),
  contextStatus: DOC?.querySelector(".study-context-status"),
  expandedText: DOC?.querySelector(".study-expanded-text"),
  pairedRef: DOC?.querySelector(".study-paired-ref"),
  pairedText: DOC?.querySelector(".study-paired-text"),
  pairedLink: DOC?.querySelector(".study-paired-link"),
  solomonicTitle: DOC?.querySelector(".study-solomonic-title"),
  solomonicText: DOC?.querySelector(".study-solomonic-text"),
  relatedPentacles: DOC?.querySelector(".study-related-pentacles"),
  themeList: DOC?.querySelector(".study-theme-list"),
  sourceLinks: DOC?.querySelector(".study-source-links"),
  crossrefList: DOC?.querySelector(".study-crossref-list"),
  prompts: DOC?.querySelector(".study-prompts"),
  practiceText: DOC?.querySelector(".study-practice-text"),
  reflectionText: DOC?.querySelector(".study-reflection-text"),
  carryPromptText: DOC?.querySelector(".study-carry-prompt-text"),
  discussButton: DOC?.querySelector(".study-discuss-button"),
  discussPanelButton: DOC?.querySelector(".study-discuss-panel-button"),
  discussTitle: DOC?.querySelector(".study-discuss-title"),
};

function sentenceCase(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

function lowerSentence(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return `${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
}

function sanitizeInlinePassageText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPassageBlockText(text) {
  const blocks = [];
  let currentVerse = "";

  const flushVerse = () => {
    const clean = currentVerse.replace(/\s+/g, " ").trim();
    if (clean) {
      blocks.push(clean);
    }
    currentVerse = "";
  };

  String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (/^chapter\s+\d+\b/i.test(line)) {
        flushVerse();
        blocks.push(line);
        return;
      }

      if (/^\d+\s+/.test(line)) {
        flushVerse();
        currentVerse = line;
        return;
      }

      if (currentVerse) {
        currentVerse = `${currentVerse} ${line}`;
        return;
      }

      blocks.push(line.replace(/\s+/g, " "));
    });

  flushVerse();
  return blocks.join("\n\n").trim();
}

function splitScriptureInitialText(text) {
  const value = String(text || "");
  let prefix = "";
  let remainder = value;

  const chapterMatch = remainder.match(/^(\s*chapter\s+\d+\b[^\n]*\n+\n*)/i);
  if (chapterMatch) {
    prefix = chapterMatch[1];
    remainder = remainder.slice(prefix.length);
  }

  const initialIndex = remainder.search(/[A-Za-z]/);
  if (initialIndex < 0) {
    return null;
  }

  return {
    prefix: prefix + remainder.slice(0, initialIndex),
    initial: remainder.charAt(initialIndex),
    suffix: remainder.slice(initialIndex + 1),
  };
}

function renderScriptureBlock(element, text, { decorate = true, compact = false } = {}) {
  if (!element) {
    return;
  }

  const value = String(text || "");
  const parts = splitScriptureInitialText(value);
  const shouldDecorate = decorate && parts && value.trim().length > 12;

  element.textContent = "";
  element.classList.toggle("scripture-illumination", Boolean(shouldDecorate));
  element.classList.toggle("scripture-illumination--compact", Boolean(shouldDecorate && compact));
  element.classList.toggle("has-illuminated-initial", Boolean(shouldDecorate));

  if (!shouldDecorate || !parts) {
    element.textContent = value;
    return;
  }

  if (parts.prefix) {
    element.appendChild(document.createTextNode(parts.prefix));
  }

  const initial = document.createElement("span");
  initial.className = "illuminated-initial";
  initial.textContent = parts.initial;
  element.appendChild(initial);

  if (parts.suffix) {
    element.appendChild(document.createTextNode(parts.suffix));
  }
}

function withTerminalPunctuation(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function toSnippet(text, maxLength = 220) {
  const clean = sanitizeInlinePassageText(text);
  if (!clean) {
    return "";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function parseScriptureReference(reference) {
  const match = String(reference || "").trim().match(/^(.+?)\s+(\d+)(?::([\d,\-\s]+))?$/);
  if (!match) {
    return null;
  }

  return {
    book: match[1].trim(),
    chapter: Number.parseInt(match[2], 10),
    verseSpec: match[3] ? match[3].trim() : "",
  };
}

function expandVerseSpecification(spec) {
  const clean = String(spec || "").trim();
  if (!clean) {
    return [];
  }
  if (/^\d+(?:,\d+)+$/.test(clean)) {
    return clean.split(",").map((value) => value.trim()).filter(Boolean);
  }
  if (/^\d+(?:-\d+){2,}$/.test(clean)) {
    return clean.split("-").map((value) => value.trim()).filter(Boolean);
  }
  if (clean.includes("-")) {
    const [startRaw, endRaw] = clean.split("-").map((value) => value.replace(/[^0-9]/g, ""));
    const start = Number.parseInt(startRaw, 10);
    const end = Number.parseInt(endRaw, 10);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return [];
    }
    return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
  }
  const numeric = clean.replace(/[^0-9]/g, "");
  return numeric ? [numeric] : [];
}

function formatReadablePsalmReference(entry) {
  const chapter = Number.parseInt(entry?.number ?? entry?.psalm, 10);
  if (Number.isNaN(chapter) || chapter <= 0) {
    return "";
  }
  const verseSpec = String(entry?.verses || "").trim();
  return `Psalm ${chapter}${verseSpec ? `:${verseSpec}` : ""}`;
}

function extractVersePassageText(text, verseSpec = "") {
  const verses = new Set(expandVerseSpecification(verseSpec));
  if (!verses.size) {
    return "";
  }

  const blocks = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const matches = blocks.filter((block) => {
    if (/^chapter\s+\d+\b/i.test(block)) {
      return false;
    }
    const verseMatch = block.match(/^(\d+)\s+/);
    return Boolean(verseMatch && verses.has(verseMatch[1]));
  });

  return matches.join("\n\n").trim();
}

function buildStudyReference(kind, chapter, verseSpec = "", fallbackReference = "") {
  if (kind !== "psalm" && kind !== "wisdom") {
    return String(fallbackReference || "").trim();
  }

  const parsedChapter = Number.parseInt(chapter, 10);
  if (Number.isNaN(parsedChapter) || parsedChapter <= 0) {
    return String(fallbackReference || "").trim();
  }

  const referencePrefix = kind === "psalm" ? "Psalm" : String(fallbackReference || "").trim().split(/\s+/)[0] || "Proverbs";
  return `${referencePrefix} ${parsedChapter}${verseSpec ? `:${verseSpec}` : ""}`.trim();
}

function dedupeCrossReferenceItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.kind || "unknown"}|${String(item.reference || "").trim()}`;
    if (!item.reference || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function slugifyIdPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fetchJsonResource(url, label) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading ${label}`);
    }
    return response.json();
  });
}

async function fetchPsalmText(chapter, verse = "") {
  const params = new URLSearchParams({ chapter: String(chapter) });
  if (verse) {
    params.set("verse", String(verse));
  }
  const response = await fetch(`${PSALM_API_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Psalm fetch failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  return String(
    payload?.text
    || (Array.isArray(payload?.verses) ? payload.verses.map((entry) => entry.text).join("\n") : "")
    || ""
  ).trim();
}

async function fetchPsalmVerseWindow(chapter, verseSpec, previewText = "") {
  const verses = expandVerseSpecification(verseSpec);
  if (!verses.length) {
    return previewText || formatPassageBlockText(await fetchPsalmText(chapter));
  }

  const parts = await Promise.all(verses.map(async (verse) => {
    const text = sanitizeInlinePassageText(await fetchPsalmText(chapter, verse));
    return text ? `Psalm ${chapter}:${verse} ${text}` : "";
  }));
  return parts.filter(Boolean).join("\n\n");
}

async function fetchBookPartial(kind, reference, extra = {}) {
  const payload = { kind, reference, ...extra };
  const response = await fetch(BOOK_PARTIAL_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || `Book partial failed with HTTP ${response.status}`);
  }
  return String(body?.content || "").trim();
}

function getStudyQuery() {
  const params = new URLSearchParams(window.location.search);
  const reference = String(params.get("ref") || "").trim();
  const parsed = parseScriptureReference(reference);
  const chapter = Number.parseInt(params.get("chapter") || parsed?.chapter, 10);
  const verseSpec = String(params.get("verses") || parsed?.verseSpec || "").trim();
  const kindParam = String(params.get("kind") || "").trim().toLowerCase();
  const kind = kindParam || (/^psalm\s+/i.test(reference) ? "psalm" : "wisdom");
  const pentacle = Number.parseInt(params.get("pentacle") || "", 10);
  const depthParam = String(params.get("depth") || "").trim().toLowerCase();

  return {
    kind,
    reference,
    chapter: Number.isNaN(chapter) ? null : chapter,
    verseSpec,
    preview: String(params.get("preview") || "").trim(),
    dayText: String(params.get("day") || "").trim(),
    rulerText: String(params.get("ruler") || "").trim(),
    virtue: String(params.get("virtue") || "").trim(),
    domain: String(params.get("domain") || "").trim(),
    planet: String(params.get("planet") || "").trim(),
    pentacle: Number.isNaN(pentacle) ? null : pentacle,
    psalmRef: String(params.get("psalm_ref") || "").trim(),
    wisdomRef: String(params.get("wisdom_ref") || "").trim(),
    origin: String(params.get("origin") || "").trim(),
    depth: STUDY_DEPTHS.includes(depthParam) ? depthParam : "anchor",
  };
}

function buildStudyUrl(study, overrides = {}) {
  const next = { ...study, ...overrides };
  const params = new URLSearchParams();
  [
    ["kind", next.kind],
    ["ref", next.reference],
    ["chapter", next.chapter],
    ["verses", next.verseSpec],
    ["preview", next.preview],
    ["day", next.dayText],
    ["ruler", next.rulerText],
    ["virtue", next.virtue],
    ["domain", next.domain],
    ["planet", next.planet],
    ["pentacle", next.pentacle],
    ["psalm_ref", next.psalmRef],
    ["wisdom_ref", next.wisdomRef],
    ["origin", next.origin],
    ["depth", next.depth],
  ].forEach(([key, value]) => {
    const clean = String(value ?? "").trim();
    if (clean) {
      params.set(key, clean);
    }
  });
  const pathname = typeof window !== "undefined" && window.location?.pathname
    ? window.location.pathname
    : CLOCK_PATH.replace(/\/clock$/, "/scripture-study");
  return `${pathname}?${params.toString()}`;
}

function renderContext(study, paired) {
  elements.primaryRef.textContent = study.reference || "Open this page from the clock";
  elements.originLine.textContent = study.origin
    ? sentenceCase(study.origin.replace(/-/g, " "))
    : "Clock";

  const contextBits = [];
  if (study.dayText || study.rulerText) {
    contextBits.push(
      [study.dayText, study.rulerText].filter(Boolean).join(" — ")
    );
  }
  if (study.domain || study.virtue) {
    contextBits.push(
      [study.domain, study.virtue].filter(Boolean).join(" • ")
    );
  }
  if (study.planet && study.pentacle) {
    contextBits.push(`${study.planet} Pentacle #${study.pentacle}`);
  }

  elements.contextSummary.textContent = contextBits.join(" • ");
  elements.contextSummary.hidden = !contextBits.length;

  const rows = [
    study.reference ? `Anchor: ${study.reference}` : "",
    paired?.reference ? `Paired reading: ${paired.reference}` : "",
    study.planet && study.pentacle ? `Solomonic setting: ${study.planet} Pentacle #${study.pentacle}` : "",
  ].filter(Boolean);

  elements.contextList.innerHTML = "";
  rows.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    elements.contextList.appendChild(item);
  });
}

function applyDepthSelection(study, depth, { pushHistory = true } = {}) {
  const nextDepth = STUDY_DEPTHS.includes(depth) ? depth : "anchor";
  study.depth = nextDepth;

  elements.depthButtons.forEach((button) => {
    const isActive = button.dataset.depthButton === nextDepth;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;
  });

  elements.depthPanels.forEach((panel) => {
    const isActive = panel.dataset.depthPanel === nextDepth;
    panel.hidden = !isActive;
    panel.classList.toggle("study-depth-panel--active", isActive);
  });

  if (pushHistory) {
    const url = buildStudyUrl(study);
    window.history.replaceState({}, "", url);
  }
}

function bindDepthControls(study) {
  elements.depthButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyDepthSelection(study, button.dataset.depthButton);
    });
  });
}

function buildWhyToday(study, paired, solomonicRecord) {
  const summary = [study.dayText, study.rulerText, study.domain, study.virtue]
    .filter(Boolean)
    .join(" • ");

  const bullets = [];
  if (study.dayText || study.rulerText) {
    bullets.push(`Frame: ${[study.dayText, study.rulerText].filter(Boolean).join(" — ")}.`);
  }
  if (study.domain || study.virtue) {
    bullets.push(`Moral emphasis: ${[study.domain, study.virtue].filter(Boolean).join(" • ")}.`);
  }
  if (paired?.reference) {
    bullets.push(`Paired: ${paired.reference}.`);
  }
  if (solomonicRecord?.name || (study.planet && study.pentacle)) {
    bullets.push(`Setting: ${solomonicRecord?.name || `${study.planet} Pentacle #${study.pentacle}`}.`);
  }

  return { summary, bullets: bullets.slice(0, 4) };
}

function buildPairedReading(study) {
  if (study.kind === "psalm") {
    const paired = WISDOM_CONTENT_BY_RULER[study.rulerText];
    if (paired) {
      return {
        kind: "wisdom",
        reference: study.wisdomRef || paired.ref,
        preview: paired.text,
      };
    }
    if (study.wisdomRef) {
      return {
        kind: "wisdom",
        reference: study.wisdomRef,
        preview: "",
      };
    }
    return null;
  }

  const fallbackPsalm = FALLBACK_DAILY_PSALM_BY_RULER[study.rulerText];
  if (study.psalmRef) {
    const parsedPsalm = parseScriptureReference(study.psalmRef);
    return {
      kind: "psalm",
      reference: study.psalmRef,
      chapter: parsedPsalm?.chapter || "",
      verseSpec: parsedPsalm?.verseSpec || "",
      preview: "",
    };
  }
  if (!fallbackPsalm) {
    return null;
  }
  return {
    kind: "psalm",
    reference: `Psalm ${fallbackPsalm.chapter}:${fallbackPsalm.verse}`,
    chapter: fallbackPsalm.chapter,
    verseSpec: fallbackPsalm.verse,
    preview: "",
  };
}

async function loadPairedReadingText(paired) {
  if (!paired?.reference) {
    return "";
  }
  if (paired.preview) {
    return sanitizeInlinePassageText(paired.preview);
  }
  if (paired.kind === "psalm" && paired.chapter) {
    return sanitizeInlinePassageText(
      await fetchPsalmVerseWindow(paired.chapter, paired.verseSpec || "")
    );
  }
  return sanitizeInlinePassageText(await fetchBookPartial("wisdom", paired.reference));
}

function renderPairedReading(study, paired) {
  if (!paired?.reference) {
    elements.pairedRef.textContent = "—";
    elements.pairedText.textContent = "No paired reading is available for this passage.";
    elements.pairedLink.hidden = true;
    return;
  }

  elements.pairedRef.textContent = paired.reference;
  elements.pairedText.textContent = paired.preview
    ? toSnippet(paired.preview, 280)
    : "Open paired study.";
  elements.pairedLink.hidden = false;
  elements.pairedLink.textContent = "Open paired study";
  elements.pairedLink.href = buildStudyUrl(study, {
    kind: paired.kind,
    reference: paired.reference,
    chapter: paired.chapter || "",
    verseSpec: paired.verseSpec || "",
    preview: paired.preview || "",
    origin: "paired-reading",
    depth: "anchor",
  });
}

function renderThemesAndLinks(study, scriptureMappings) {
  elements.themeList.innerHTML = "";
  elements.sourceLinks.innerHTML = "";

  if (study.kind !== "psalm" || !study.chapter) {
    const note = document.createElement("p");
    note.className = "study-source-note";
    note.textContent = "Live wisdom source.";
    elements.sourceLinks.appendChild(note);
    return;
  }

  const entry = scriptureMappings?.psalms?.[String(study.chapter)];
  if (!entry) {
    const note = document.createElement("p");
    note.className = "study-source-note";
    note.textContent = "No bundled links.";
    elements.sourceLinks.appendChild(note);
    return;
  }

  const themes = Array.isArray(entry.themes) ? entry.themes : [];
  if (themes.length) {
    themes.forEach((theme) => {
      const chip = document.createElement("span");
      chip.className = "wisdom-tag";
      chip.textContent = theme;
      elements.themeList.appendChild(chip);
    });
  } else {
    const chip = document.createElement("span");
    chip.className = "wisdom-tag";
    chip.textContent = "psalm study";
    elements.themeList.appendChild(chip);
  }

  const linkEntries = Object.entries(entry.links || {}).filter(([, value]) => Boolean(value));
  if (!linkEntries.length) {
    const note = document.createElement("p");
    note.className = "study-source-note";
    note.textContent = "No external links.";
    elements.sourceLinks.appendChild(note);
    return;
  }

  linkEntries.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.className = "guide-link-button";
    link.href = String(href);
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = sentenceCase(label.replace(/_/g, " "));
    elements.sourceLinks.appendChild(link);
  });
}

function renderRelatedPentacles(study, pentaclePsalmPayload, pentaclesPayload) {
  elements.relatedPentacles.innerHTML = "";

  if (study.kind !== "psalm" || !study.chapter) {
    const item = document.createElement("li");
    item.textContent = "Shown for psalm study.";
    elements.relatedPentacles.appendChild(item);
    return;
  }

  const pentacles = Array.isArray(pentaclePsalmPayload?.pentacles) ? pentaclePsalmPayload.pentacles : [];
  const related = pentacles.filter((entry) => Array.isArray(entry.psalms) && entry.psalms.some((psalm) => Number.parseInt(psalm.number ?? psalm.psalm, 10) === study.chapter));

  if (!related.length) {
    const item = document.createElement("li");
    item.textContent = "No bundled correspondences.";
    elements.relatedPentacles.appendChild(item);
    return;
  }

  related.slice(0, 8).forEach((entry) => {
    const item = document.createElement("li");
    const lookupKey = `${String(entry.planet || "").trim().toLowerCase()}_${String(entry.pentacle || "").trim()}`;
    const pentacleRecord = pentaclesPayload?.pentacles?.[lookupKey];
    const meaning = pentacleRecord?.purpose ? ` — ${sentenceCase(pentacleRecord.purpose)}` : "";
    item.textContent = `${entry.planet} Pentacle #${entry.pentacle}${meaning}`;
    elements.relatedPentacles.appendChild(item);
  });
}

function buildCrossReferenceItems(study, paired, pentaclePsalmPayload, pentaclesPayload) {
  const items = [];

  if (paired?.reference) {
    items.push({
      kind: paired.kind,
      reference: paired.reference,
      description: "Daily paired reading.",
      href: buildStudyUrl(study, {
        kind: paired.kind,
        reference: paired.reference,
        chapter: paired.chapter || "",
        verseSpec: paired.verseSpec || "",
        preview: paired.preview || "",
        origin: "paired-reading",
        depth: "anchor",
      }),
      label: "Open paired study",
    });
  }

  if (study.planet && Number.isInteger(study.pentacle)) {
    const activePentacle = Array.isArray(pentaclePsalmPayload?.pentacles)
      ? pentaclePsalmPayload.pentacles.find((entry) =>
        String(entry?.planet || "").trim().toLowerCase() === String(study.planet || "").trim().toLowerCase()
        && Number.parseInt(entry?.pentacle, 10) === study.pentacle)
      : null;

    const pentacleRecord = pentaclesPayload?.pentacles?.[
      `${String(study.planet || "").trim().toLowerCase()}_${String(study.pentacle).trim()}`
    ] || null;

    (activePentacle?.psalms || []).forEach((entry) => {
      const reference = formatReadablePsalmReference(entry);
      if (!reference || reference === study.reference || reference === paired?.reference) {
        return;
      }

      items.push({
        kind: "psalm",
        reference,
        description: pentacleRecord?.purpose
          ? `${pentacleRecord.name || `${study.planet} Pentacle #${study.pentacle}`} • ${sentenceCase(pentacleRecord.purpose)}.`
          : `Also cited under ${study.planet} Pentacle #${study.pentacle}.`,
        href: buildStudyUrl(study, {
          kind: "psalm",
          reference,
          chapter: Number.parseInt(entry?.number ?? entry?.psalm, 10) || "",
          verseSpec: String(entry?.verses || "").trim(),
          preview: "",
          origin: "solomonic-crossref",
          depth: "anchor",
        }),
        label: "Open study",
      });
    });
  }

  if (study.kind === "wisdom" && study.psalmRef && study.psalmRef !== paired?.reference) {
    const parsedPsalm = parseScriptureReference(study.psalmRef);
    items.push({
      kind: "psalm",
      reference: study.psalmRef,
      description: "Clock psalm pair.",
      href: buildStudyUrl(study, {
        kind: "psalm",
        reference: study.psalmRef,
        chapter: parsedPsalm?.chapter || "",
        verseSpec: parsedPsalm?.verseSpec || "",
        preview: "",
        origin: "clock-psalm-pair",
        depth: "anchor",
      }),
      label: "Open psalm study",
    });
  }

  return dedupeCrossReferenceItems(items).slice(0, 6);
}

function renderCrossReferenceItems(items) {
  if (!elements.crossrefList) {
    return;
  }

  elements.crossrefList.innerHTML = "";

  if (!items.length) {
    const item = DOC?.createElement("li");
    if (!item) {
      return;
    }
    item.textContent = "No linked readings.";
    elements.crossrefList.appendChild(item);
    return;
  }

  items.forEach((entry) => {
    const item = DOC?.createElement("li");
    const header = DOC?.createElement("div");
    const title = DOC?.createElement("p");
    const note = DOC?.createElement("p");
    const action = DOC?.createElement("a");
    if (!item || !header || !title || !note || !action) {
      return;
    }

    item.className = "study-crossref-item";
    header.className = "study-crossref-header";
    title.className = "study-crossref-title";
    note.className = "study-crossref-note";
    action.className = "guide-link-button";

    title.textContent = entry.reference;
    note.textContent = entry.description;
    action.textContent = entry.label || "Open study";
    action.href = entry.href || CLOCK_PATH;

    header.appendChild(title);
    item.appendChild(header);
    item.appendChild(note);
    item.appendChild(action);
    elements.crossrefList.appendChild(item);
  });
}

function renderSolomonicSetting(study, pentaclesPayload) {
  const lookupKey = study.planet && study.pentacle
    ? `${study.planet.toLowerCase()}_${study.pentacle}`
    : "";
  const record = lookupKey ? pentaclesPayload?.pentacles?.[lookupKey] : null;

  if (!record) {
    elements.solomonicTitle.textContent = "No live pentacle context";
    elements.solomonicText.textContent = "No Solomonic context.";
    return null;
  }

  elements.solomonicTitle.textContent = `${record.name || `${study.planet} Pentacle #${study.pentacle}`}`;
  const parts = [];
  if (record.purpose) {
    parts.push(sentenceCase(record.purpose));
  }
  if (record.virtue) {
    parts.push(record.virtue);
  }
  if (study.domain || study.virtue) {
    parts.push([study.domain, study.virtue].filter(Boolean).join(" • "));
  }
  elements.solomonicText.textContent = parts.filter(Boolean).join(" • ");
  return record;
}

function buildPracticePlan(study, paired, solomonicRecord) {
  const domainText = String(study.domain || "today's active field").trim();
  const virtueText = String(study.virtue || solomonicRecord?.virtue || "attention").trim();
  const reference = study.reference || "this passage";
  const pairedText = paired?.reference ? ` Check it against ${paired.reference}.` : "";
  const solomonicText = solomonicRecord?.purpose
    ? ` ${sentenceCase(solomonicRecord.purpose)}.`
    : "";

  return {
    practice: domainText && virtueText
      ? `Do one ${lowerSentence(virtueText)} act in ${lowerSentence(domainText)} today. Let ${reference} govern it.${pairedText}${solomonicText}`
      : `Do one act that obeys ${reference} today.${pairedText}${solomonicText}`,
    reflection: `What did you do? Where did it resist? Did ${reference} hold?`,
    carryPrompt: domainText && virtueText
      ? `Turn ${reference} into one ${lowerSentence(virtueText)} act in ${lowerSentence(domainText)} today${paired?.reference ? `. Use ${paired.reference} as witness` : ""}.`
      : `Turn ${reference} into one concrete act today${paired?.reference ? `. Use ${paired.reference} as witness` : ""}.`,
  };
}

function renderPracticePlan(plan) {
  if (elements.practiceText) {
    elements.practiceText.textContent = plan?.practice || "Open a passage from the clock to generate one concrete practice.";
  }
  if (elements.reflectionText) {
    elements.reflectionText.textContent = plan?.reflection || "The study page will suggest an evening review once live context is available.";
  }
  if (elements.carryPromptText) {
    elements.carryPromptText.textContent = plan?.carryPrompt || "The strongest Pericope handoff prompt will appear here once a live passage is loaded.";
  }
}

function buildStudyPrompts(study, paired, solomonicRecord, practicePlan) {
  const prompts = [];
  if (study.reference) {
    prompts.push(`Where does ${study.reference} press on the real decision in front of me?`);
  }
  if (paired?.reference) {
    prompts.push(`How does ${paired.reference} sharpen or correct the way I am reading ${study.reference} today?`);
  }
  if (solomonicRecord?.purpose) {
    prompts.push(`What one act would show ${String(solomonicRecord.purpose).toLowerCase()} in a real decision today?`);
  }
  if (!prompts.length) {
    prompts.push("Open a live scripture anchor from the clock to generate passage-specific prompts.");
  }
  return dedupeCrossReferenceItems(
    prompts.map((prompt, index) => ({
      kind: "prompt",
      reference: `prompt-${index}`,
      description: withTerminalPunctuation(prompt),
    }))
  ).slice(0, 3).map((entry) => entry.description);
}

function renderStudyPrompts(prompts) {
  elements.prompts.innerHTML = "";
  prompts.forEach((prompt) => {
    const item = document.createElement("li");
    item.textContent = prompt;
    elements.prompts.appendChild(item);
  });
}

async function loadAnchorTexts(study) {
  if (!study.reference) {
    return {
      anchorText: "Open this page from the clock’s scripture surfaces to load a live passage.",
      expandedText: "",
      contextStatus: "Context",
    };
  }

  if (study.kind === "psalm" && study.chapter) {
    const anchorText = study.preview
      ? sanitizeInlinePassageText(study.preview)
      : await fetchPsalmVerseWindow(study.chapter, study.verseSpec);
    const expandedText = formatPassageBlockText(await fetchPsalmText(study.chapter));
    return {
      anchorText: anchorText || "Unable to load the anchored verses.",
      expandedText: expandedText || "",
      contextStatus: expandedText
        ? "Context"
        : "Anchor only",
    };
  }

  const previewText = study.preview || "";
  const expandedText = formatPassageBlockText(await fetchBookPartial("wisdom", study.reference));
  const anchorFromContext = extractVersePassageText(expandedText, study.verseSpec);
  return {
    anchorText: anchorFromContext || previewText || toSnippet(expandedText, 260) || "Unable to load the anchored passage.",
    expandedText,
    contextStatus: expandedText
      ? "Context"
      : "Anchor only",
  };
}

function bindDiscussAction(study, prompts, handoffPrompt = "") {
  const launch = () => {
    const message = handoffPrompt
      || prompts[0]
      || `Help me study ${study.reference || "this passage"} in the context of today’s counsel.`;
    const params = new URLSearchParams({
      mode: "guided",
      source: "solomonic_scripture_study",
      message,
    });
    window.location.assign(`${PERICOPE_CHAT_URL}?${params.toString()}`);
  };

  elements.discussButton.onclick = launch;
  if (elements.discussPanelButton) {
    elements.discussPanelButton.onclick = launch;
  }
}

function renderWhyToday(whyToday) {
  elements.whyText.textContent = whyToday.summary;
  elements.whyText.hidden = !whyToday.summary;
  elements.whyList.innerHTML = "";
  whyToday.bullets.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    elements.whyList.appendChild(item);
  });
}

async function buildStudyPayload(study) {
  const paired = buildPairedReading(study);
  const [
    scriptureMappings,
    pentaclePsalmPayload,
    pentaclesPayload,
    reading,
    pairedPreview,
  ] = await Promise.all([
    fetchJsonResource(SCRIPTURE_MAPPINGS_PATH, "scripture mappings"),
    fetchJsonResource(PENTACLE_PSALMS_PATH, "pentacle psalm map"),
    fetchJsonResource(PENTACLES_PATH, "pentacles"),
    loadAnchorTexts(study),
    loadPairedReadingText(paired).catch(() => ""),
  ]);

  const pairedWithPreview = paired
    ? { ...paired, preview: paired.preview || pairedPreview || "" }
    : null;
  const solomonicRecord = renderSolomonicSetting(study, pentaclesPayload);
  const practicePlan = buildPracticePlan(study, pairedWithPreview, solomonicRecord);
  const whyToday = buildWhyToday(study, pairedWithPreview, solomonicRecord);
  const prompts = buildStudyPrompts(study, pairedWithPreview, solomonicRecord, practicePlan);
  const crossrefs = buildCrossReferenceItems(study, pairedWithPreview, pentaclePsalmPayload, pentaclesPayload);

  return {
    paired: pairedWithPreview,
    scriptureMappings,
    pentaclePsalmPayload,
    pentaclesPayload,
    reading,
    solomonicRecord,
    practicePlan,
    crossrefs,
    whyToday,
    prompts,
  };
}

async function initialiseStudyPage() {
  const study = getStudyQuery();
  bindDepthControls(study);
  applyDepthSelection(study, study.depth, { pushHistory: false });

  const paired = buildPairedReading(study);
  renderContext(study, paired);
  renderPairedReading(study, paired);

  elements.contextHeading.textContent = study.reference || "Open a passage to widen the reading";
  elements.contextStatus.textContent = "Context";

  if (!study.reference) {
    bindDiscussAction(study, [], "");
    return;
  }

  elements.title.textContent = `${study.reference} | Scripture Study`;
  elements.anchorHeading.textContent = study.reference;
  elements.contextHeading.textContent = study.reference;
  elements.readingStatus.textContent = "Loading…";
  elements.contextStatus.textContent = "Loading…";
  renderScriptureBlock(elements.anchorText, "Loading passage…", { decorate: false });
  renderScriptureBlock(elements.expandedText, "Loading broader context…", { decorate: false });

  try {
    const payload = await buildStudyPayload(study);

    renderPairedReading(study, payload.paired);
    renderThemesAndLinks(study, payload.scriptureMappings);
    renderRelatedPentacles(study, payload.pentaclePsalmPayload, payload.pentaclesPayload);
    renderCrossReferenceItems(payload.crossrefs);
    renderPracticePlan(payload.practicePlan);
    renderWhyToday(payload.whyToday);
    renderStudyPrompts(payload.prompts);
    bindDiscussAction(study, payload.prompts, payload.practicePlan?.carryPrompt || "");

    renderScriptureBlock(elements.anchorText, payload.reading.anchorText);
    renderScriptureBlock(
      elements.expandedText,
      payload.reading.expandedText || "No broader context is available for this passage yet.",
      { decorate: Boolean(payload.reading.expandedText) }
    );
    elements.readingStatus.textContent = "Anchor";
    elements.contextStatus.textContent = payload.reading.contextStatus;
    elements.discussTitle.textContent = payload.solomonicRecord?.name
      ? `Discuss ${payload.solomonicRecord.name} and ${study.reference}`
      : `Discuss ${study.reference}`;
  } catch (error) {
    console.error("Failed to initialise scripture study page", error);
    elements.readingStatus.textContent = "Unable to load the deeper study view right now.";
    elements.contextStatus.textContent = "Context could not be loaded.";
    renderScriptureBlock(
      elements.anchorText,
      study.preview || "The study page could not load the requested passage.",
      { decorate: Boolean(study.preview) }
    );
    renderScriptureBlock(elements.expandedText, "The broader passage is unavailable right now.", { decorate: false });
    renderCrossReferenceItems([]);
    renderPracticePlan(null);
    bindDiscussAction(
      study,
      [],
      `Help me work with ${study.reference || "this passage"} even though the full study page did not load correctly.`
    );
  }
}

if (typeof globalThis !== "undefined") {
  globalThis.__scriptureStudyTest = {
    buildPairedReading,
    buildCrossReferenceItems,
    buildPracticePlan,
    expandVerseSpecification,
    extractVersePassageText,
    formatPassageBlockText,
    parseScriptureReference,
  };
}

if (typeof window !== "undefined" && DOC) {
  initialiseStudyPage();
}
