class QuickView {
  QUICK_VIEW_SELECTORS = {
    section: ".js-quick-view",
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
  };

  MODALS_CLASSES = {
    modal: "modal",
    modalContent: "modal__content",
    modalInner: "modal__inner-content",
    closeBtn: "modal__close-button",
    show: "show",
  };

  modal = null;
  activeTrigger = null;
  mainSwiper = null;

  constructor() {
    document.addEventListener("click", this.handleGlobalClick);
    document.addEventListener("input", this.handleGlobalInput);
    document.addEventListener("submit", this.handleGlobalSubmit);
  }

  handleGlobalClick = (e) => {
    const button = e.target.closest(this.QUICK_VIEW_SELECTORS.section);

    if (button && !this.modal && !button.disabled) {
      const handle = button.dataset.productHandle;

      if (!handle) return;

      this.activeTrigger = button;
      this.disableTriggers();
      this.open(handle);

      return;
    }

    if (this.modal) {
      if (e.target === this.modal || e.target.closest(`.${this.MODALS_CLASSES.closeBtn}`)) {
        this.close();
        return;
      }

      const qtyButton = e.target.closest(this.QUICK_VIEW_SELECTORS.quantityButton);

      if (qtyButton) {
        const container = qtyButton.closest(this.QUICK_VIEW_SELECTORS.quantityContainer);

        if (!container) return;

        const input = container.querySelector(this.QUICK_VIEW_SELECTORS.quantityInput);
        let value = parseInt(input.value, 10) || 1;

        if (qtyButton.dataset.action === "plus") value++;
        if (qtyButton.dataset.action === "minus") value = Math.max(1, value - 1);

        input.value = value;

        return;
      }

      const optionInput = e.target.closest(this.QUICK_VIEW_SELECTORS.quickViewOptionInput);

      if (optionInput) {
        this.updateVariant();

        return;
      }
    }
  };

  slideToFeaturedMedia(mediaId) {
    if (!this.mainSwiper || !mediaId) return;

    const index = [...this.mainSwiper.slides].findIndex((slide) => +slide.dataset.mediaId === mediaId);

    if (index !== -1) {
      this.mainSwiper.slideTo(index);
    }
  }

  handleGlobalInput = (e) => {
    if (!this.modal) return;

    if (e.target.matches(this.QUICK_VIEW_SELECTORS.quantityInput)) {
      let value = parseInt(e.target.value, 10);
      if (value < 0 || isNaN(value)) e.target.value = 0;
    }

    const content = this.modal.querySelector(this.QUICK_VIEW_SELECTORS.quickViewContent);

    content.addEventListener(
      "blur",
      (e) => {
        if (!e.target.matches(this.QUICK_VIEW_SELECTORS.quantityInput)) return;

        let value = parseInt(e.target.value, 10);
        if (!value || value < 1) e.target.value = 1;
      },
      true
    );
  };

  handleGlobalSubmit = async (e) => {
    if (!this.modal) return;

    const form = e.target.closest(this.QUICK_VIEW_SELECTORS.quickViewForm);
    if (!form) return;

    e.preventDefault();

    try {
      const submitter = e.submitter || form.querySelector(this.QUICK_VIEW_SELECTORS.quickViewAddToCart);
      if (!submitter) return;

      const formData = new FormData(form);

      await this.handleAddToCart(submitter, formData);
    } catch (error) {
      console.error("QuickView submit error:", error);
    }
  };

  handleAddToCart = async (button, formData) => {
    const variantId = formData.get("id");
    const variantQuantity = formData.get("quantity");

    button.disabled = true;

    try {
      await addItemToCart(variantId, variantQuantity);

      dispatchCartUpdate(variantId, variantQuantity);
      showCartNotification("Added to cart");
    } catch (error) {
      showCartNotification(error.message, true);
    } finally {
      document.dispatchEvent(
        new CustomEvent(CART_EVENTS.update, {
          bubbles: true,
          detail: {
            data: {},
          },
        })
      );

      button.disabled = false;
    }
  };

  open(handle) {
    fetch(`/products/${handle}?section_id=quick-view`)
      .then((res) => res.text())
      .then((html) => {
        this.createModal(html);
        this.bindModalSwiper(this.modal);
      })
      .catch((err) => {
        console.error(err);
        this.enableTriggers();
      });
  }

