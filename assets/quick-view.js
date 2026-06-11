
  class QuickViewOpener extends HTMLElement {
    connectedCallback() {
      this.selectors = {
        quick_view_button: this.querySelector('.js-quick-view-button')
      }
      this.addEventListener('click', this.onClick.bind(this));
    }

    onClick(event) {
      event.preventDefault();
      event.stopPropagation();
      
      this.selectors.quick_view_button?.setAttribute('disabled', true);

      fetch(`/products/${this.dataset.productHandle}?section_id=quick-view`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then((response) => {
          const host = document.createElement('div');
          host.classList.add('js-quick-view-host');
          host.innerHTML = response;
          document.body.appendChild(host);
        })
        .catch((error) => {
          alert('Something went wrong. Try again later.')
          console.error('Quick view error', error);
        })
        .finally(() => {
          this.selectors.quick_view_button?.removeAttribute('disabled');
        });
    }
  }
  customElements.define('quick-view-opener', QuickViewOpener);

  class QuickViewModal extends HTMLElement {
    connectedCallback() {
      this.selectors = {
        host: this.closest('.js-quick-view-host'),
        qty_input: this.querySelector('.js-quick-view-qty-input'),
        qty_minus: this.querySelector('.js-qty-minus'),
        qty_plus: this.querySelector('.js-qty-plus'),
        close: this.querySelectorAll('.js-quick-view-close'),
        slider_main: this.querySelector('.quick-view__slider--wrapper'),
        slider_thumbs: this.querySelector('.quick-view__slider--thumbs'),
        slider_nav_prev: this.querySelector('.js-media-nav-prev'),
        slider_nav_next: this.querySelector('.js-media-nav-next'),
        slider_pagination: this.querySelector('.js-media-pagination'),
      }

      this.onKeydown = (event) => {
        if (event.key === 'Escape') this.close();
      };
      document.addEventListener('keydown', this.onKeydown);

      this.selectors.close.forEach((el) =>
        el.addEventListener('click', () => this.close())
      );

      this.initQuantity();
      this.initSlider();

      document.body.classList.add('quick-view-open');
      requestAnimationFrame(() => this.classList.add('quick-view--open'));
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeydown);
      document.body.classList.remove('quick-view-open');
      this.mainSlider?.destroy(true, true);
      this.thumbsSlider?.destroy(true, true);
    }

    close() {
      this.classList.remove('quick-view--open');
      this.addEventListener('transitionend', () => this.selectors.host.remove());
    }

    initQuantity() {
      const qty_input = this.selectors.qty_input;
      if (!qty_input) return;

      const qty_minus_btn = this.selectors.qty_minus;
      const qty_plus_btn = this.selectors.qty_plus;
      const min_value = parseInt(qty_input.getAttribute('min')) || 1;
      const max_value = parseInt(qty_input.getAttribute('max')) || 9999;

      const getCurrentValue = () => parseInt(qty_input.value) || min_value;

      const setQuantity = (value) => {
        qty_input.value = Math.max(min_value, Math.min(max_value, value));
        qty_input.dispatchEvent(new Event('change', { bubbles: true }));
      }

      qty_input.addEventListener('change', () => qty_minus_btn?.toggleAttribute('disabled', getCurrentValue() <= min_value));
      qty_input.addEventListener('input', () => setQuantity(getCurrentValue()));
      qty_minus_btn?.addEventListener('click', () => setQuantity(getCurrentValue() - 1));
      qty_plus_btn?.addEventListener('click', () => setQuantity(getCurrentValue() + 1));
    }

    initSlider() {
      const mainEl = this.selectors.slider_main;
      if (!mainEl) return;

      const thumbsEl = this.selectors.slider_thumbs;
      const isDesktop = window.innerWidth >= 769;

      console.log('thumbsEl', window.innerWidth);
      
      if (isDesktop && thumbsEl) {
        this.thumbsSlider = new Swiper(thumbsEl, {
          slidesPerView: 6,
          spaceBetween: 8,
          freeMode: true,
          watchSlidesProgress: true,
        });
      } else {
        thumbsEl?.remove();
      }

      this.mainSlider = new Swiper(mainEl, {
        loop: false,
        spaceBetween: 0,
        navigation: {
          prevEl: this.selectors.slider_nav_prev,
          nextEl: this.selectors.slider_nav_next,
        },
        pagination: {
          el: this.selectors.slider_pagination,
          clickable: true,
        },
        thumbs: this.thumbsSlider ? { swiper: this.thumbsSlider } : null,
      });
    }
  }

  customElements.define('quick-view-modal', QuickViewModal);
