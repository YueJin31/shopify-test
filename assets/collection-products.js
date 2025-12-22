const COLLECTION_SELECTORS = {
  block: ".js-collection-products",
  productImage: ".js-collection-products-item-image",
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
};

function initSwatches(block) {
  const productItems = block.querySelectorAll(COLLECTION_SELECTORS.productItem);
  if (!productItems) return;

  productItems.forEach((productItem) => {
    const swatches = productItem.querySelector(COLLECTION_SELECTORS.swatchContainer);

    if (!swatches) return;

    const productImages = productItem.querySelectorAll(COLLECTION_SELECTORS.productImage);
    const productPrice = productItem.querySelector(COLLECTION_SELECTORS.productPrice);
    const productComparePrice = productItem.querySelector(COLLECTION_SELECTORS.productComparePrice);
    const productAddToCartBtn = productItem.querySelector(COLLECTION_SELECTORS.productAddToCart);

    swatches.addEventListener("click", (e) => {
      const swatch = e.target.closest(COLLECTION_SELECTORS.swatchItem);
      if (!swatch) return;

      const { variantImage, variantPrice, variantComparePrice, variantId, variantQuantity } = swatch.dataset;

      setActiveSwatch(swatches, swatch);
      updateProductUI({
        productImages,
        productPrice,
        productComparePrice,
        productAddToCartBtn,
        variantImage,
        variantPrice,
        variantComparePrice,
        variantId,
        variantQuantity,
      });
    });
  });
}

function setActiveSwatch(container, current) {
  const active = container.querySelector(`${COLLECTION_SELECTORS.swatchItem}.${COLLECTION_CLASSES.active}`);

  active?.classList.remove(COLLECTION_CLASSES.active);
  current.classList.add(COLLECTION_CLASSES.active);
}

function updateProductUI({ productImages, productPrice, productComparePrice, productAddToCartBtn, variantImage, variantPrice, variantComparePrice, variantId, variantQuantity }) {
  if (variantImage) {
    productImages.forEach((productImage) => {
      productImage.src = variantImage;
      productImage.srcset = `${variantImage} 1x, ${variantImage} 2x`;
    });
  }

  if (variantPrice) productPrice.textContent = variantPrice;
  if (variantComparePrice) productComparePrice.textContent = variantComparePrice;

  productAddToCartBtn.dataset.variantId = variantId;
  productAddToCartBtn.dataset.availableQuantity = variantQuantity;
  productAddToCartBtn.disabled = Number(variantQuantity) < 1;
}

function initSwiper(block) {
  const swiperEl = block.querySelector(COLLECTION_SELECTORS.swiperContainer);
  if (!swiperEl) return;

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: true,
    pagination: {
      el: swiperEl.querySelector(COLLECTION_SELECTORS.swiperPagination),
      clickable: true,
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
  document.querySelectorAll(COLLECTION_SELECTORS.block).forEach((block) => {
    initSwatches(block);
    initSwiper(block);
  });
}

document.addEventListener("DOMContentLoaded", initCollection);
["shopify:section:load", "shopify:section:select", "shopify:section:reorder"].forEach((event) => {
  document.addEventListener(event, initCollection);
});
