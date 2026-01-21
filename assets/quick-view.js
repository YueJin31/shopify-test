const QUICK_VIEW_SELECTORS = {
  section: ".js-quick-view",
  quickViewTrigger: ".js-quick-view-trigger",
  quantityContainer: ".js-quick-view-quantity",
  quantityButton: ".js-quick-view-quantity-button",
  quantityInput: ".js-quick-view-quantity-input",
  swiperContainer: ".js-swiper-main",
  swiperThumbsContainer: ".js-swiper-thumbs",
  swiperPagination: ".swiper-pagination",
  swiperPrevBtn: ".swiper-button-prev",
  swiperNextBtn: ".swiper-button-next",
  swiperSlides: ".swiper-slide",
  quickViewContent: ".js-quick-view-content",
  quickViewOptionInput: ".js-quick-view-input",
  quickViewForm: ".js-quick-view-form",
  quickViewAddToCart: ".js-quick-add-to-cart",
  miniCart: ".js-mini-cart",
};

const QUICK_VIEW_CLASSES = {
  closeBtn: "modal__close-button",
  show: "show",
  disabled: "is-disabled",
  active: "is-active",
};

function QuickViewInit() {
  let modal = null;
  let activeTrigger = null;
  let mainSwiper = null;

  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("submit", handleGlobalSubmit);

  function handleGlobalClick(e) {
    const button = e.target.closest(QUICK_VIEW_SELECTORS.quickViewTrigger);

    if (button && !modal && !button.disabled) {
      const handle = button.dataset.productHandle;

      if (!handle) return;

      activeTrigger = button;
      activeTrigger.disabled = true;

      open(handle);

      return;
    }

    if (modal) {
      if (e.target === modal || e.target.closest(`.${QUICK_VIEW_CLASSES.closeBtn}`)) {
        close();

        return;
      }

      const qtyButton = e.target.closest(QUICK_VIEW_SELECTORS.quantityButton);

      if (qtyButton) {
        const container = qtyButton.closest(QUICK_VIEW_SELECTORS.quantityContainer);

        if (!container) return;

        const input = container.querySelector(QUICK_VIEW_SELECTORS.quantityInput);
        let value = parseInt(input.value, 10) || 1;

        if (qtyButton.dataset.action === "plus") value++;
        if (qtyButton.dataset.action === "minus") value = Math.max(1, value - 1);

        input.value = value;

        updateMinusButtonColor(container, value);

        input.dispatchEvent(new Event("input", { bubbles: true }));

        return;
      }

      const optionInput = e.target.closest(QUICK_VIEW_SELECTORS.quickViewOptionInput);

      if (optionInput) {
        updateVariant();
        return;
      }
    }
  }

  function handleGlobalSubmit(e) {
    if (!modal) return;

    const form = e.target.closest(QUICK_VIEW_SELECTORS.quickViewForm);

    if (!form) return;

    e.preventDefault();
    const submitter = e.submitter || form.querySelector(QUICK_VIEW_SELECTORS.quickViewAddToCart);

    if (!submitter) return;

    const formData = new FormData(form);

    handleAddToCart(submitter, formData);
  }

  async function handleAddToCart(button, formData) {
    const variantId = formData.get("id");
    const variantQuantity = formData.get("quantity");

    button.disabled = true;

    try {
      await addItemToCart(variantId, variantQuantity);

      updateMiniCartBubble();

      showCartNotification("Added to cart");

      updateMiniCartSection();
    } catch (error) {
      showCartNotification(error.message, true);

      updateMiniCartBubble();

      updateMiniCartSection();
    } finally {
      document.dispatchEvent(new CustomEvent("cart:update", { bubbles: true, detail: { data: {} } }));
      button.disabled = false;
    }
  }

  function showCartNotification(message, isError = false) {
    document.querySelectorAll(".cart-notification").forEach((el) => el.remove());

    const notification = document.createElement("div");
    notification.classList.add("cart-notification");
    notification.style.background = isError ? "#ef4444" : "#10b981";

    const icon = document.createElement("span");
    icon.textContent = isError ? "❌" : "✅";

    const text = document.createElement("span");
    text.textContent = message;

    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");

    const progress = document.createElement("div");
    progressBar.appendChild(progress);

    notification.append(icon, text, progressBar);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "cartNotificationSlideOut 0.3s ease forwards";
      setTimeout(() => notification.remove(), 300);
    }, 1300);
  }

  function open(handle) {
    fetch(`/products/${handle}?section_id=quick-view`)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newQuickView = doc.querySelector(QUICK_VIEW_SELECTORS.section);

        if (!newQuickView) return;

        document.body.appendChild(newQuickView);
        document.body.style.overflow = "hidden";

        modal = newQuickView;
        activeTrigger.disabled = false;

        requestAnimationFrame(() => modal.classList.add(QUICK_VIEW_CLASSES.show));
        bindModalSwiper(modal);
        initQuantityState();
      })
      .catch((err) => {
        console.error(err);
        if (activeTrigger) activeTrigger.disabled = false;
      });
  }

  function close() {
    if (!modal) return;

    modal.classList.remove(QUICK_VIEW_CLASSES.show);

    const miniCart = document.querySelector(QUICK_VIEW_SELECTORS.miniCart);
    const isMiniCartActive = miniCart?.classList.contains(QUICK_VIEW_CLASSES.active);

    if (!isMiniCartActive) {
      document.body.style.overflow = "";
    }

    if (mainSwiper) {
      mainSwiper.destroy(true, true);
      mainSwiper = null;
    }

    setTimeout(() => {
      modal?.remove();
      modal = null;
    }, 300);
  }

  function initQuantityState() {
    const container = modal.querySelector(QUICK_VIEW_SELECTORS.quantityContainer);

    if (!container) return;

    const input = container.querySelector(QUICK_VIEW_SELECTORS.quantityInput);

    if (!input) return;

    const value = parseInt(input.value, 10) || 1;
    input.value = value;

    updateMinusButtonColor(container, value);

    input.addEventListener("input", (e) => {
      const currentValue = parseInt(e.target.value, 10);

      if (!currentValue || currentValue < 1) {
        updateMinusButtonColor(container, 0);
        return;
      }

      updateMinusButtonColor(container, currentValue);
    });

    input.addEventListener("blur", (e) => {
      let value = parseInt(e.target.value, 10);

      if (!value || value < 1) value = 1;

      e.target.value = value;
      updateMinusButtonColor(container, value);
    });
  }

  function updateMinusButtonColor(container, currentValue) {
    const minusButton = container.querySelector('[data-action="minus"]');

    if (!minusButton) return;

    currentValue < 2 ? minusButton.classList.add(QUICK_VIEW_CLASSES.disabled) : minusButton.classList.remove(QUICK_VIEW_CLASSES.disabled);
  }

  function updateVariant() {
    const content = modal.querySelector(QUICK_VIEW_SELECTORS.quickViewContent);
    const handle = activeTrigger.dataset.productHandle;
    const sectionId = modal.dataset.sectionId;

    const selectedOptionValues = Array.from(content.querySelectorAll('input[type="radio"]:checked')).map(({ dataset }) => dataset.optionValueId);
    const params = selectedOptionValues.length ? `&option_values=${selectedOptionValues.join(",")}` : "";

    fetch(`/products/${handle}?section_id=${sectionId}${params}`)
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newContent = doc.querySelector(QUICK_VIEW_SELECTORS.quickViewContent);

        content.innerHTML = newContent.innerHTML;

        initQuantityState();

        content.querySelectorAll(QUICK_VIEW_SELECTORS.quantityContainer).forEach((container) => {
          const input = container.querySelector(QUICK_VIEW_SELECTORS.quantityInput);

          if (input) updateMinusButtonColor(container, parseInt(input.value, 10) || 1);
        });
      })
      .then(() => {
        const variantObject = JSON.parse(content.querySelector("[data-selected-variant]").innerHTML);

        const mediaId = variantObject?.featured_media?.id;

        if (mediaId) slideToFeaturedMedia(mediaId);
      })
      .catch(console.error);
  }

  function slideToFeaturedMedia(mediaId) {
    if (!mainSwiper || !mediaId) return;

    const index = [...mainSwiper.slides].findIndex((slide) => +slide.dataset.mediaId === mediaId);

    if (index !== -1) mainSwiper.slideTo(index);
  }

  function bindModalSwiper(block) {
    const swiperEl = block.querySelector(QUICK_VIEW_SELECTORS.swiperContainer);
    const swiperThumbs = block.querySelector(QUICK_VIEW_SELECTORS.swiperThumbsContainer);

    if (!swiperEl || !swiperThumbs) return;

    const slidesCount = swiperEl.querySelectorAll(QUICK_VIEW_SELECTORS.swiperSlides).length;
    const paginationEl = swiperEl.querySelector(QUICK_VIEW_SELECTORS.swiperPagination);

    const thumbsSwiper = new Swiper(swiperThumbs, { slidesPerView: 6, spaceBetween: 8 });

    mainSwiper = new Swiper(swiperEl, {
      pagination: { el: paginationEl, clickable: true, dynamicBullets: slidesCount > 6 },
      navigation: {
        nextEl: swiperEl.querySelector(QUICK_VIEW_SELECTORS.swiperNextBtn),
        prevEl: swiperEl.querySelector(QUICK_VIEW_SELECTORS.swiperPrevBtn),
      },
      thumbs: { swiper: thumbsSwiper },
      on: {
        slideChange() {
          swiperEl.querySelectorAll("video").forEach((v) => v.pause());
        },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => QuickViewInit());
