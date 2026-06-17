class UpsellSlider {
  constructor({ container, prevEl, nextEl, ...options }) {
    this.container = container;
    this.prevEl = prevEl;
    this.nextEl = nextEl;
    this.options = options;
    this.instance = null;
  }

  init() {
    if (!this.container || typeof Swiper === 'undefined') return;
    this.instance = new Swiper(this.container, {
      spaceBetween: 16,
      ...this.options,
      navigation: { prevEl: this.prevEl, nextEl: this.nextEl },
    });
  }

  destroy() {
    this.instance?.destroy(true, true);
    this.instance = null;
  }
}

class CartDrawer extends HTMLElement {
  connectedCallback() {

    this.selectors = {
      opener: '.js-minicart-opener',
      openerCounter: '.js-minicart-opener-counter',
      close: '.js-minicart-close',
      product: '.js-minicart-product',
      productError: '.js-minicart-product-error',
      removeProduct: '.js-minicart-product-remove',
      qtyInput: '.js-minicart-product-qty-input',
      qtyPlus: '.js-minicart-product-qty-plus',
      qtyMinus: '.js-minicart-product-qty-minus',
      note: '.js-minicart-note',
      termsCheckbox: '.js-minicart-terms-checkbox',
      checkout: '.js-minicart-checkout',
      upsell: '.js-minicart-upsell',
      upsellWrapper: '.js-minicart-upsell-wrapper',
      upsellSwiper: '.js-minicart-upsell-swiper',
      upsellPrev: '.js-minicart-upsell-prev',
      upsellNext: '.js-minicart-upsell-next',
      upsellAdd: '.js-minicart-upsell-add',
      emptyCartSwiper: '.js-minicart-empty-swiper',
      emptyCartPrev: '.js-minicart-empty-prev',
      emptyCartNext: '.js-minicart-empty-next',
      emptyCartAddToCartButton: '.js-product-card-addToCart',
      emptyCartProductCard: '.js-product-card',
      emptyCartProductCardPicture: '.js-product-card-picture',
      swatch: '.js-product-card-swatch',
    };

    this.upsellSlider = null;
    this.emptyCartSlider = null;

    this.onKeydown = this.onKeydown.bind(this);
    this.onOpenerClick = this.onOpenerClick.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);

