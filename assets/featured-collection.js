class FeaturedCollection extends HTMLElement {
  connectedCallback() {
    this.initSwiper();
    this.bindEvents();
  }

  initSwiper() {
    const swiperEl = this.querySelector('.featured-collection__swiper');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    this.swiper = new Swiper(swiperEl, {
      slidesPerView: 2,
      spaceBetween: 15,
      navigation: {
        prevEl: this.querySelector('.featured-collection__nav--prev'),
        nextEl: this.querySelector('.featured-collection__nav--next'),
      },
      pagination: {
        el: this.querySelector('.featured-collection__pagination'),
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
    this.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-swatch-btn]');
      if (swatch) { 
        e.preventDefault(); this.handleSwatchClick(swatch); 
        return; 
      }

      const atcBtn = e.target.closest('[data-atc-btn]');
      if (atcBtn) { 
        e.preventDefault(); this.handleAtcClick(atcBtn); 
      }
    });
  }

  handleSwatchClick(swatch) {
    const card = swatch.closest('.product-card');
    if (!card) return;

    const { imageId, variantId } = swatch.dataset;

    // Switch visible image
    card.querySelectorAll('[data-image-id]').forEach((img) => {
      img.classList.toggle('product-card__image--active', img.dataset.imageId === imageId);
    });

    // Update active swatch highlight
    card.querySelectorAll('[data-swatch-btn]').forEach((s) => {
      s.classList.toggle('product-card__swatch--active', s === swatch);
    });

    // Sync ATC button to the variant matching the selected color
    if (variantId) {
      const atcBtn = card.querySelector('[data-atc-btn]');
      if (atcBtn) atcBtn.dataset.variantId = variantId;
    }
  }

  async handleAtcClick(btn) {
    const variantId = btn.dataset.variantId;
    if (!variantId || btn.classList.contains('product-card__atc--loading')) return;

    btn.classList.add('product-card__atc--loading');

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 }),
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

      btn.classList.add('product-card__atc--added');
      FeaturedCollection.showToast('Added to cart');
      document.dispatchEvent(new CustomEvent('cart:updated'));
      setTimeout(() => btn.classList.remove('product-card__atc--added'), 2000);

    } catch (err) {
      btn.classList.add('product-card__atc--error');
      FeaturedCollection.showToast(err.message || 'Could not add to cart', 'error');
      setTimeout(() => btn.classList.remove('product-card__atc--error'), 2000);

    } finally {
      btn.classList.remove('product-card__atc--loading');
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
