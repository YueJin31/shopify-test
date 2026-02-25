const TREND_PRODUCTS_SELECTORS = {
  section: ".js-trend-products",
  trendProductSpotButton: ".js-trend-products-spot-button",
  trendProductSpotContent: ".js-trend-products-spot-content",
  trendProductItem: ".js-trend-products-item",
};

const TREND_PRODUCTS_CLASSES = {
  active: "is-active",
};

function debounce(fn, delay = 300) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function positionSpotContent(button, content) {
  const parent = button.closest(TREND_PRODUCTS_SELECTORS.trendProductItem);

  const parentRect = parent.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();

  const contentWidth = content.offsetWidth;
  const contentHeight = content.offsetHeight;

  let left = buttonRect.left - parentRect.left + buttonRect.width / 2 - contentWidth / 2;

  let top = buttonRect.top - parentRect.top - contentHeight - 4;

  if (left < 4) left = 4;

  if (left + contentWidth > parent.offsetWidth - 4) left = parent.offsetWidth - contentWidth - 4;

  if (top < 4) top = buttonRect.bottom - parentRect.top + 4;

  content.style.left = `${left}px`;
  content.style.top = `${top}px`;
}

function closeActiveSpot(section) {
  const activeButton = section.querySelector(`${TREND_PRODUCTS_SELECTORS.trendProductSpotButton}.${TREND_PRODUCTS_CLASSES.active}`);

  if (!activeButton) return;

  const activeContent = activeButton.nextElementSibling;

  activeButton.classList.remove(TREND_PRODUCTS_CLASSES.active);
  activeContent?.classList.remove(TREND_PRODUCTS_CLASSES.active);
}

function initTrendProductsSection(section) {
  section.addEventListener("click", (e) => {
    const button = e.target.closest(TREND_PRODUCTS_SELECTORS.trendProductSpotButton);

    if (button) {
      e.stopPropagation();

      const content = button.nextElementSibling;

      if (!content || !content.matches(TREND_PRODUCTS_SELECTORS.trendProductSpotContent)) {
        return;
      }

      const isActive = content.classList.contains(TREND_PRODUCTS_CLASSES.active);

      closeActiveSpot(section);

      if (!isActive) {
        positionSpotContent(button, content);

        content.classList.add(TREND_PRODUCTS_CLASSES.active);
        button.classList.add(TREND_PRODUCTS_CLASSES.active);
      }

      return;
    }

    if (e.target.closest(TREND_PRODUCTS_SELECTORS.trendProductSpotContent)) {
      return;
    }

    closeActiveSpot(section);
  });

  const debouncedResize = debounce(() => {
    document.querySelectorAll(`${TREND_PRODUCTS_SELECTORS.trendProductSpotButton}.${TREND_PRODUCTS_CLASSES.active}`).forEach((button) => {
      const content = button.nextElementSibling;

      if (content) positionSpotContent(button, content);
    });
  }, 300);

  window.addEventListener("resize", debouncedResize);
}

function initTrendProducts() {
  document.querySelectorAll(TREND_PRODUCTS_SELECTORS.section).forEach((section) => {
    initTrendProductsSection(section);
  });
}

document.addEventListener("DOMContentLoaded", initTrendProducts);
