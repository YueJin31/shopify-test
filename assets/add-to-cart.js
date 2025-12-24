const CART_SELECTORS = {
  addToCartBtn: ".js-add-to-cart",
  notificationContainer: ".cart-notification",
};

const CART_CLASSES = {
  notification: "cart-notification",
  progressBar: "progress-bar",
};

const CART_EVENTS = {
  update: "cart:update",
};

function initAddToCart() {
  document.addEventListener("click", (e) => {
    const button = e.target.closest(CART_SELECTORS.addToCartBtn);

    if (!button) return;

    handleAddToCart(button);
  });
}

async function handleAddToCart(button) {
  const variantId = button.dataset.variantId;

  button.disabled = true;

  try {
    await addItemToCart(variantId);

    dispatchCartUpdate(variantId);
    showCartNotification("Added to cart");
  } catch (error) {
    showCartNotification(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function addItemToCart(variantId, quantity = 1) {
  return fetch(`${window.Shopify.routes.root}cart/add.js`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ id: variantId, quantity }] }),
  }).then(async (response) => {
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Cart add request failed");

    return data;
  });
}

function dispatchCartUpdate(variantId) {
  document.dispatchEvent(
    new CustomEvent(CART_EVENTS.update, {
      bubbles: true,
      detail: {
        data: {
          itemCount: 1,
          source: "product-form-component",
          variantId,
        },
      },
    })
  );
}

function showCartNotification(message, isError = false) {
  document.querySelectorAll(CART_SELECTORS.notificationContainer).forEach((el) => el.remove());

  const notification = document.createElement("div");
  notification.classList.add(CART_CLASSES.notification);
  notification.style.background = isError ? "#ef4444" : "#10b981";

  const icon = document.createElement("span");
  icon.textContent = isError ? "❌" : "✅";

  const text = document.createElement("span");
  text.textContent = message;

  const progressBar = document.createElement("div");
  progressBar.classList.add(CART_CLASSES.progressBar);

  const progress = document.createElement("div");
  progressBar.appendChild(progress);

  notification.append(icon, text, progressBar);
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "cartNotificationSlideOut 0.3s ease forwards";
    setTimeout(() => notification.remove(), 300);
  }, 1300);
}

document.addEventListener("DOMContentLoaded", initAddToCart);
