const MINI_CART_SELECTORS = {
  section: ".js-mini-cart",

  miniCartItem: ".js-mini-cart-item",
  miniCartInner: ".js-mini-cart-inner",
  miniCartActions: ".js-mini-cart-actions",
  miniCartRemoveBtn: ".js-mini-cart-remove-btn",

  quantityContainer: ".js-mini-cart-quantity",
  quantityButton: ".js-mini-cart-quantity-button",
  quantityInput: ".js-mini-cart-quantity-input",

  swiperNextBtn: ".swiper-button-next",
  swiperPrevBtn: ".swiper-button-prev",

  upsellProductsContainer: ".js-upsell-products",
  upsellSwiper: ".js-upsell-swiper",
  upsellAddToCart: ".js-mini-cart-add-to-cart",

  promoProductsContainer: ".js-collection-products",
  promoProductsSwiper: ".js-mini-cart-promo-products-swiper",
  promoProductsItem: ".js-mini-cart-promo-products-item",

  miniCartTermsInput: ".js-mini-cart-terms-checkbox",

  miniCartCheckoutBtn: ".js-mini-cart-checkout-btn",

  miniCartNoteAccordion: ".js-mini-cart-note-accordion",
  miniCartNoteAccordionHeader: ".js-mini-cart-note-accordion-title",
  miniCartNoteAccordionContent: ".js-mini-cart-note-accordion-content",
  miniCartNoteAccordionTextarea: ".js-mini-cart-note-accordion-textarea",
  miniCartNoteAccordionLabel: ".js-mini-cart-note-accordion-label",

  miniCartEmptyLayout: ".js-mini-cart-empty",
};

const MINI_CART_CLASSES = {
  error: "mini-cart__error-message",
  visible: "is-visible",
  loading: "mini-cart--loading",
  loader: "mini-cart__loader",
  spinner: "mini-cart__spinner",
  open: "is-open",
};

let miniCartTermsAccepted = false;

async function updateCart({ block, line, quantity }) {
  showLoader(block);

  const error = await changeCartItem(line, quantity);
  await updateMiniCartSection(block, error, line);

  hideLoader(block);
}

const showLoader = (block) => {
  block.classList.add(MINI_CART_CLASSES.loading);

  if (!block.querySelector(`.${MINI_CART_CLASSES.loader}`)) {
    const loader = document.createElement("div");
    loader.classList.add(MINI_CART_CLASSES.loader);

    const spinner = document.createElement("span");
    spinner.classList.add(MINI_CART_CLASSES.spinner);

    loader.append(spinner);
    block.querySelector(MINI_CART_SELECTORS.miniCartInner).appendChild(loader);
  }
};

const hideLoader = (block) => {
  block.classList.remove(MINI_CART_CLASSES.loading);
  const loader = block.querySelector(`.${MINI_CART_CLASSES.loader}`);

  if (loader) loader.remove();
};

async function changeCartItem(line, quantity) {
  try {
    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ line, quantity }),
    });

    updateMiniCartBubble();

    if (!response.ok) {
      const error = await response.json();

      return error.message || error.description || "Quantity adjusted to available stock";
    }

    return null;
  } catch (error) {
    console.error(error);
    return error.message;
  }
}

function updateCartNote(note) {
  fetch("/cart/update.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      note: note,
    }),
  })
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error updating cart note:", error);
    });
}

