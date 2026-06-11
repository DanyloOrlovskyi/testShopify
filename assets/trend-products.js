class TrendProducts extends HTMLElement {
  connectedCallback() {
    this.selectors = {
      addToCartButton: ".js-trend-product-add-to-cart-button",
      hotspot: ".js-trend-product-hotspot",
      hotspotWrapper: ".js-trend-products-hotspot-wrapper",
      popup: ".js-trend-products-popup",
      toast: ".trend-products-toast"
    };

    this.activePopup = null;
    this.activeHotspot = null;

    this.boundOnClick = this.onClick.bind(this);
    this.boundOnKeydown = this.onKeydown.bind(this);
    this.boundOnOutsideClick = this.onOutsideClick.bind(this);

    this.addEventListener('click', this.boundOnClick);
    document.addEventListener('keydown', this.boundOnKeydown);
    document.addEventListener('click', this.boundOnOutsideClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.boundOnClick);
    document.removeEventListener('keydown', this.boundOnKeydown);
    document.removeEventListener('click', this.boundOnOutsideClick);
    this.closePopup();
  }

  onClick(e) {
    const hotspot = e.target.closest(this.selectors.hotspot);
    if (hotspot) {
      e.stopPropagation();
      this.toggleHotspot(hotspot);
      return;
    }

    const addBtn = e.target.closest(this.selectors.addToCartButton);
    if (addBtn) {
      e.stopPropagation();
      this.addToCart(addBtn);
    }
  }

  onKeydown(e) {
    if (e.key === 'Escape' && this.activePopup) {
      this.closePopup();
    }
  }

  onOutsideClick(e) {
    if (!this.activePopup) return;
    if (!e.target.closest(this.selectors.hotspot) && !e.target.closest(this.selectors.popup)) {
      this.closePopup();
    }
  }

  toggleHotspot(hotspot) {
    if (this.activeHotspot === hotspot) {
      this.closePopup();
      return;
    }

    if (this.activePopup) {
      this.closePopup();
    }

    const popup = hotspot.closest(this.selectors.hotspotWrapper).querySelector(this.selectors.popup);
    if (!popup) return;

    hotspot.classList.add('trend-products__hotspot--active');
    hotspot.setAttribute('aria-expanded', 'true');
    popup.classList.add('trend-products__popup--visible');

    this.activeHotspot = hotspot;
    this.activePopup = popup;
  }

  closePopup() {
    if (this.activeHotspot) {
      this.activeHotspot.classList.remove('trend-products__hotspot--active');
      this.activeHotspot.setAttribute('aria-expanded', 'false');
      this.activeHotspot.focus();
      this.activeHotspot = null;
    }

    if (this.activePopup) {
      this.activePopup.classList.remove('trend-products__popup--visible');
      this.activePopup = null;
    }
  }

  async addToCart(button) {

    button.disabled = true;
    button.classList.add('trend-products__popup-btn--loading');

    try {
      const formData = {
      'items': [{
        'id': button.dataset.variantId,
        'quantity': 1
        }]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || data.message || 'Could not add to cart.');
      }

      this.showToast('Added to cart!');
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
    } catch (err) {
      this.showToast(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      button.disabled = false;
      button.classList.remove('trend-products__popup-btn--loading');
    }
  }

  showToast(message, isError = false) {
    let toast = document.querySelector(this.selectors.toast);

    if (!toast) {
      return;
    }

    clearTimeout(this.toastTimer);
    toast.classList.remove('trend-products-toast--visible', 'trend-products-toast--error');

    toast.textContent = message;
    if (isError) toast.classList.add('trend-products-toast--error');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('trend-products-toast--visible'));
    });

    this.toastTimer = setTimeout(() => toast.classList.remove('trend-products-toast--visible'), 3000);
  }
}

customElements.define('trend-products', TrendProducts);
