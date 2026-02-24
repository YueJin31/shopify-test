const CUSTOM_FILTERS_SELECTORS = {
  customFiltersInput: ".js-custom-filters-input",
  customCollectionGrid: ".js-custom-collection-list",
  customCollection: ".js-custom-collection",
  customCollectionActiveFiltersWrapper: ".custom-collection__filters-wrapper",
  customCollectionFilters: ".js-custom-collection-active-filters",
  customCollectionRemoveFilter: ".js-custom-collection-remove-filter",
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

    if (newGrid && currentGrid) {
      currentGrid.innerHTML = newGrid.innerHTML;
    }

    const newActiveFilters = html.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionFilters);

    const wrapper = document.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionActiveFiltersWrapper);

    const currentActiveFilters = wrapper?.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionFilters);

    if (newActiveFilters) {
      if (currentActiveFilters) {
        currentActiveFilters.replaceWith(newActiveFilters);
      } else {
        wrapper.prepend(newActiveFilters);
      }
    } else if (currentActiveFilters) {
      currentActiveFilters.remove();
    }

    query ? window.history.replaceState({}, "", `?${query}`) : window.history.replaceState({}, "", window.location.pathname);
  } catch (err) {
    console.error("Filter rendering failed:", err);

    const grid = document.querySelector(CUSTOM_FILTERS_SELECTORS.customCollectionGrid);

    if (grid) {
      grid.innerHTML = `<h3 class="custom-collection__error">${err.message}</h3>`;
    }
  }
}

function removeFilter(paramName, value) {
  const inputs = document.querySelectorAll(`${CUSTOM_FILTERS_SELECTORS.customFiltersInput}[name="${paramName}"]`);

  inputs.forEach((input) => {
    if (input.type === "checkbox" && input.value === value) {
      input.checked = false;
    }

    if (input.type === "number") {
      input.value = "";
    }
  });

  renderFilteredProducts();
}

function clearAllFilters() {
  document.querySelectorAll(CUSTOM_FILTERS_SELECTORS.customFiltersInput).forEach((input) => {
    if (input.type === "checkbox") input.checked = false;
    if (input.type === "number") input.value = "";
  });

  renderFilteredProducts();
}

function initCustomFilters() {
  document.addEventListener("change", (e) => {
    if (e.target.matches(CUSTOM_FILTERS_SELECTORS.customFiltersInput)) renderFilteredProducts();
  });

  document.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(CUSTOM_FILTERS_SELECTORS.customCollectionRemoveFilter);

    if (removeBtn) {
      const param = removeBtn.dataset.paramName;
      const value = removeBtn.dataset.value;

      removeFilter(param, value);
    }
  });
}

document.addEventListener("DOMContentLoaded", initCustomFilters);
