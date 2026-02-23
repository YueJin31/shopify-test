const CUSTOM_FILTERS_SELECTORS = {
  customFiltersInput: ".js-custom-filters-input",
  customCollectionGrid: ".js-custom-collection-list",
  customCollection: ".js-custom-collection",
};

function serializeFilters() {
  const params = new URLSearchParams();

  document.querySelectorAll(CUSTOM_FILTERS_SELECTORS.customFiltersInput).forEach((input) => {
    if (!input.name) return;

    if (input.type === "checkbox" && input.checked) params.append(input.name, input.value);

    if (input.type === "number" && input.value !== "") params.append(input.name, input.value);
  });

  return params.toString();
}

async function renderFilteredProducts() {
  const query = serializeFilters();

  const section = document.querySelector(CUSTOM_FILTERS_SELECTORS.customCollection);

  if (!section) return;

  const sectionId = section.dataset.sectionId;

  const url = `${window.location.pathname}?section_id=${sectionId}&${query}`;

  try {
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    const text = await response.text();

    const html = new DOMParser().parseFromString(text, "text/html");

    const newGrid = html.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionGrid);

    const currentGrid = document.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionGrid);

    if (!newGrid) throw new Error("Filtered grid not found in response");

    currentGrid.innerHTML = newGrid.innerHTML;

    query ? window.history.replaceState({}, "", `?${query}`) : window.history.replaceState({}, "", window.location.pathname);
  } catch (err) {
    console.error("Filter rendering failed:", err);

    const grid = document.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionGrid);

    if (grid) grid.innerHTML = `<h3 class="custom-collection__error">${err.message}</h3>`;
  }
}

function initCustomFilters() {
  document.addEventListener("change", (e) => {
    if (e.target.matches(CUSTOM_FILTERS_SELECTORS.customFiltersInput)) renderFilteredProducts();
  });
}

document.addEventListener("DOMContentLoaded", initCustomFilters);
