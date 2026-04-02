const filterState = {
  query: "",
  tradition: "all",
  type: "all",
  era: "all",
};

function normalize(text) {
  return String(text || "").trim().toLowerCase();
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
    filterState.query = "";
    filterState.tradition = "all";
    filterState.type = "all";
    filterState.era = "all";
    searchInput.value = "";

    document.querySelectorAll(".wisdom-filter-group").forEach((group) => {
      syncButtonState(group, "all");
    });

    applyFilters();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupFilters();
  setupClear();
  applyFilters();
});
