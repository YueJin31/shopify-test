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
  navItemsContainers: ".js-bestsellers-item",
  navItems: ".js-bestsellers-item-link",
  contentItems: ".js-bestsellers-panel",
  addTocartBtn: ".js-add-to-cart",
  block: ".js-bestsellers",
};

const BESTSELLERS_CLASSES = {
  active: "is-active",
};

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

function removeModal(modal) {
  modal.classList.remove(MODAL_CLASSES.show);
  document.body.style.overflow = "";

  setTimeout(() => {
    modal.remove();
  }, 300);
}

function InitModals(section) {
  section.querySelectorAll(MODAL_SELECTORS.modalButtonTrigger).forEach((button) => {
    if (!button.dataset.modalInit) {
      button.addEventListener("click", () => {
        const title = button.dataset.title || "Product";
        CreateModal(title);
      });

      button.dataset.modalInit = "true";
    }
  });
}

class Bestsellers {
  constructor(template) {
    this.template = template;
    this.navItemsContainers = template.querySelectorAll(BESTSELLERS_SELECTORS.navItemsContainers);
    this.navItems = template.querySelectorAll(BESTSELLERS_SELECTORS.navItems);
    this.contentItems = template.querySelectorAll(BESTSELLERS_SELECTORS.contentItems);
    this.currentIndex = 0;
  }

  bindEvents() {
    this.navItems.forEach((item, index) => {
      if (!item.dataset.tabInit) {
        item.addEventListener("click", () => this.goToTab(index));

        item.dataset.tabInit = "true";
      }
    });
  }

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
    if (!template.dataset.bestsellersInit) {
      new Bestsellers(template).init();

      template.dataset.bestsellersInit = "true";
    }
  });
}

document.addEventListener("DOMContentLoaded", InitBestsellers);

document.addEventListener("shopify:section:load", InitBestsellers);
document.addEventListener("shopify:section:select", InitBestsellers);
document.addEventListener("shopify:section:reorder", InitBestsellers);
