"use strict";

const PSALM_API_ENDPOINT = "/api/psalm";
const BOOK_PARTIAL_API_ENDPOINT = "/api/pericope/book-partial";
const SCRIPTURE_MAPPINGS_PATH = "/data/scripture_mappings.json";
const PENTACLE_PSALMS_PATH = "/data/pentacle_psalms.json";
const PENTACLES_PATH = "/data/pentacles.json";
const CLOCK_PATH = "/clock";
const PERICOPE_CHAT_URL = String(document.body?.dataset?.pericopeChatUrl || "https://pericopeai.com/chat").trim();

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

const elements = {
  title: document.querySelector(".study-page-title"),
  intro: document.querySelector(".study-page-intro"),
  primaryRef: document.querySelector(".study-primary-ref"),
  originLine: document.querySelector(".study-origin-line"),
  contextSummary: document.querySelector(".study-context-summary"),
  contextList: document.querySelector(".study-context-list"),
  anchorHeading: document.querySelector(".study-anchor-heading"),
  readingStatus: document.querySelector(".study-reading-status"),
  anchorText: document.querySelector(".study-anchor-text"),
  expandButton: document.querySelector(".study-expand-button"),
  expandedText: document.querySelector(".study-expanded-text"),
  pairedRef: document.querySelector(".study-paired-ref"),
  pairedText: document.querySelector(".study-paired-text"),
  pairedLink: document.querySelector(".study-paired-link"),
  solomonicTitle: document.querySelector(".study-solomonic-title"),
  solomonicText: document.querySelector(".study-solomonic-text"),
  relatedPentacles: document.querySelector(".study-related-pentacles"),
  themeList: document.querySelector(".study-theme-list"),
  sourceLinks: document.querySelector(".study-source-links"),
  prompts: document.querySelector(".study-prompts"),
  discussButton: document.querySelector(".study-discuss-button"),
};

function sentenceCase(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
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
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
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
  ].forEach(([key, value]) => {
    const clean = String(value ?? "").trim();
    if (clean) {
      params.set(key, clean);
    }
  });
  return `${window.location.pathname}?${params.toString()}`;
}