    document.addEventListener('click', this.onOpenerClick);
    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.onOpenerClick);
    document.removeEventListener('keydown', this.onKeydown);
    document.body.classList.remove('minicart-open');
  }

  onOpenerClick(event) {
    if (!event.target.closest(this.selectors.opener)) return;
    event.preventDefault();
    this.open();
  }

  onKeydown(event) {
    if (event.key === 'Escape') this.close();
  }

  open() {
    this.classList.add('is-open');
    document.body.classList.add('minicart-open');
    document.addEventListener('keydown', this.onKeydown);

    fetch(`/cart/?sections=minicart`)
      .then((response) => response.json())
      .then((data) => this.renderMinicart(data.minicart))
      .catch((error) => {
        console.error('Minicart error', error);
        alert('Something went wrong. Try again later.');
      });
  }

  close() {
    this.classList.remove('is-open');
    document.body.classList.remove('minicart-open');
    document.removeEventListener('keydown', this.onKeydown);
  }

  onClick(event) {
    const { target } = event;

    if (target.closest(this.selectors.close)) {
      this.close();
      return;
    }

    const removeBtn = target.closest(this.selectors.removeProduct);
    if (removeBtn) {
      this.changeLineQuantity(removeBtn.closest(this.selectors.product), 0);
      return;
    }

    const plusBtn = target.closest(this.selectors.qtyPlus);
    if (plusBtn) {
      this.stepLineQuantity(plusBtn, 1);
      return;
    }

    const minusBtn = target.closest(this.selectors.qtyMinus);
    if (minusBtn) {
      this.stepLineQuantity(minusBtn, -1);
      return;
    }

    const upsellAdd = target.closest(this.selectors.upsellAdd);
    if (upsellAdd) {
      this.addToCart(upsellAdd.dataset.variantId, upsellAdd);
      return;
    }

    const swatch = target.closest(this.selectors.swatch);
    if (swatch) {
      event.preventDefault();
      this.selectSwatch(swatch);
      return;
    }

    const emptyCartAddToCartButton = target.closest(this.selectors.emptyCartAddToCartButton);
    if (emptyCartAddToCartButton) {
      event.preventDefault();
      this.addToCart(emptyCartAddToCartButton.dataset.variantId, emptyCartAddToCartButton);
    }
  }

  onChange(event) {
    const { target } = event;

    if (target.matches(this.selectors.termsCheckbox)) {
      this.toggleCheckout(target.checked);
      return;
    }

    if (target.matches(this.selectors.qtyInput)) {
      const quantity = Math.max(0, parseInt(target.value, 10) || 0);
      this.changeLineQuantity(target.closest(this.selectors.product), quantity);
      return;
    }

    if (target.matches(this.selectors.note)) {
      this.changeCartNote(target.value);
      return;
    }
  }

  stepLineQuantity(button, delta) {
    const line = button.closest(this.selectors.product);
    const input = line?.querySelector(this.selectors.qtyInput);

    if (!input) return;

    const current = parseInt(input.value, 10) || 0;
    const next = Math.max(0, current + delta);

    if (next === current) return;
    
    this.changeLineQuantity(line, next);
  }

  changeLineQuantity(line, quantity) {
    if (!line) return;

    line.setAttribute('disabled', '');

    const formData = {
      id: line.dataset.variantId,
      quantity: quantity,
      sections: 'minicart',
    };

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.description || 'Something went wrong. Please try again later.');
      }
      return data;
    })
    .then((data) => this.renderMinicart(data.sections.minicart))
    .catch((error) => {
      line.querySelector(this.selectors.productError).innerHTML = error.message;
    }).finally(() => line.removeAttribute('disabled'));
  }

  changeCartNote(value){
      const formData = {
        note: value
      };
      fetch('/cart/update.js', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(data.description || 'Something went wrong. Please try again later.');
        }
      })
      .catch((error) => alert(error.message));
  }

  addToCart(variantId, button) {  
    if (!variantId) return;
    console.log('button', button)
    button?.setAttribute('disabled', '');
    const formData = {
      items: [{ id: variantId, quantity: 1 }],
      sections: 'minicart',
    };
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.description || 'Something went wrong. Please try again later.');
      }
      return data;
    })
    .then((data) => this.renderMinicart(data.sections.minicart))
    .catch((error) => alert(error.message))
    .finally(() => button?.removeAttribute('disabled'));
  }

  toggleCheckout(enabled) {
    this.querySelector(this.selectors.checkout)?.toggleAttribute('disabled', !enabled);
  }

  selectSwatch(swatch) {
    const card = swatch.closest(this.selectors.emptyCartProductCard);
    if (!card) return;
    const { imageId, variantId } = swatch.dataset;

    card.querySelectorAll(this.selectors.emptyCartProductCardPicture).forEach((picture) => {
      picture.classList.toggle('product-card__picture--active', picture.dataset.imageId === imageId);
    });
    card.querySelectorAll(this.selectors.swatch).forEach((button) => {
      button.classList.toggle('product-card__swatch--active', button === swatch);
    });
    if (variantId) {
      const addBtn = card.querySelector(this.selectors.emptyCartAddToCartButton);
      if (addBtn) addBtn.dataset.variantId = variantId;
    }
  }

  renderMinicart(html) {
    if (!html) return;
    const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('cart-drawer');
    if (!fresh) return;

    this.innerHTML = fresh.innerHTML;
    this.setCartCounter(fresh.dataset.itemCount);
    this.initEmptyCartSlider();
    this.initUpsellSlider();
  }

  setCartCounter(count) {
    const counter = document.querySelector(this.selectors.openerCounter);
    if (!counter) return;
    const value = Number(count) || 0;
    counter.textContent = value;
    counter.hidden = value === 0;
  }

  initUpsellSlider() {
    this.upsellSlider?.destroy();
    this.upsellSlider = new UpsellSlider({
      container: this.querySelector(this.selectors.upsellSwiper),
      prevEl: this.querySelector(this.selectors.upsellPrev),
      nextEl: this.querySelector(this.selectors.upsellNext),
      slidesPerView: 1,
    });
    this.upsellSlider.init();
  }

  initEmptyCartSlider() {
    this.emptyCartSlider?.destroy();
    if (!this.querySelector(this.selectors.emptyCartSwiper)) {
      this.emptyCartSlider = null;
      return;
    }
    this.emptyCartSlider = new UpsellSlider({
      container: this.querySelector(this.selectors.emptyCartSwiper),
      prevEl: this.querySelector(this.selectors.emptyCartPrev),
      nextEl: this.querySelector(this.selectors.emptyCartNext),
      slidesPerView: 2,
    });
    this.emptyCartSlider.init();
  }
}

customElements.define('cart-drawer', CartDrawer);
