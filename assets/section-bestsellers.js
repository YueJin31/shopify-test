// =========================
// SELECTORS & CLASSES
// =========================

const MODAL_SELECTORS = {
  modalButtonTrigger: ".js-create-modal",
};

const MODAL_CLASSES = {
  modal: "modal",
  modalContent: "modal__content",
  modalCloseBtn: "modal__close-button",
  modalText: "modal__text",
  show: "show",
};

const BESTSELLERS_SELECTORS = {
  navItemsContainers: ".bestsellers__item",
  navItems: ".bestsellers__item-link",
  contentItems: ".bestsellers__panel",
  addTocartBtn: ".bestsellers__panel-action.bestsellers__panel-action--wishlist",
  block: ".bestsellers",
};

const BESTSELLERS_CLASSES = {
  active: "is-active",
};

// =========================
// MODAL
// =========================

/**
 * @param {string} [title]
 */
function CreateModal(title) {
  const modal = document.createElement("div");
  modal.classList.add(MODAL_CLASSES.modal);

  const content = document.createElement("div");
  content.classList.add(MODAL_CLASSES.modalContent);

  const closeBtn = document.createElement("button");
  closeBtn.classList.add(MODAL_CLASSES.modalCloseBtn);
  closeBtn.textContent = "×";

  const text = document.createElement("h3");
  text.classList.add(MODAL_CLASSES.modalText);
  text.textContent = `${title} has been added to your cart.`;

  content.appendChild(closeBtn);
  content.appendChild(text);
  modal.appendChild(content);
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.classList.add(MODAL_CLASSES.show);
  });

  document.body.style.overflow = "hidden";

  closeBtn.addEventListener("click", () => removeModal(modal));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) removeModal(modal);
  });
}

/**
 * @param {HTMLDivElement} modal
 */
function removeModal(modal) {
  modal.classList.remove(MODAL_CLASSES.show);
  document.body.style.overflow = "";

  setTimeout(() => {
    modal.remove();
  }, 300);
}

/**
 * @param {Element} section
 */

function InitModals(section) {
  section.querySelectorAll(MODAL_SELECTORS.modalButtonTrigger).forEach((button) => {
    // @ts-ignore
    if (!button.dataset.modalInit) {
      button.addEventListener("click", () => {
        // @ts-ignore
        const title = button.dataset.title || "Product";
        CreateModal(title);
      });

      // @ts-ignore
      button.dataset.modalInit = "true";
    }
  });
}

// =========================
// BESTSELLERS CLASS
// =========================

class Bestsellers {
  /**
   * @param {Element} template
   */

  constructor(template) {
    this.template = template;
    this.navItemsContainers = template.querySelectorAll(BESTSELLERS_SELECTORS.navItemsContainers);
    this.navItems = template.querySelectorAll(BESTSELLERS_SELECTORS.navItems);
    this.contentItems = template.querySelectorAll(BESTSELLERS_SELECTORS.contentItems);
    this.currentIndex = 0;
  }

  bindEvents() {
    this.navItems.forEach((item, index) => {
      // @ts-ignore
      if (!item.dataset.tabInit) {
        item.addEventListener("click", () => this.goToTab(index));

        // @ts-ignore
        item.dataset.tabInit = "true";
      }
    });
  }

  // @ts-ignore
  goToTab(index) {
    const currentNavItem = this.navItems[this.currentIndex]?.closest(BESTSELLERS_SELECTORS.navItemsContainers);
    const currentContent = this.contentItems[this.currentIndex];

    const nextNavItem = this.navItems[index]?.closest(BESTSELLERS_SELECTORS.navItemsContainers);
    const nextContent = this.contentItems[index];

    currentNavItem?.classList.remove(BESTSELLERS_CLASSES.active);
    currentContent?.classList.remove(BESTSELLERS_CLASSES.active);
    nextNavItem?.classList.add(BESTSELLERS_CLASSES.active);
    nextContent?.classList.add(BESTSELLERS_CLASSES.active);

    this.currentIndex = index;
  }

  initActiveTab() {
    this.navItemsContainers[0]?.classList.add(BESTSELLERS_CLASSES.active);
    this.contentItems[0]?.classList.add(BESTSELLERS_CLASSES.active);
  }

  init() {
    this.initActiveTab();
    this.bindEvents();
    InitModals(this.template);
  }
}

function InitBestsellers() {
  document.querySelectorAll(BESTSELLERS_SELECTORS.block).forEach((template) => {
    // @ts-ignore
    if (!template.dataset.bestsellersInit) {
      new Bestsellers(template).init();
      // @ts-ignore
      template.dataset.bestsellersInit = "true";
    }
  });
}

function addToCart() {
  const buttons = document.querySelectorAll(".js-add-to-cart");

  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      // @ts-ignore
      const variantId = +button?.dataset.variantId;
      // @ts-ignore
      const availableQuantity = button?.dataset.availableQuantity ? +button.dataset.availableQuantity : null;

      if (!variantId) {
        console.error("Variant ID not found");
        return;
      }

      if (availableQuantity !== null && availableQuantity < 1) {
        showCartNotification("Product is sold out.", true);
        return;
      }

      // @ts-ignore
      const defaultlDisableValue = button.disabled;
      // @ts-ignore
      button.disabled = true;

      try {
        const response = await fetch(window.Shopify.routes.root + "cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: variantId,
            quantity: 1,
          }),
        });

        if (response.ok) {
          document.dispatchEvent(
            new CustomEvent("cart:update", {
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

          showCartNotification("Added to cart");
        } else {
          throw new Error("Failed to add items to cart");
        }
      } catch (error) {
        showCartNotification("Error adding to cart", true);
      } finally {
        // @ts-ignore
        button.disabled = defaultlDisableValue;
      }
    });
  });
}

/**
 * @param {string | null} message
 */
function showCartNotification(message, isError = false) {
  const existingNotifications = document.querySelectorAll(".cart-notification");

  existingNotifications.forEach((notification) => {
    notification.remove();
  });

  const notification = document.createElement("div");
  notification.className = "cart-notification";
  notification.textContent = message;

  notification.style.cssText = `background: ${isError ? "#ef4444" : "#10b981"}`;

  const icon = document.createElement("span");
  icon.innerHTML = isError ? "❌" : "✅";
  notification.prepend(icon);

  const progressBar = document.createElement("div");
  progressBar.classList.add("progress-bar");

  const progress = document.createElement("div");

  progressBar.appendChild(progress);
  notification.appendChild(progressBar);

  document.body.appendChild(notification);

  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = "cartNotificationSlideOut 0.3s ease forwards";
      setTimeout(() => notification.remove(), 300);
    }
  }, 1000);
}

InitBestsellers();
addToCart();

document.addEventListener("shopify:section:load", InitBestsellers);
document.addEventListener("shopify:section:select", InitBestsellers);
document.addEventListener("shopify:section:reorder", InitBestsellers);
