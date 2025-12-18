const COLLECTION_SELECTORS = {
  block: ".js-collection-products",
  swatchContainer: ".js-color-watch",
  swatchItem: ".js-color-watch-item",
  swiperContainer: ".swiper",
  swiperPagination: ".swiper-pagination",
  swiperPrevBtn: ".swiper-button-prev",
  swiperNextBtn: ".swiper-button-next",
};

const COLLECTION_CLASSES = {
  active: "is-active",
};

function initSwatches(block) {
  const swatches = block.querySelector(COLLECTION_SELECTORS.swatchContainer);
  if (!swatches) return;

  swatches.addEventListener("click", (e) => {
    const swatch = e.target.closest(COLLECTION_SELECTORS.swatchItem);
    if (!swatch) return;

    swatches.querySelectorAll(COLLECTION_SELECTORS.swatchItem).forEach((item) => item.classList.remove(COLLECTION_CLASSES.active));

    swatch.classList.add(COLLECTION_CLASSES.active);
  });
}

function initSwiper(block) {
  const swiperEl = block.querySelector(COLLECTION_SELECTORS.swiperContainer);

  if (!swiperEl) return;

  const swiperPagination = swiperEl.querySelector(COLLECTION_SELECTORS.swiperPagination);
  const swiperPrevBtn = swiperEl.querySelector(COLLECTION_SELECTORS.swiperPrevBtn);
  const swiperNextBtn = swiperEl.querySelector(COLLECTION_SELECTORS.swiperNextBtn);

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: true,
    pagination: {
      el: swiperPagination,
      clickable: true,
    },
    navigation: {
      nextEl: swiperNextBtn,
      prevEl: swiperPrevBtn,
    },
    breakpoints: {
      1280: {
        slidesPerView: 3,
      },
    },
  });
}

function InitCollection() {
  document.querySelectorAll(COLLECTION_SELECTORS.block).forEach((block) => {
    initSwatches(block);
    initSwiper(block);
  });
}

document.addEventListener("DOMContentLoaded", InitCollection);
document.addEventListener("shopify:section:load", InitCollection);