  updateVariant() {
    const content = this.modal.querySelector(this.QUICK_VIEW_SELECTORS.quickViewContent);
    const handle = this.activeTrigger.dataset.productHandle;
    const sectionId = this.modal.querySelector(this.QUICK_VIEW_SELECTORS.section).dataset.sectionId;

    const selectedOptionValues = Array.from(content.querySelectorAll('input[type="radio"]:checked')).map(({ dataset }) => dataset.optionValueId);

    const params = selectedOptionValues.length ? `&option_values=${selectedOptionValues.join(",")}` : "";

    fetch(`/products/${handle}?section_id=${sectionId}${params}`)
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newContent = doc.querySelector(this.QUICK_VIEW_SELECTORS.quickViewContent);

        content.innerHTML = newContent.innerHTML;
      })
      .then(() => {
        const variantObject = JSON.parse(content.querySelector("[data-selected-variant]").innerHTML);

        const mediaId = variantObject?.featured_media?.id;
        if (mediaId) this.slideToFeaturedMedia(mediaId);
      })
      .catch(console.error);
  }

  createModal(html) {
    const modal = document.createElement("div");
    modal.classList.add(this.MODALS_CLASSES.modal);

    modal.innerHTML = `
      <div class="${this.MODALS_CLASSES.modalContent}">
        <button class="${this.MODALS_CLASSES.closeBtn}" type="button"></button>
        <div class="${this.MODALS_CLASSES.modalInner}">${html}</div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => modal.classList.add(this.MODALS_CLASSES.show));

    this.modal = modal;
  }

  bindModalSwiper(block) {
    const swiperEl = block.querySelector(this.QUICK_VIEW_SELECTORS.swiperContainer);
    const swiperThumbs = block.querySelector(this.QUICK_VIEW_SELECTORS.swiperThumbsContainer);

    if (!swiperEl || !swiperThumbs) return;

    const slidesCount = swiperEl.querySelectorAll(this.QUICK_VIEW_SELECTORS.swiperSlides).length;
    const paginationEl = swiperEl.querySelector(this.QUICK_VIEW_SELECTORS.swiperPagination);

    const thumbsSwiper = new Swiper(swiperThumbs, {
      slidesPerView: 6,
      spaceBetween: 8,
    });

    this.mainSwiper = new Swiper(swiperEl, {
      pagination: {
        el: paginationEl,
        clickable: true,
        dynamicBullets: slidesCount > 6,
      },
      navigation: {
        nextEl: swiperEl.querySelector(this.QUICK_VIEW_SELECTORS.swiperNextBtn),
        prevEl: swiperEl.querySelector(this.QUICK_VIEW_SELECTORS.swiperPrevBtn),
      },
      thumbs: {
        swiper: thumbsSwiper,
      },
      on: {
        slideChange() {
          swiperEl.querySelectorAll("video").forEach((v) => v.pause());
        },
      },
    });

    this.handleSwiperUI = () => {
      if (!this.mainSwiper) return;

      if (window.innerWidth < 768) {
        this.mainSwiper.pagination?.enable();
        this.mainSwiper.navigation?.disable();
      } else {
        this.mainSwiper.pagination?.disable();
        this.mainSwiper.navigation?.enable();
      }
    };

    this.debouncedResize = this.debounce(this.handleSwiperUI, 200);

    this.handleSwiperUI();

    window.addEventListener("resize", this.debouncedResize);
  }

  debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  close() {
    if (!this.modal) return;

    this.modal.classList.remove(this.MODALS_CLASSES.show);
    document.body.style.overflow = "";

    if (this.mainSwiper) {
      this.mainSwiper.destroy(true, true);
      this.mainSwiper = null;
    }

    setTimeout(() => {
      this.modal.remove();
      this.modal = null;
      this.enableTriggers();
    }, 300);
  }

  disableTriggers() {
    document.querySelectorAll(this.QUICK_VIEW_SELECTORS.section).forEach((btn) => (btn.disabled = true));
  }

  enableTriggers() {
    document.querySelectorAll(this.QUICK_VIEW_SELECTORS.section).forEach((btn) => (btn.disabled = false));
  }
}

document.addEventListener("DOMContentLoaded", () => new QuickView());
