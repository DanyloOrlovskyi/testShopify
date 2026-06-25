class FeaturedCollection extends HTMLElement {
  connectedCallback() {
    this.initSwiper();
    this.bindEvents();

    this.removeAttribute('hidden');
  }

  initSwiper() {
    const swiperEl = this.querySelector('.js-featured-collection-swiper');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    this.swiper = new Swiper(swiperEl, {
      slidesPerView: 2,
      spaceBetween: 15,
      navigation: {
        prevEl: this.querySelector('.js-fectured-collection-nav-prev'),
        nextEl: this.querySelector('.js-fectured-collection-nav-next'),
      },
      pagination: {
        el: this.querySelector('.js-featured-collection-pagination'),
        clickable: true,
      },
      breakpoints: {
        769: {
          slidesPerView: 3
        },
      },
    });
  }

  bindEvents() {
    this.addEventListener('click', (event) => {
      const triggeredSwatch = event.target.closest('[data-swatch-btn]');
      if (triggeredSwatch) { 
        event.preventDefault(); 
        this.handleSwatchClick(triggeredSwatch); 
        return; 
      }

      const addToCartButton = event.target.closest('[data-addToCart-btn]');
      if (addToCartButton) { 
        event.preventDefault(); 
        this.handleAddToCartClick(addToCartButton); 
      }
    });
  }

  handleSwatchClick(triggeredSwatch) {
    const card = triggeredSwatch.closest('.product-card');
    if (!card) return;

    const { imageId, variantId } = triggeredSwatch.dataset;

    card.querySelectorAll('.js-product-card-image').forEach((img) => {
      img.classList.toggle('product-card__image--active', img.dataset.imageId === imageId);
    });

    card.querySelectorAll('[data-swatch-btn]').forEach((swatch) => {
      swatch.classList.toggle('product-card__swatch--active', swatch === triggeredSwatch);
    });

    if (variantId) {
      const addToCartButton = card.querySelector('[data-addToCart-btn]');
      if (addToCartButton) addToCartButton.dataset.variantId = variantId;
    }
  }

  async handleAddToCartClick(button) {
    const variantId = button.dataset.variantId;
    if (!variantId || button.disabled) return;

    button.disabled = true;

    try {
      const formData = {
        'items': [{
          'id': parseInt(variantId, 10),
          'quantity': 1
        }]
      };

      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Unexpected server response');
      }

      if (!res.ok) {
        throw new Error(data.description || data.message || 'Could not add to cart');
      }

      button.classList.add('product-card__addToCart--added');
      FeaturedCollection.showToast('Added to cart');
      document.dispatchEvent(new CustomEvent('cart:updated'));
      setTimeout(() => button.classList.remove('product-card__addToCart--added'), 2000);

    } catch (err) {
      button.classList.add('product-card__addToCart--error');
      FeaturedCollection.showToast(err.message || 'Could not add to cart', 'error');
      setTimeout(() => button.classList.remove('product-card__addToCart--error'), 2000);

    } finally {
      button.disabled = false;
    }
  }

  static showToast(message, type = 'success') {
    const existing = document.querySelector('.fc-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'fc-toast' + (type === 'error' ? ' fc-toast--error' : '');
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.classList.add('fc-toast--visible');

    setTimeout(() => {
      toast.classList.remove('fc-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  }
}

customElements.define('featured-collection', FeaturedCollection);