const updateMiniCartSection = async (block = document.querySelector(MINI_CART_SELECTORS.section), errorMessage = null, line = null) => {
  try {
    await fetch(`${window.Shopify.routes.root}?section_id=mini-cart`)
      .then((r) => r.text())
      .then(async (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newContent = doc.querySelector(MINI_CART_SELECTORS.section);

        if (newContent) {
          block.innerHTML = newContent.innerHTML;

          initUpsellSwiper(block);
          updateNoteLabel(block);
          restoreTermsState(block);

          if (block.querySelector(MINI_CART_SELECTORS.miniCartEmptyLayout)) {
            initPromoSwiper(block);

            const miniCartCollectionProducts = block?.querySelector(MINI_CART_SELECTORS.promoProductsContainer);

            if (!miniCartCollectionProducts) return;

            initSwatches(miniCartCollectionProducts);
          }
        }
      });

    if (errorMessage && line) {
      const item = block.querySelector(`${MINI_CART_SELECTORS.miniCartItem}[data-line="${line}"]`);

      if (!item) return;

      renderMiniCartError({
        block,
        anchorEl: item,
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

function updateNoteLabel(block) {
  if (!block) return;

  const noteTextarea = block.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionTextarea);
  if (!noteTextarea) return;

  const accordion = noteTextarea.closest(MINI_CART_SELECTORS.miniCartNoteAccordion);
  if (!accordion) return;

  const noteLabel = accordion.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionLabel);
  if (!noteLabel) return;

  const editNoteLabel = noteLabel.dataset?.editLabel;
  if (!editNoteLabel) return;

  noteLabel.textContent = noteTextarea.value.trim() !== "" ? editNoteLabel : noteLabel.dataset.defaultLabel || noteLabel.textContent;
}

function getItemData(target) {
  const item = target.closest(MINI_CART_SELECTORS.miniCartItem);
  const container = target.closest(MINI_CART_SELECTORS.quantityContainer);
  const input = container?.querySelector(MINI_CART_SELECTORS.quantityInput);

  if (!item || !container || !input) return null;

  return {
    item,
    input,
    line: +item.dataset.line,
  };
}

function setupAccordion(block) {
  if (!block) return;

  const openItem = (item) => {
    const content = item.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionContent);
    if (!content) return;

    item.classList.add(MINI_CART_CLASSES.open);
    content.style.maxHeight = `${content.scrollHeight}px`;
  };

  const closeItem = (item) => {
    const content = item.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionContent);
    if (!content) return;

    item.classList.remove(MINI_CART_CLASSES.open);
    content.style.maxHeight = "0px";
  };

  block.addEventListener("click", (e) => {
    const header = e.target.closest(MINI_CART_SELECTORS.miniCartNoteAccordionHeader);

    if (!header || !block.contains(header)) return;

    const item = header.closest(MINI_CART_SELECTORS.miniCartNoteAccordion);

    if (!item) return;

    const openedItem = block.querySelector(`.${MINI_CART_CLASSES.open}`);

    if (item.classList.contains(MINI_CART_CLASSES.open)) {
      closeItem(item);
      return;
    }

    if (openedItem && openedItem !== item) {
      closeItem(openedItem);
    }

    openItem(item);
  });
}

function initUpsellSwiper(block) {
  const swiperEl = block.querySelector(MINI_CART_SELECTORS.upsellSwiper);

  if (!swiperEl) return;

  new Swiper(swiperEl, {
    loop: true,
    navigation: {
      nextEl: swiperEl.closest(MINI_CART_SELECTORS.upsellProductsContainer).querySelector(MINI_CART_SELECTORS.swiperNextBtn),
      prevEl: swiperEl.closest(MINI_CART_SELECTORS.upsellProductsContainer).querySelector(MINI_CART_SELECTORS.swiperPrevBtn),
    },
  });
}

function initPromoSwiper(block) {
  const swiperEl = block.querySelector(MINI_CART_SELECTORS.promoProductsSwiper);

  if (!swiperEl) return;

  const slidesCount = swiperEl.querySelectorAll(MINI_CART_SELECTORS.promoProductsItem).length;

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: slidesCount > 3,
    navigation: {
      nextEl: swiperEl.closest(MINI_CART_SELECTORS.promoProductsContainer).querySelector(MINI_CART_SELECTORS.swiperNextBtn),
      prevEl: swiperEl.closest(MINI_CART_SELECTORS.promoProductsContainer).querySelector(MINI_CART_SELECTORS.swiperPrevBtn),
    },
  });
}

function handleNoteTextArea(block) {
  if (!block) return;

  block.addEventListener("change", (e) => {
    const textarea = e.target.closest(MINI_CART_SELECTORS.miniCartNoteAccordionTextarea);
    if (!textarea || !block.contains(textarea)) return;

    const note = textarea.value.trim();

    updateNoteLabel(block);
    updateCartNote(note);
  });
}

async function handleAddToMiniCart(button) {
  const variantId = button.dataset.variantId;

  const block = button.closest(MINI_CART_SELECTORS.section);

  if (!block) return;

  button.disabled = true;
  showLoader(block);

  try {
    await addItemToCart(variantId);

    updateMiniCartBubble();

    await updateMiniCartSection(block);
  } catch (error) {
    renderMiniCartError({
      block,
      anchorEl: button,
      message: error || "Unable to add this item to the cart",
    });
  } finally {
    hideLoader(block);
    button.disabled = false;
  }
}

