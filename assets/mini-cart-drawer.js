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

const openMiniCart = (cart) => {
  cart.classList.add(MINI_CART_DRAWER_CLASSES.active);
  document.body.style.overflow = "hidden";
};

const closeMiniCart = (cart) => {
  cart.classList.remove(MINI_CART_DRAWER_CLASSES.active);
  document.body.style.overflow = "";
};

const miniCartDrawer = () => {
  document.addEventListener("click", (e) => {
    const cart = document.querySelector(MINI_CART_DRAWER_SELECTORS.miniCartSection);

    if (!cart) return;

    const openBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartButton);
    const closeBtn = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartCloseBtn);
    const isClickInsideCart = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartSectionInner);
    const isClickQuickView = e.target.closest(MINI_CART_DRAWER_SELECTORS.miniCartQuickView);

    if (openBtn) {
      openMiniCart(cart);
      return;
    }

    if (closeBtn) {
      closeMiniCart(cart);
      return;
    }

    if (cart.classList.contains(MINI_CART_DRAWER_CLASSES.active) && !isClickInsideCart && !isClickQuickView) {
      closeMiniCart(cart);
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  miniCartDrawer();
});
