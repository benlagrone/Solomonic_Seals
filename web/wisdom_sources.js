const filterState = {
  query: "",
  tradition: "all",
  type: "all",
  era: "all",
};

const SOURCE_METADATA = {
  "life-of-st-antony": {
    authorSlug: "athanasius_of_alexandria",
    prompt:
      "Help me read the Life of St. Antony as a guide to prayer, withdrawal, and spiritual struggle. What practices and cautions should I notice first?",
  },
  "rule-of-pachomius": {
    prompt:
      "Help me read the Rule of Pachomius as a guide to cenobitic life. What does it teach about obedience, common labor, and disciplined community?",
  },
  "historia-monachorum-in-aegypto": {
    prompt:
      "Help me read Historia Monachorum in Aegypto as a witness to Egyptian ascetic life. What ideals, practices, and forms of authority does it preserve?",
  },
  "apophthegmata-patrum": {
    prompt:
      "Help me read the Apophthegmata Patrum for concise practical wisdom. Which sayings or themes best train speech, humility, and self-command?",
  },
  "praktikos-and-chapters-on-prayer": {
    prompt:
      "Help me read Evagrius's Praktikos and Chapters on Prayer as a guide to temptation, attention, and prayer. What framework should I understand first?",
  },
  "lausiac-history": {
    prompt:
      "Help me read the Lausiac History as a historical witness to early monastic life. Which figures, practices, and tensions matter most?",
  },
  "history-of-the-monks-of-syria": {
    prompt:
      "Help me read the History of the Monks of Syria as a guide to Syrian ascetic witness. What practices and forms of holiness distinguish it from the Egyptian tradition?",
  },
  "rule-of-st-basil": {
    authorSlug: "basil_the_great",
    prompt:
      "Help me read the Rule of St. Basil as a rule of life today. What should I notice first about common prayer, obedience, work, and shared discipline?",
  },
  "the-ladder-of-divine-ascent": {
    prompt:
      "Help me read the Ladder of Divine Ascent as a guide to spiritual struggle and growth. Which steps or themes should a newcomer start with?",
  },
  "institutes-and-conferences": {
    prompt:
      "Help me read Cassian's Institutes and Conferences as a bridge from the desert into a durable rule of life. What habits and themes should I attend to first?",
  },
  "rule-of-st-benedict": {
    prompt:
      "Help me read the Rule of St. Benedict as a rule of life today. What should I notice first about stability, prayer, labor, reading, and moderation?",
  },
  "the-philokalia": {
    prompt:
      "Help me approach the Philokalia as a later synthesis of Eastern ascetical theology. How should a newcomer begin without flattening the tradition?",
  },
};

const TAG_ACTIONS = {
  "monastic texts": { query: "monastic" },
  "desert fathers": { tradition: "egyptian", query: "desert fathers" },
  "cenobitic life": { query: "cenobitic" },
  "eremitic tradition": { query: "eremitic" },
  "eastern orthodoxy": { query: "orthodox" },
  benedictine: { query: "benedictine" },
  "ascetic theology": { query: "ascetic" },
  "rule of life": { type: "rule", query: "rule" },
  "primary sources": { query: "primary source" },
  egypt: { tradition: "egyptian", query: "egypt" },
  syria: { tradition: "syrian", query: "syria" },
  rule: { type: "rule", query: "rule" },
  history: { type: "history", query: "history" },
  sayings: { type: "sayings", query: "sayings" },
  manual: { type: "manual", query: "manual" },
  anthology: { type: "anthology", query: "anthology" },
  hagiography: { type: "hagiography", query: "hagiography" },
  "4th to 15th centuries": { era: "later", query: "4th" },
};

let highlightedSourceTimer = 0;

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function getPericopeChatBaseUrl() {
  const explicitUrl = document.body?.dataset?.pericopeChatUrl;
  if (explicitUrl) {
    return explicitUrl;
  }

  return "https://pericopeai.com/chat";
}

function base64UrlEncodeUtf8(text) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }

  const bytes = new TextEncoder().encode(String(text || ""));
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function resetFilterState() {
  filterState.query = "";
  filterState.tradition = "all";
  filterState.type = "all";
  filterState.era = "all";
}

function cardMatches(card) {
  const searchBlob = normalize(
    [
      card.dataset.title,
      card.dataset.author,
      card.dataset.tradition,
      card.dataset.type,
      card.dataset.era,
      card.dataset.tags,
      card.textContent,
    ].join(" "),
  );

  const queryMatch = !filterState.query || searchBlob.includes(filterState.query);
  const traditionMatch =
    filterState.tradition === "all" || card.dataset.tradition === filterState.tradition;
  const typeMatch = filterState.type === "all" || card.dataset.type === filterState.type;
  const eraMatch = filterState.era === "all" || card.dataset.era === filterState.era;

  return queryMatch && traditionMatch && typeMatch && eraMatch;
}

