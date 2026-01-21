
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

const fetchCart = async () => {
  const res = await fetch("/cart.js");
  return res.json();
};

const updateMiniCartBubble = async () => {
  const bubble = document.querySelector(MINI_CART_DRAWER_SELECTORS.miniCartBubble);

  if (!bubble) return;

  try {
    const response = await fetch("/cart.js");
    const cart = await response.json();

    const count = cart.item_count ?? 0;

    bubble.textContent = count;
  } catch (error) {
    console.error(error);
  }
};

const getMiniCart = () => document.querySelector(MINI_CART_DRAWER_SELECTORS.miniCartSection);

const openMiniCart = () => {
  const cart = getMiniCart();

  if (!cart) return;

  cart.classList.add(MINI_CART_DRAWER_CLASSES.active);
  document.body.style.overflow = "hidden";
};

const closeMiniCart = () => {
  const cart = getMiniCart();

  if (!cart) return;

  cart.classList.remove(MINI_CART_DRAWER_CLASSES.active);
  document.body.style.overflow = "";
};

const miniCartDrawer = () => {
  document.addEventListener("click", (e) => {
    const cart = getMiniCart();
    if (!cart) return;

    const openBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartButton);
    const closeBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartCloseBtn);
    const isClickInsideCart = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartSectionInner);
    const isClickQuickView = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartQuickView);

    if (openBtn) {
      openMiniCart();
      return;
    }

    if (closeBtn) {
      closeMiniCart();
      return;
    }

    if (cart.classList.contains(MINI_CART_DRAWER_CLASSES.active) && !isClickInsideCart && !isClickQuickView) {
      closeMiniCart();
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  miniCartDrawer();
  updateMiniCartBubble();
});
