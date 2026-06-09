class TrendProducts extends HTMLElement {
  connectedCallback() {
    this.activePopup = null;
    this.activeHotspot = null;

    this._boundOnClick = this._onClick.bind(this);
    this._boundOnKeydown = this._onKeydown.bind(this);
    this._boundOnOutsideClick = this._onOutsideClick.bind(this);

    this.addEventListener('click', this._boundOnClick);
    document.addEventListener('keydown', this._boundOnKeydown);
    document.addEventListener('click', this._boundOnOutsideClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._boundOnClick);
    document.removeEventListener('keydown', this._boundOnKeydown);
    document.removeEventListener('click', this._boundOnOutsideClick);
    this._closePopup();
  }

  _onClick(e) {
    const hotspot = e.target.closest('.trend-products__hotspot');
    if (hotspot) {
      e.stopPropagation();
      this._toggleHotspot(hotspot);
      return;
    }

    const addBtn = e.target.closest('.trend-products__popup-btn[data-variant-id]');
    if (addBtn) {
      e.stopPropagation();
      this._addToCart(addBtn);
    }
  }

  _onKeydown(e) {
    if (e.key === 'Escape' && this.activePopup) {
      this._closePopup();
    }
  }

  _onOutsideClick(e) {
    if (!this.activePopup) return;
    if (!e.target.closest('.trend-products__hotspot') && !e.target.closest('.trend-products__popup')) {
      this._closePopup();
    }
  }

  _toggleHotspot(hotspot) {
    if (this.activeHotspot === hotspot) {
      this._closePopup();
      return;
    }

    if (this.activePopup) {
      this._closePopup();
    }

    const popup = hotspot.nextElementSibling;
    if (!popup?.classList.contains('trend-products__popup')) return;

    hotspot.classList.add('trend-products__hotspot--active');
    hotspot.setAttribute('aria-expanded', 'true');
    popup.classList.add('trend-products__popup--visible');

    this.activeHotspot = hotspot;
    this.activePopup = popup;

    popup.querySelector('a, button')?.focus();
  }

  _closePopup() {
    this.activeHotspot?.classList.remove('trend-products__hotspot--active');
    this.activeHotspot?.setAttribute('aria-expanded', 'false');
    this.activeHotspot?.focus();
    this.activePopup?.classList.remove('trend-products__popup--visible');
    this.activeHotspot = null;
    this.activePopup = null;
  }

  async _addToCart(btn) {
    if (btn.disabled) return;

    btn.disabled = true;
    btn.classList.add('trend-products__popup-btn--loading');

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: btn.dataset.variantId, quantity: 1 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.description || data.message || 'Could not add to cart.');
      }

      this._showToast('Added to cart!');
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
    } catch (err) {
      this._showToast(err.message || 'Something went wrong. Please try again.', true);
    } finally {
      btn.disabled = false;
      btn.classList.remove('trend-products__popup-btn--loading');
    }
  }

  _showToast(message, isError = false) {
    let toast = document.querySelector('.trend-products-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'trend-products-toast';
      toast.setAttribute('role', isError ? 'alert' : 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    clearTimeout(this._toastTimer);
    toast.classList.remove('trend-products-toast--visible', 'trend-products-toast--error');

    toast.textContent = message;
    if (isError) toast.classList.add('trend-products-toast--error');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('trend-products-toast--visible'));
    });

    this._toastTimer = setTimeout(() => toast.classList.remove('trend-products-toast--visible'), 3000);
  }
}

customElements.define('trend-products', TrendProducts);