function syncButtonState(group, value) {
  const buttons = group.querySelectorAll(".wisdom-filter-button");
  buttons.forEach((button) => {
    const isActive = button.dataset.filterValue === value;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function syncAllFilterButtons() {
  document.querySelectorAll(".wisdom-filter-group").forEach((group) => {
    const filterGroup = group.dataset.filterGroup;
    if (!filterGroup) {
      return;
    }
    syncButtonState(group, filterState[filterGroup] || "all");
  });
}

function clearActiveTagState() {
  document.querySelectorAll(".wisdom-tag--interactive").forEach((tag) => {
    tag.classList.remove("is-active");
    tag.setAttribute("aria-pressed", "false");
  });
}

function updateResultsSummary(visibleCount, totalCount) {
  const summary = document.getElementById("wisdom-results-summary");
  if (!summary) {
    return;
  }

  if (visibleCount === totalCount && !filterState.query && filterState.tradition === "all" && filterState.type === "all" && filterState.era === "all") {
    summary.textContent = `Showing all ${totalCount} sources.`;
    return;
  }

  const activeFilters = [];
  if (filterState.query) {
    activeFilters.push(`search: "${filterState.query}"`);
  }
  if (filterState.tradition !== "all") {
    activeFilters.push(`tradition: ${filterState.tradition}`);
  }
  if (filterState.type !== "all") {
    activeFilters.push(`type: ${filterState.type}`);
  }
  if (filterState.era !== "all") {
    activeFilters.push(`period: ${filterState.era}`);
  }

  summary.textContent = `Showing ${visibleCount} of ${totalCount} sources${activeFilters.length ? ` for ${activeFilters.join(", ")}` : ""}.`;
}

function applyFilters() {
  const cards = Array.from(document.querySelectorAll(".js-wisdom-card"));
  const sections = Array.from(document.querySelectorAll(".wisdom-category-section"));
  const emptyState = document.getElementById("wisdom-empty-state");

  let visibleCount = 0;
  cards.forEach((card) => {
    const matches = cardMatches(card);
    card.hidden = !matches;
    if (matches) {
      visibleCount += 1;
    }
  });

  sections.forEach((section) => {
    const visibleCards = section.querySelectorAll(".js-wisdom-card:not([hidden])").length;
    section.hidden = visibleCards === 0;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }

  updateResultsSummary(visibleCount, cards.length);
  return visibleCount;
}

function resetUiFilters() {
  const searchInput = document.getElementById("wisdom-search");

  resetFilterState();
  if (searchInput) {
    searchInput.value = "";
  }

  clearActiveTagState();
  syncAllFilterButtons();
  applyFilters();
}

function buildSourceContext(card, sourceId) {
  return {
    entrypoint: "wisdom_sources",
    source_id: sourceId,
    source: {
      title: String(card.dataset.title || "").trim(),
      author: String(card.dataset.author || "").trim(),
      tradition: String(card.dataset.tradition || "").trim(),
      type: String(card.dataset.type || "").trim(),
      era: String(card.dataset.era || "").trim(),
      tags: String(card.dataset.tags || "")
        .split(/\s+/)
        .filter(Boolean),
    },
  };
}

function buildPericopeSourceUrl(sourceId, card) {
  const meta = SOURCE_METADATA[sourceId];
  const authorSlug = meta?.authorSlug ? String(meta.authorSlug).trim() : "";
  const baseUrl = authorSlug
    ? `https://pericopeai.com/author/${encodeURIComponent(authorSlug)}`
    : getPericopeChatBaseUrl();
  const params = new URLSearchParams({
    mode: "freeform",
    source: "wisdom_sources",
    prompt_id: `wisdom-source-${sourceId}`,
    message: meta?.prompt || `Help me read ${card.dataset.title || "this source"} as a rule of life today.`,
  });
  const context = buildSourceContext(card, sourceId);
  const encodedContext = base64UrlEncodeUtf8(JSON.stringify(context));

  if (encodedContext) {
    params.set("ctx", encodedContext);
  }

  return `${baseUrl}?${params.toString()}`;
}

function createActionLink(label, href, isPrimary = false) {
  const link = document.createElement("a");
  link.className = isPrimary ? "guide-link-button guide-link-button--primary" : "guide-link-button";
  link.href = href;
  link.textContent = label;
  return link;
}

function clearHighlightedSource() {
  document.querySelectorAll(".js-wisdom-card.is-highlighted").forEach((card) => {
    card.classList.remove("is-highlighted");
  });
}

function revealSourceCard(sourceId) {
  const sourceCard = document.querySelector(`.js-wisdom-card[data-source-id="${sourceId}"]`);
  if (!sourceCard) {
    return;
  }

  resetUiFilters();
  clearHighlightedSource();
  sourceCard.scrollIntoView({ behavior: "smooth", block: "start" });
  sourceCard.classList.add("is-highlighted");

  if (highlightedSourceTimer) {
    window.clearTimeout(highlightedSourceTimer);
  }
  highlightedSourceTimer = window.setTimeout(() => {
    sourceCard.classList.remove("is-highlighted");
  }, 2200);

  const heading = sourceCard.querySelector("h3");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function setupSearch() {
  const searchInput = document.getElementById("wisdom-search");
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", (event) => {
    filterState.query = normalize(event.target.value);
    clearActiveTagState();
    applyFilters();
  });
}

function setupFilters() {
  const groups = Array.from(document.querySelectorAll(".wisdom-filter-group"));
  groups.forEach((group) => {
    const filterGroup = group.dataset.filterGroup;
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".wisdom-filter-button");
      if (!button || !filterGroup) {
        return;
      }

      const value = button.dataset.filterValue || "all";
      filterState[filterGroup] = value;
      syncButtonState(group, value);
      clearActiveTagState();
      applyFilters();
    });
  });
}

