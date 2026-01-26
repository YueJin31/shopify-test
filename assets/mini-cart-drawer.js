const MINI_CART_DRAWER_SELECTORS = {
  miniCartSection: ".js-mini-cart",
  miniCartSectionInner: ".js-mini-cart-inner",
  miniCartButton: ".js-mini-cart-button",
  miniCartBubble: ".js-mini-cart-bubble",
  miniCartCloseBtn: ".js-mini-cart-close",
  miniCartQuickView: ".js-quick-view",
};

const MINI_CART_DRAWER_CLASSES = {
  active: "is-active",
};

const getCart = () => document.querySelector(MINI_CART_DRAWER_SELECTORS.miniCartSection);
const getBubble = () => document.querySelector(MINI_CART_DRAWER_SELECTORS.miniCartBubble);

const setMiniCartState = (isOpen) => {
  const cart = getCart();

  if (!cart) return;

  cart.classList.toggle(MINI_CART_DRAWER_CLASSES.active, isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
};

const updateMiniCartBubble = async () => {
  const bubble = getBubble();

  if (!bubble) return;

  try {
    const res = await fetch("/cart.js");
    const { item_count = 0 } = await res.json();

    bubble.textContent = item_count;
  } catch (err) {
    console.error("Mini cart bubble error:", err);
  }
};

const miniCartDrawer = () => {
  document.addEventListener("click", (e) => {
    const cart = getCart();

    if (!cart) return;

    const isOpenBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartButton);
    const isCloseBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartCloseBtn);
    const isInsideCart = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartSectionInner);
    const isQuickView = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartQuickView);
    const isCartOpen = cart.classList.contains(MINI_CART_DRAWER_CLASSES.active);

    if (isOpenBtn) return setMiniCartState(true);

    if (isCloseBtn) return setMiniCartState(false);

    if (isCartOpen && !isInsideCart && !isQuickView) {
      setMiniCartState(false);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  miniCartDrawer();
  updateMiniCartBubble();
});