function renderContext(study, paired) {
  elements.primaryRef.textContent = study.reference || "Open this page from the clock";
  elements.originLine.textContent = study.origin
    ? `Opened from ${study.origin.replace(/-/g, " ")}.`
    : "Opened from the clock’s study actions.";

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

  elements.contextSummary.textContent = contextBits.length
    ? `This study page keeps the clock’s current frame in view: ${contextBits.join(" • ")}.`
    : "This study page keeps the current clock frame visible while you read the passage more deeply.";

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
    return {
      kind: "psalm",
      reference: study.psalmRef,
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

function renderPairedReading(study, paired) {
  if (!paired?.reference) {
    elements.pairedRef.textContent = "—";
    elements.pairedText.textContent = "No paired reading is available for this passage.";
    elements.pairedLink.hidden = true;
    return;
  }

  elements.pairedRef.textContent = paired.reference;
  elements.pairedText.textContent = paired.preview
    ? sanitizeInlinePassageText(paired.preview)
    : "Open this paired reading to continue the cross-reference path.";
  elements.pairedLink.hidden = false;
  elements.pairedLink.textContent = "Open paired study";
  elements.pairedLink.href = buildStudyUrl(study, {
    kind: paired.kind,
    reference: paired.reference,
    chapter: paired.chapter || "",
    verseSpec: paired.verseSpec || "",
    preview: paired.preview || "",
    origin: "paired-reading",
  });
}

function renderThemesAndLinks(study, scriptureMappings) {
  elements.themeList.innerHTML = "";
  elements.sourceLinks.innerHTML = "";

  if (study.kind !== "psalm" || !study.chapter) {
    const note = document.createElement("p");
    note.className = "study-source-note";
    note.textContent = "This reading is using the live wisdom source path rather than the bundled psalm map.";
    elements.sourceLinks.appendChild(note);
    return;
  }

  const entry = scriptureMappings?.psalms?.[String(study.chapter)];
  if (!entry) {
    const note = document.createElement("p");
    note.className = "study-source-note";
    note.textContent = "No bundled theme or source links are available for this psalm yet.";
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
    note.textContent = "No external source links are bundled for this psalm.";
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
    item.textContent = "Psalm-linked pentacle correspondences appear here when the active study is a psalm.";
    elements.relatedPentacles.appendChild(item);
    return;
  }

  const pentacles = Array.isArray(pentaclePsalmPayload?.pentacles) ? pentaclePsalmPayload.pentacles : [];
  const related = pentacles.filter((entry) => Array.isArray(entry.psalms) && entry.psalms.some((psalm) => Number.parseInt(psalm.number ?? psalm.psalm, 10) === study.chapter));

  if (!related.length) {
    const item = document.createElement("li");
    item.textContent = "No pentacle correspondences are bundled for this psalm yet.";
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

function renderSolomonicSetting(study, pentaclesPayload) {
  const lookupKey = study.planet && study.pentacle
    ? `${study.planet.toLowerCase()}_${study.pentacle}`
    : "";
  const record = lookupKey ? pentaclesPayload?.pentacles?.[lookupKey] : null;

  if (!record) {
    elements.solomonicTitle.textContent = "No live pentacle context";
    elements.solomonicText.textContent = "Open this page from a live clock passage to see the related pentacle meaning and why it belongs to today’s counsel.";
    return null;
  }

  elements.solomonicTitle.textContent = `${record.name || `${study.planet} Pentacle #${study.pentacle}`}`;
  const parts = [];
  if (record.purpose) {
    parts.push(`Traditional meaning: ${withTerminalPunctuation(sentenceCase(record.purpose))}`);
  }
  if (study.domain || study.virtue) {
    parts.push(
      `Today's reading: It was surfaced because the day leans toward ${String(study.domain || "the current field").toLowerCase()} through ${String(study.virtue || "its active virtue").toLowerCase()}.`
    );
  }
  if (record.virtue) {
    parts.push(`Associated virtue: ${record.virtue}.`);
  }
  elements.solomonicText.textContent = parts.join(" ");
  return record;
}

function buildStudyPrompts(study, paired, solomonicRecord) {
  const prompts = [];
  if (study.reference) {
    prompts.push(`What changes if I read ${study.reference} as counsel for ${String(study.domain || "today’s active field").toLowerCase()} rather than as a disconnected proof text?`);
  }
  if (paired?.reference) {
    prompts.push(`How does ${paired.reference} sharpen or correct the way I am reading ${study.reference} today?`);
  }
  if (solomonicRecord?.purpose) {
    prompts.push(`What concrete act would make the ${String(solomonicRecord.purpose).toLowerCase()} of this pentacle visible in one real decision today?`);
  }
  if (!prompts.length) {
    prompts.push("Open a live scripture anchor from the clock to generate passage-specific prompts.");
  }
  elements.prompts.innerHTML = "";
  prompts.slice(0, 3).forEach((prompt) => {
    const item = document.createElement("li");
    item.textContent = withTerminalPunctuation(prompt);
    elements.prompts.appendChild(item);
  });
  return prompts;
}

async function loadAnchorTexts(study) {
  if (!study.reference) {
    return {
      anchorText: "Open this page from the clock’s scripture surfaces to load a live passage.",
      expandedText: "",
      canExpand: false,
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
      canExpand: Boolean(expandedText),
    };
  }

  const previewText = study.preview || "";
  const expandedText = formatPassageBlockText(await fetchBookPartial("wisdom", study.reference));
  return {
    anchorText: previewText || toSnippet(expandedText, 260) || "Unable to load the anchored passage.",
    expandedText,
    canExpand: Boolean(expandedText),
  };
}

function bindDiscussAction(study, prompts) {
  elements.discussButton.addEventListener("click", () => {
    const message = prompts[0]
      || `Help me study ${study.reference || "this passage"} in the context of today’s counsel.`;
    const params = new URLSearchParams({
      mode: "guided",
      source: "solomonic_scripture_study",
      message,
    });
    window.location.assign(`${PERICOPE_CHAT_URL}?${params.toString()}`);
  });
}

async function initialiseStudyPage() {
  const study = getStudyQuery();
  const paired = buildPairedReading(study);

  renderContext(study, paired);
  renderPairedReading(study, paired);

  if (!study.reference) {
    bindDiscussAction(study, []);
    return;
  }

  elements.title.textContent = `${study.reference} | Scripture Study`;
  elements.intro.textContent = `Read ${study.reference} as more than a small preview card: hold the anchor, the broader passage, the paired reading, and the live clock context together.`;
  elements.anchorHeading.textContent = study.reference;
  elements.readingStatus.textContent = "Loading anchor and broader passage…";
  elements.anchorText.textContent = "Loading passage…";

  try {
    const [scriptureMappings, pentaclePsalmPayload, pentaclesPayload, reading] = await Promise.all([
      fetchJsonResource(SCRIPTURE_MAPPINGS_PATH, "scripture mappings"),
      fetchJsonResource(PENTACLE_PSALMS_PATH, "pentacle psalm map"),
      fetchJsonResource(PENTACLES_PATH, "pentacles"),
      loadAnchorTexts(study),
    ]);

    elements.anchorText.textContent = reading.anchorText;
    elements.expandedText.textContent = reading.expandedText;
    elements.readingStatus.textContent = reading.canExpand
      ? "Showing the anchor. Open the broader passage when you are ready."
      : "Showing the anchor reading.";

    if (reading.canExpand) {
      let expandedVisible = false;
      elements.expandButton.hidden = false;
      elements.expandButton.textContent = "Read Broader Passage";
      elements.expandButton.addEventListener("click", () => {
        expandedVisible = !expandedVisible;
        elements.expandedText.hidden = !expandedVisible;
        elements.expandButton.textContent = expandedVisible ? "Show Anchor Only" : "Read Broader Passage";
      });
    }

    renderThemesAndLinks(study, scriptureMappings);
    renderRelatedPentacles(study, pentaclePsalmPayload, pentaclesPayload);
    const solomonicRecord = renderSolomonicSetting(study, pentaclesPayload);
    const prompts = buildStudyPrompts(study, paired, solomonicRecord);
    bindDiscussAction(study, prompts);
  } catch (error) {
    console.error("Failed to initialise scripture study page", error);
    elements.readingStatus.textContent = "Unable to load the deeper study view right now.";
    elements.anchorText.textContent = study.preview || "The study page could not load the requested passage.";
    bindDiscussAction(study, [
      `Help me work with ${study.reference || "this passage"} even though the full study page did not load correctly.`,
    ]);
  }
}

initialiseStudyPage();
