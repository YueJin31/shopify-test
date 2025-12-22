const COLLECTION_SELECTORS = {
  section: ".js-collection-products",
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
  if (!productItems.length) return;

  productItems.forEach((productItem) => {
    const swatches = productItem.querySelector(COLLECTION_SELECTORS.swatchContainer);
    if (!swatches) return;

    swatches.addEventListener("click", (e) => {
      const swatch = e.target.closest(COLLECTION_SELECTORS.swatchItem);

      if (!swatch) return;

      setActiveSwatch(swatches, swatch);

      updateProductUI(productItem, swatch.dataset);
    });
  });
}

function setActiveSwatch(container, current) {
  const active = container.querySelector(`${COLLECTION_SELECTORS.swatchItem}.${COLLECTION_CLASSES.active}`);

  active?.classList.remove(COLLECTION_CLASSES.active);
  current.classList.add(COLLECTION_CLASSES.active);
}

function updateProductUI(productItem, { variantImage, variantPrice, variantComparePrice, variantId, variantQuantity }) {
  const productImages = productItem.querySelectorAll(COLLECTION_SELECTORS.productImage);
  const productPrice = productItem.querySelector(COLLECTION_SELECTORS.productPrice);
  const productComparePrice = productItem.querySelector(COLLECTION_SELECTORS.productComparePrice);
  const productAddToCartBtn = productItem.querySelector(COLLECTION_SELECTORS.productAddToCart);

  if (variantImage) {
    productImages.forEach((img) => {
      img.src = variantImage;
      img.srcset = `${variantImage} 1x, ${variantImage} 2x`;
    });
  }

  if (variantPrice && productPrice) {
    productPrice.textContent = variantPrice;
  }

  const hasVariantCompare = !!variantComparePrice;
  const hasCompareEl = !!productComparePrice;

  if (hasVariantCompare) {
    if (hasCompareEl) {
      productComparePrice.textContent = variantComparePrice;
    } else {
      const comparePrice = document.createElement("span");
      comparePrice.className = "collection-products__item-price collection-products__item-price--old js-collection-products-compare-price";
      comparePrice.textContent = variantComparePrice;

      productPrice.after(comparePrice);
    }
  } else if (hasCompareEl) {
    productComparePrice.remove();
  }

  if (productAddToCartBtn) {
    productAddToCartBtn.dataset.variantId = variantId;
    productAddToCartBtn.dataset.availableQuantity = variantQuantity;
    productAddToCartBtn.disabled = +variantQuantity < 1;
  }
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
  document.querySelectorAll(COLLECTION_SELECTORS.section).forEach((block) => {
    initSwatches(block);
    initSwiper(block);
  });
}

document.addEventListener("DOMContentLoaded", initCollection);
["shopify:section:load", "shopify:section:select", "shopify:section:reorder"].forEach((event) => {
  document.addEventListener(event, initCollection);
});
