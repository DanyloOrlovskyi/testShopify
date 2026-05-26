if (!customElements.get("best-sellers")) {
  customElements.define(
    "best-sellers",
    class BestSellers extends HTMLElement {
      constructor() {
        super();

        this.modalOpenClass = "best-sellers-modal-open";
        this.onKeyDown = this.handleKeyDown.bind(this);
        this.isInitialized = false;
      }

      connectedCallback() {
        if (!this.isInitialized) {
          this.init();
          this.isInitialized = true;
        }

        document.addEventListener("keydown", this.onKeyDown);
      }

      disconnectedCallback() {
        document.removeEventListener("keydown", this.onKeyDown);
      }

      init() {
        this.tabs = this.querySelectorAll("[data-best-sellers-tab]");
        this.panels = this.querySelectorAll("[data-best-sellers-panel]");
        this.modal = this.querySelector("[data-wishlist-modal]");
        this.modalMessage = this.querySelector("[data-wishlist-message]");
        this.closeButtons = this.querySelectorAll("[data-modal-close]");

        this.tabs.forEach((tab) => {
          tab.addEventListener("click", this.handleTabClick.bind(this, tab));
        });

        this.querySelectorAll("[data-wishlist-trigger]").forEach((button) => {
          button.addEventListener("click", () => {
            this.openModal(button.dataset.productTitle || "");
          });
        });

        this.closeButtons.forEach((button) => {
          button.addEventListener("click", this.closeModal.bind(this));
        });

        this.querySelectorAll("[data-cart-trigger]").forEach((button) => {
          button.addEventListener(
            "click",
            this.handleCartClick.bind(this, button),
          );
        });

        if (this.tabs.length > 0 && this.panels.length > 0) {
          this.setActivePanel(this.tabs[0].dataset.target);
        }
      }

      getCartAddUrl() {
        const root = window.Shopify?.routes?.root;
        return `${root}cart/add.js`;
      }

      async addProductToCart(variantId) {
        try {
          const response = await fetch(this.getCartAddUrl(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              id: Number(variantId),
              quantity: 1,
            }),
          });

          const parsedState = await response.json();

          if (!response.ok || parsedState.status) {
            console.error(
              parsedState.description ||
                parsedState.message ||
                "Cart request failed",
            );
            return null;
          }

          return parsedState;
        } catch (error) {
          console.error(error);
          return null;
        }
      }

      setActivePanel(targetId) {
        this.tabs.forEach((tab) => {
          const isActive = tab.dataset.target === targetId;
          tab.classList.toggle("is-active", isActive);
          tab.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        this.panels.forEach((panel) => {
          const isActive = panel.id === targetId;
          panel.classList.toggle("is-active", isActive);
          panel.toggleAttribute("hidden", !isActive);
        });
      }

      handleTabClick(tab) {
        if (tab.classList.contains("is-active")) return;
        this.setActivePanel(tab.dataset.target);
      }

      async handleCartClick(button) {
        const variantId = button.dataset.variantId;
        if (!variantId || button.disabled) return;

        button.disabled = true;

        try {
          await this.addProductToCart(variantId);
        } finally {
          button.disabled = false;
        }
      }

      openModal(productTitle) {
        if (!this.modal || !this.modalMessage) return;

        this.modalMessage.textContent = `${productTitle} has been added to the your wishlist.`;
        this.modal.classList.add("is-open");
        this.modal.setAttribute("aria-hidden", "false");
        document.body.classList.add(this.modalOpenClass);
      }

      closeModal() {
        if (!this.modal) return;

        this.modal.classList.remove("is-open");
        this.modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove(this.modalOpenClass);
      }

      handleKeyDown(event) {
        if (
          event.key === "Escape" &&
          this.modal?.classList.contains("is-open")
        ) {
          this.closeModal();
        }
      }
    },
  );
}
