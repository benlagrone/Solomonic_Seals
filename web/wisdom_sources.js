const filterState = {
  query: "",
  tradition: "all",
  type: "all",
  era: "all",
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

function normalize(text) {
  return String(text || "").trim().toLowerCase();
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
  const searchInput = document.getElementById("wisdom-search");
  if (!clearButton || !searchInput) {
    return;
  }

  clearButton.addEventListener("click", () => {
    resetFilterState();
    searchInput.value = "";
    clearActiveTagState();
    syncAllFilterButtons();
    applyFilters();
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
    item.classList.toggle("is-active", item === tag);
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

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  setupClear();
  setupTagFilters();
  applyFilters();
});