function setupClear() {
  const clearButton = document.getElementById("wisdom-clear-filters");
  if (!clearButton) {
    return;
  }

  clearButton.addEventListener("click", () => {
    resetUiFilters();
  });
}

function applyTagAction(tag) {
  const label = String(tag.dataset.label || tag.textContent || "").trim();
  const action = TAG_ACTIONS[normalize(label)] || { query: label };
  const searchInput = document.getElementById("wisdom-search");

  resetFilterState();
  filterState.query = normalize(action.query || "");
  filterState.tradition = action.tradition || "all";
  filterState.type = action.type || "all";
  filterState.era = action.era || "all";

  if (searchInput) {
    searchInput.value = action.query || label;
  }

  document.querySelectorAll(".wisdom-tag--interactive").forEach((item) => {
    const isActive = item === tag;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  syncAllFilterButtons();
  applyFilters();
}

function setupTagFilters() {
  const tags = Array.from(document.querySelectorAll(".wisdom-tag"));
  tags.forEach((tag) => {
    tag.classList.add("wisdom-tag--interactive");
    tag.setAttribute("role", "button");
    tag.setAttribute("tabindex", "0");
    tag.setAttribute("aria-pressed", "false");
    tag.setAttribute("title", `Filter sources by ${String(tag.textContent || "").trim()}`);

    tag.addEventListener("click", () => {
      applyTagAction(tag);
    });

    tag.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      applyTagAction(tag);
    });
  });
}

function setupSourceActions() {
  document.querySelectorAll(".js-wisdom-card").forEach((card) => {
    if (card.querySelector(".wisdom-card-actions")) {
      return;
    }

    const sourceId = String(card.dataset.sourceId || "").trim();
    if (!sourceId) {
      return;
    }

    const actions = document.createElement("div");
    actions.className = "guide-actions wisdom-card-actions";
    actions.append(createActionLink("Discuss in Pericope", buildPericopeSourceUrl(sourceId, card), true));

    const sourceLinks = card.querySelector(".wisdom-source-links");
    if (sourceLinks) {
      card.insertBefore(actions, sourceLinks);
      return;
    }

    card.append(actions);
  });
}

function setupStarterCards() {
  document.querySelectorAll(".js-starter-card").forEach((card) => {
    if (card.querySelector(".wisdom-starter-actions")) {
      return;
    }

    const sourceId = String(card.dataset.sourceId || "").trim();
    const sourceCard = document.querySelector(`.js-wisdom-card[data-source-id="${sourceId}"]`);
    if (!sourceId || !sourceCard) {
      return;
    }

    const actions = document.createElement("div");
    actions.className = "guide-actions wisdom-starter-actions";
    actions.append(createActionLink("Discuss in Pericope", buildPericopeSourceUrl(sourceId, sourceCard), true));

    const revealLink = createActionLink("View source note", `#${sourceCard.id || ""}`);
    revealLink.dataset.revealSourceId = sourceId;
    actions.append(revealLink);

    card.append(actions);
  });
}

function setupSourceRevealLinks() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-reveal-source-id]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    revealSourceCard(String(trigger.dataset.revealSourceId || "").trim());
  });
}

function setupEmptyStateReset() {
  const resetButton = document.getElementById("wisdom-empty-reset");
  if (!resetButton) {
    return;
  }

  resetButton.addEventListener("click", () => {
    resetUiFilters();
    document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  setupClear();
  setupTagFilters();
  setupSourceActions();
  setupStarterCards();
  setupSourceRevealLinks();
  setupEmptyStateReset();
  applyFilters();
});
