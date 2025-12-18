const COLLECTION_SELECTORS = {
  block: ".js-collection-products",
  swatchContainer: ".js-color-watch",
  swatchItem: ".js-color-watch-item",
  swiperContainer: ".swiper",
  swiperSlide: ".swiper-slide",
  swiperPagination: ".swiper-pagination",
  swiperPrevBtn: "swiper-button-prev",
  swiperNextBtn: "swiper-button-next",
};

const COLLECTION_CLASSES = {
  active: "is-active",
  pagination: "swiper-pagination",
  prev: "swiper-button-prev",
  next: "swiper-button-next",
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

  const slidesCount = swiperEl.querySelectorAll(COLLECTION_SELECTORS.swiperSlide).length;
  const needControls = slidesCount > 3;

  let paginationEl = null;
  let prevEl = null;
  let nextEl = null;

  if (needControls) {
    paginationEl = swiperEl.querySelector(COLLECTION_SELECTORS.swiperPagination) || document.createElement("div");
    prevEl = swiperEl.querySelector(COLLECTION_SELECTORS.swiperPrevBtn) || document.createElement("div");
    nextEl = swiperEl.querySelector(COLLECTION_SELECTORS.swiperNextBtn) || document.createElement("div");

    paginationEl.className = COLLECTION_CLASSES.pagination;
    prevEl.className = COLLECTION_CLASSES.prev;
    nextEl.className = COLLECTION_CLASSES.next;

    swiperEl.append(paginationEl, prevEl, nextEl);
  }

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: needControls,
    watchOverflow: true,
    pagination: needControls
      ? {
          el: paginationEl,
          clickable: true,
        }
      : false,

    navigation: needControls
      ? {
          prevEl,
          nextEl,
        }
      : false,

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
