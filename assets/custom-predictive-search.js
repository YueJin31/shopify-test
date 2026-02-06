const CUSTOM_PREDICTIVE_SEARCH_SELECTORS = {
  predictiveSearchSection: ".js-custom-predictive-search-content",

  predictiveSearchButton: ".js-predictive-search-button",

  predictiveSearchModal: ".js-custom-predictive-search",
  predictiveSearchModalCloseBtn: ".js-custom-predictive-search-close",

  predictiveSearchInput: ".js-custom-predictive-search-input",
  predictiveSearchClearBtn: ".js-custom-predictive-search-clear",

  predictiveSearchResultList: ".js-custom-predictive-search-results",

  predictiveSearchTab: ".js-custom-predictive-search-tab",
  predictiveSearchTabContent: ".js-custom-predictive-search-tab-content",
};

const CUSTOM_PREDICTIVE_SEARCH_CLASSES = {
  show: "show",
  active: "is-active",
};

function debounce(fn, delay = 500) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function toggleClearBtn(modal, show) {
  const clearBtn = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchClearBtn);

  if (!clearBtn) return;

  clearBtn.classList.toggle(CUSTOM_PREDICTIVE_SEARCH_CLASSES.active, show);

  clearBtn.setAttribute("tabindex", show ? "0" : "-1");
}

function fetchPredictiveResults(query) {
  const url = `/search/suggest?q=${encodeURIComponent(query)}&resources[type]=product,article,page&section_id=custom-predictive-search`;

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Network error");

      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchSection);
    });
}

const handleInput = debounce(async (e, modal, initialHtml) => {
  const query = e.target.value.trim();
  const wrapper = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchSection);

  toggleClearBtn(modal, query.length > 0);

  if (!query) {
    wrapper.innerHTML = initialHtml;

    return;
  }

  try {
    const content = await fetchPredictiveResults(query);

    if (!content || !content.innerHTML.trim()) {
      wrapper.innerHTML = `<p class="custom-predictive-search__empty">No results found</p>`;

      return;
    }

    wrapper.innerHTML = content.innerHTML;

    requestAnimationFrame(() => {
      updateResultListHeight(modal);
    });
  } catch (err) {
    wrapper.innerHTML = `<p class="custom-predictive-search__error">${err.message}</p>`;
  }
}, 500);

function openModal(modal) {
  updateResultListHeight(modal);

  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    modal.classList.add(CUSTOM_PREDICTIVE_SEARCH_CLASSES.show);
  });

  modal.setAttribute("aria-hidden", "false");

  const input = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchInput);
  window.setTimeout(() => input.focus(), 0);
}

function closeModal(modal) {
  modal.classList.remove(CUSTOM_PREDICTIVE_SEARCH_CLASSES.show);

  document.body.style.overflow = "";

  modal.setAttribute("aria-hidden", "true");
}

function updateResultListHeight(modal) {
  const list = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchResultList);

  if (!list) return;

  const rect = list.getBoundingClientRect();

  const viewportHeight = window.innerHeight;

  const bottomOffset = 16;

  const maxHeight = viewportHeight - rect.top - bottomOffset;

  if (maxHeight > 0) {
    list.style.maxHeight = `${maxHeight}px`;
    list.style.overflowY = "auto";
  }
}

function initCustomPredictiveSearch() {
  const modal = document.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchModal);

  if (!modal) return;

  updateResultListHeight(modal);

  const input = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchInput);
  const wrapper = modal.querySelector(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchSection);

  const initialHtml = wrapper.innerHTML;

  window.addEventListener(
    "resize",
    debounce(() => updateResultListHeight(modal), 150),
  );

  document.addEventListener("click", (e) => {
    if (e.target.closest(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchButton)) {
      openModal(modal);

      return;
    }

    if (e.target === modal || e.target.closest(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchModalCloseBtn)) {
      closeModal(modal);
    }
  });

  document.addEventListener("click", (e) => {
    const tab = e.target.closest(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchTab);

    if (!tab) return;

    const wrapper = tab.closest(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchSection);
    const tabType = tab.dataset.tab;

    const activeTab = wrapper.querySelector(`${CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchTab}.${CUSTOM_PREDICTIVE_SEARCH_CLASSES.active}`);
    const activeTabContent = wrapper.querySelector(`${CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchTabContent}.${CUSTOM_PREDICTIVE_SEARCH_CLASSES.active}`);

    activeTab?.classList.remove(CUSTOM_PREDICTIVE_SEARCH_CLASSES.active);
    activeTabContent?.classList.remove(CUSTOM_PREDICTIVE_SEARCH_CLASSES.active);

    tab.classList.add(CUSTOM_PREDICTIVE_SEARCH_CLASSES.active);
    wrapper.querySelector(`${CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchTabContent}[data-tab-content="${tabType}"]`)?.classList.add(CUSTOM_PREDICTIVE_SEARCH_CLASSES.active);
  });

  document.addEventListener("click", (e) => {
    const clear = e.target.closest(CUSTOM_PREDICTIVE_SEARCH_SELECTORS.predictiveSearchClearBtn);

    if (!clear) return;

    input.value = "";

    toggleClearBtn(modal, false);

    window.setTimeout(() => input.focus(), 0);

    wrapper.innerHTML = initialHtml;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(modal);
    }
  });

  input.addEventListener("input", (e) => {
    toggleClearBtn(modal, e.target.value.trim().length > 0);
    handleInput(e, modal, initialHtml);
  });
}

document.addEventListener("DOMContentLoaded", initCustomPredictiveSearch);
