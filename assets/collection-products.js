const COLLECTION_SELECTORS = {
  section: ".js-collection-products",
  productImage: ".js-collection-products-item-image",
  productPicture: ".js-collection-products-item-picture",
  productItem: ".js-collection-products-item",
  productPrice: ".js-collection-products-item-price",
  productComparePrice: ".js-collection-products-compare-price",
  productAddToCart: ".js-add-to-cart",
  swatchContainer: ".js-color-swatch",
  swatchItem: ".js-color-swatch-item",
  swiperContainer: ".swiper",
  swiperPagination: ".swiper-pagination",
  swiperPrevBtn: ".swiper-button-prev",
  swiperNextBtn: ".swiper-button-next",
};

const COLLECTION_CLASSES = {
  active: "is-active",
  hidden: "hidden",
};

function initSwatches(block) {
  block.addEventListener("click", (e) => {
    const swatch = e.target.closest(COLLECTION_SELECTORS.swatchItem);
    if (!swatch) return;

    const productItem = swatch.closest(COLLECTION_SELECTORS.productItem);
    if (!productItem) return;

    const swatches = productItem.querySelector(COLLECTION_SELECTORS.swatchContainer);
    if (!swatches) return;

    setActiveSwatch(swatches, swatch);
    updateProductUI(productItem, swatch.dataset);
  });
}

function setActiveSwatch(container, current) {
  const active = container.querySelector(`${COLLECTION_SELECTORS.swatchItem}.${COLLECTION_CLASSES.active}`);

  active?.classList.remove(COLLECTION_CLASSES.active);
  current.classList.add(COLLECTION_CLASSES.active);
}

function updateProductUI(productItem, { variantPrice, variantComparePrice, variantId, variantQuantity }) {
  const currentProductImage = productItem.querySelector(`${COLLECTION_SELECTORS.productPicture}[data-variant-id="${variantId}"]`);
  const activeProductImages = productItem.querySelectorAll(`${COLLECTION_SELECTORS.productPicture}:not(${COLLECTION_CLASSES.hidden})`);

  if (currentProductImage) {
    activeProductImages.forEach((el) => el.classList.add(COLLECTION_CLASSES.hidden));
    currentProductImage.classList.remove(COLLECTION_CLASSES.hidden);
  }

  const productPriceElement = productItem.querySelector(COLLECTION_SELECTORS.productPrice);
  if (variantPrice && productPriceElement) {
    productPriceElement.textContent = variantPrice;
  }

  const productComparePrice = productItem.querySelector(COLLECTION_SELECTORS.productComparePrice);
  const hasVariantCompare = !!variantComparePrice;

  if (hasVariantCompare) {
    if (productComparePrice) {
      productComparePrice.textContent = variantComparePrice;
    } else {
      const comparePrice = document.createElement("span");
      comparePrice.className = "collection-products__item-price collection-products__item-price--old js-collection-products-compare-price";
      comparePrice.textContent = variantComparePrice;
      productPriceElement.after(comparePrice);
    }
  } else if (productComparePrice) {
    productComparePrice.remove();
  }

  const productAddToCartBtn = productItem.querySelector(COLLECTION_SELECTORS.productAddToCart);

  if (productAddToCartBtn) {
    productAddToCartBtn.dataset.variantId = variantId;
    productAddToCartBtn.dataset.availableQuantity = variantQuantity;
    productAddToCartBtn.disabled = +variantQuantity < 1;
  }
}

function initSwiper(block) {
  const swiperEl = block.querySelector(COLLECTION_SELECTORS.swiperContainer);
  if (!swiperEl) return;

  const slidesCount = swiperEl.querySelectorAll(COLLECTION_SELECTORS.productItem).length;

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: slidesCount > 3,
    pagination: {
      el: swiperEl.querySelector(COLLECTION_SELECTORS.swiperPagination),
      clickable: true,
      dynamicBullets: slidesCount > 17,
    },
    navigation: {
      nextEl: swiperEl.querySelector(COLLECTION_SELECTORS.swiperNextBtn),
      prevEl: swiperEl.querySelector(COLLECTION_SELECTORS.swiperPrevBtn),
    },
    breakpoints: {
      1280: {
        slidesPerView: 3,
      },
    },
  });
}

function initCollection() {
  document.querySelectorAll(COLLECTION_SELECTORS.section).forEach((block) => {
    initSwatches(block);
    initSwiper(block);
  });
}

document.addEventListener("DOMContentLoaded", initCollection);
["shopify:section:load", "shopify:section:select", "shopify:section:reorder"].forEach((event) => {
  document.addEventListener(event, initCollection);
});
