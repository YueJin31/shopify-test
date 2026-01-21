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

  collectionProductsContainer: ".js-collection-products",
  collectionProductsSwiper: ".js-collection-products-swiper",
  collectionProductsItem: ".js-collection-products-item",

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
  disable: "is-disabled",
  loading: "mini-cart--loading",
  loader: "mini-cart__loader",
  spinner: "mini-cart__spinner",
  open: "is-open",
};

const cartUpdateTimers = new Map();

function debounceCartUpdate({ block, line, quantity }, delay = 400) {
  if (cartUpdateTimers.has(line)) {
    clearTimeout(cartUpdateTimers.get(line));
  }

  const timer = setTimeout(async () => {
    showLoader(block);

    const error = await changeCartItem(line, quantity);
    await updateMiniCartSection(block, error, line);

    hideLoader(block);
    cartUpdateTimers.delete(line);
  }, delay);

  cartUpdateTimers.set(line, timer);
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

          initMinusButtonsState(block);
          setupAccordion(block);
          initUpsellSwiper(block);
          handleNoteTextArea(block);
          updateNoteLabel(block);

          if (block.querySelector(MINI_CART_SELECTORS.miniCartEmptyLayout)) {
            initCollectionSwiper(block);

            const miniCartCollectionProducts = block?.querySelector(MINI_CART_SELECTORS.collectionProductsContainer);
            if (!miniCartCollectionProducts) return;

            initSwatches(miniCartCollectionProducts);
          }
        }
      });

    if (errorMessage && line) {
      const item = block.querySelector(`${MINI_CART_SELECTORS.miniCartItem}[data-line="${line}"]`);
      const actions = item?.querySelector(MINI_CART_SELECTORS.miniCartActions);
      if (!actions) return;

      const errorEl = document.createElement("span");
      errorEl.className = MINI_CART_CLASSES.error;
      errorEl.textContent = errorMessage;
      actions.appendChild(errorEl);

      requestAnimationFrame(() => errorEl.classList.add(MINI_CART_CLASSES.visible));

      setTimeout(() => {
        errorEl.classList.remove(MINI_CART_CLASSES.visible);
        errorEl.addEventListener("transitionend", () => errorEl.remove(), { once: true });
      }, 1500);
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

function updateMinusButtonState(container, currentValue) {
  const minusButton = container.querySelector('[data-action="minus"]');

  if (!minusButton) return;

  currentValue < 2 ? minusButton.classList.add(MINI_CART_CLASSES.disable) : minusButton.classList.remove(MINI_CART_CLASSES.disable);
}

function initMinusButtonsState(block) {
  block.querySelectorAll(MINI_CART_SELECTORS.quantityContainer).forEach((container) => {
    const input = container.querySelector(MINI_CART_SELECTORS.quantityInput);

    if (!input) return;

    const quantity = parseInt(input.value, 10) || 1;
    updateMinusButtonState(container, quantity);
  });
}

function setupAccordion(block) {
  if (!block) return;

  const items = [...block.querySelectorAll(MINI_CART_SELECTORS.miniCartNoteAccordion)];

  if (!items.length) return;

  const getParts = (item) => ({
    content: item.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionContent),
    header: item.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionHeader),
  });

  const openItem = (item) => {
    const { content } = getParts(item);
    if (!content) return;

    item.classList.add(MINI_CART_CLASSES.open);
    content.style.maxHeight = `${content.scrollHeight}px`;
  };

  const closeItem = (item) => {
    const { content } = getParts(item);
    if (!content) return;

    item.classList.remove(MINI_CART_CLASSES.open);
    content.style.maxHeight = "0px";
  };

  const toggleItem = (item) => {
    const openedItem = block.querySelector(`.${MINI_CART_CLASSES.open}`);

    if (item.classList.contains(MINI_CART_CLASSES.open)) {
      closeItem(item);
      return;
    }

    if (openedItem && openedItem !== item) {
      closeItem(openedItem);
    }

    openItem(item);
  };

  items.forEach((item) => {
    const { header } = getParts(item);
    if (!header) return;

    header.addEventListener("click", () => toggleItem(item));
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

function initCollectionSwiper(block) {
  const swiperEl = block.querySelector(MINI_CART_SELECTORS.collectionProductsSwiper);

  if (!swiperEl) return;

  const slidesCount = swiperEl.querySelectorAll(MINI_CART_SELECTORS.collectionProductsItem).length;

  new Swiper(swiperEl, {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: slidesCount > 3,
    navigation: {
      nextEl: swiperEl.closest(MINI_CART_SELECTORS.collectionProductsContainer).querySelector(MINI_CART_SELECTORS.swiperNextBtn),
      prevEl: swiperEl.closest(MINI_CART_SELECTORS.collectionProductsContainer).querySelector(MINI_CART_SELECTORS.swiperPrevBtn),
    },
  });
}

function handleNoteTextArea(block) {
  if (!block) return;

  const noteTextarea = block.querySelector(MINI_CART_SELECTORS.miniCartNoteAccordionTextarea);
  if (!noteTextarea) return;

  updateNoteLabel(block);

  noteTextarea.addEventListener("change", () => {
    const note = noteTextarea.value.trim();

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
    console.error(error);
  } finally {
    hideLoader(block);
    button.disabled = false;
  }
}

function addItemToCart(variantId, quantity = 1) {
  return fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      items: [{ id: variantId, quantity }],
    }),
  }).then(async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Cart add request failed");
    }

    return data;
  });
}

function initMiniCart(block) {
  initMinusButtonsState(block);
  initUpsellSwiper(block);
  initCollectionSwiper(block);
  setupAccordion(block);
  handleNoteTextArea(block);

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

    updateMinusButtonState(container, quantity);

    debounceCartUpdate({
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

    debounceCartUpdate({
      block,
      line,
      quantity: 0,
    });
  });

  block.addEventListener("change", (e) => {
    const termsInput = e.target.closest(MINI_CART_SELECTORS.miniCartTermsInput);
    if (!termsInput) return;

    const checkoutBtn = block.querySelector(MINI_CART_SELECTORS.miniCartCheckoutBtn);
    if (!checkoutBtn) return;

    checkoutBtn.disabled = !termsInput.checked;
  });

  block.addEventListener(
    "blur",
    (e) => {
      if (!e.target.matches(MINI_CART_SELECTORS.quantityInput)) return;

      const input = e.target;
      const container = input.closest(MINI_CART_SELECTORS.quantityContainer);
      const item = input.closest(MINI_CART_SELECTORS.miniCartItem);

      if (!item || !container) return;

      const line = +item.dataset.line;
      const defaultValue = +input.dataset.quantity || 1;
      const prevQuantity = defaultValue;

      let quantity = parseInt(input.value, 10);

      if (!quantity || quantity < 1) {
        quantity = defaultValue;
        input.value = quantity;
      }

      if (quantity === prevQuantity) return;

      updateMinusButtonState(container, quantity);

      debounceCartUpdate({
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