function renderMiniCartError({ block, anchorEl, message }) {
  if (!block || !anchorEl || !message) return;

  const actions = anchorEl.querySelector(MINI_CART_SELECTORS.miniCartActions) || anchorEl.closest(MINI_CART_SELECTORS.miniCartActions);

  if (!actions) return;

  actions.querySelectorAll(`.${MINI_CART_CLASSES.error}`).forEach((el) => el.remove());

  const errorEl = document.createElement("span");
  errorEl.className = MINI_CART_CLASSES.error;
  errorEl.textContent = message;

  actions.appendChild(errorEl);

  requestAnimationFrame(() => {
    errorEl.classList.add(MINI_CART_CLASSES.visible);
  });
}

function restoreTermsState(block) {
  if (!block) return;

  const termsInput = block.querySelector(MINI_CART_SELECTORS.miniCartTermsInput);
  const checkoutBtn = block.querySelector(MINI_CART_SELECTORS.miniCartCheckoutBtn);

  if (!termsInput || !checkoutBtn) return;

  termsInput.checked = miniCartTermsAccepted;
  checkoutBtn.disabled = !miniCartTermsAccepted;
}

function initMiniCart(block) {
  initUpsellSwiper(block);
  initPromoSwiper(block);
  setupAccordion(block);
  handleNoteTextArea(block);
  updateNoteLabel(block);

  block.addEventListener("click", (e) => {
    const button = e.target.closest(MINI_CART_SELECTORS.upsellAddToCart);

    if (!button) return;

    handleAddToMiniCart(button);
  });

  block.addEventListener("click", (e) => {
    const button = e.target.closest(MINI_CART_SELECTORS.quantityButton);
    if (!button) return;

    const container = button.closest(MINI_CART_SELECTORS.quantityContainer);
    if (!container) return;

    const data = getItemData(button);
    if (!data) return;

    let quantity = parseInt(data.input.value, 10) || 1;

    if (button.dataset.action === "plus") quantity++;
    if (button.dataset.action === "minus") quantity = Math.max(1, quantity - 1);

    data.input.value = quantity;

    updateCart({
      block,
      line: data.line,
      quantity,
    });
  });

  block.addEventListener("click", (e) => {
    const miniCartRemoveBtn = e.target.closest(MINI_CART_SELECTORS.miniCartRemoveBtn);

    if (!miniCartRemoveBtn) return;

    const item = miniCartRemoveBtn.closest(MINI_CART_SELECTORS.miniCartItem);

    if (!item) return;

    const line = +item.dataset.line;

    if (!line) return;

    updateCart({
      block,
      line,
      quantity: 0,
    });
  });

  block.addEventListener("change", (e) => {
    const termsInput = e.target.closest(MINI_CART_SELECTORS.miniCartTermsInput);

    if (!termsInput) return;

    miniCartTermsAccepted = termsInput.checked;

    const checkoutBtn = block.querySelector(MINI_CART_SELECTORS.miniCartCheckoutBtn);

    if (checkoutBtn) checkoutBtn.disabled = !miniCartTermsAccepted;
  });

  block.addEventListener(
    "focus",
    (e) => {
      if (!e.target.matches(MINI_CART_SELECTORS.quantityInput)) return;

      e.target.dataset.prevValue = e.target.value;
    },
    true,
  );

  block.addEventListener(
    "change",
    (e) => {
      if (!e.target.matches(MINI_CART_SELECTORS.quantityInput)) return;

      const input = e.target;
      const container = input.closest(MINI_CART_SELECTORS.quantityContainer);
      const item = input.closest(MINI_CART_SELECTORS.miniCartItem);

      if (!item || !container) return;

      const line = +item.dataset.line;
      const prevQuantity = parseInt(input.dataset.prevValue, 10) || 1;

      let quantity = parseInt(input.value, 10);

      if (!quantity || quantity < 1) {
        quantity = prevQuantity;
        input.value = quantity;
      }

      updateCart({
        block,
        line,
        quantity,
      });
    },
    true,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(MINI_CART_SELECTORS.section).forEach(initMiniCart);
});
