  class ProductMediaSlider {
    constructor(container, selectors) {
      this.container = container;
      this.selectors = selectors;
      this.mainSlider = null;
      this.thumbsSlider = null;
      this.init();
    }

    init() {
      const mainEl = this.container.querySelector(this.selectors.sliderMain);
      if (!mainEl) return;

      const thumbsEl = this.container.querySelector(this.selectors.sliderThumbs);
      
      if (thumbsEl) {
        this.thumbsSlider = new Swiper(thumbsEl, {
          slidesPerView: 6,
          spaceBetween: 8,
          freeMode: true,
          watchSlidesProgress: true,
        });
      }

      this.mainSlider = new Swiper(mainEl, {
        loop: false,
        spaceBetween: 8,
        navigation: {
          prevEl: this.container.querySelector(this.selectors.sliderNavPrev),
          nextEl: this.container.querySelector(this.selectors.sliderNavNext),
        },
        pagination: {
          el: this.container.querySelector(this.selectors.sliderPagination),
          clickable: true,
        },
        thumbs: this.thumbsSlider ? { swiper: this.thumbsSlider } : undefined,
      });
    }

    setActiveImage(mediaId) {
      if (mediaId && this.mainSlider) {
        const slideIndex = this.mainSlider.slides.findIndex(slide => slide.dataset.mediaId === mediaId.toString());
        if (slideIndex >= 0) {
          this.mainSlider.slideTo(slideIndex);
          this.thumbsSlider.slideTo(slideIndex);
        }
      }
    }

    destroy() {
      this.mainSlider?.destroy(true, true);
      this.thumbsSlider?.destroy(true, true);
    }
  }

  class QuickViewOpener extends HTMLElement {
    constructor() {
      super();
      this.currentVariantId = this.dataset.variantId;
    }
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
          document.querySelector('.js-quick-view-wrapper')?.remove();

          const wrapper = document.createElement('div');
          wrapper.classList.add('js-quick-view-wrapper');
          wrapper.innerHTML = response;
          document.body.appendChild(wrapper);
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

    constructor() {
      super();
      this.currentProductVariantData = null;
      this.onKeyDown = this.onKeyDown.bind(this);

      this.selectors = {
        wrapper: '.js-quick-view-wrapper',
        close: '.js-quick-view-close',
        qtyMinus: '.js-qty-minus',
        qtyPlus: '.js-qty-plus',
        qtyInput: '.js-quick-view-qty-input',
        optionInput: '.js-quick-view-option-input',
        productForm: '.js-quick-view-product-form',
        addToCartBtn: '.js-add-to-cart-button',
        formVariantIdInput: '.js-form-variant-id-input',
        sliderMain: '.js-quick-view-slider-wrapper',
        sliderThumbs: '.js-quick-view-slider-thumbs',
        sliderNavPrev: '.js-media-nav-prev',
        sliderNavNext: '.js-media-nav-next',
        sliderPagination: '.js-media-pagination',
        selectedVariant: '[data-selected-variant]',
        optionsWrapper: '.js-quick-view-options-wrapper',
        price: '.js-quick-view-price'
      };
    }

    connectedCallback() {

      this.wrapper = this.closest(this.selectors.wrapper);
      this.currentProductVariantData = JSON.parse(this.querySelector(this.selectors.selectedVariant)?.innerHTML);

      document.addEventListener('keydown', this.onKeyDown);
      this.addEventListener('click', this.onClick.bind(this));
      this.addEventListener('change', this.onChange.bind(this));
      this.addEventListener('input', this.onInput.bind(this));

      this.productMediaSlider = new ProductMediaSlider(this, this.selectors);

      document.body.classList.add('quick-view-open');
      requestAnimationFrame(() => this.classList.add('quick-view--open'));
    }

    disconnectedCallback() {
      document.removeEventListener('keydown', this.onKeyDown);
      document.body.classList.remove('quick-view-open');
      this.productMediaSlider?.destroy();
    }

    onKeyDown(event) {
      if (event.key === 'Escape') this.close();
    }

    close() {
      this.classList.remove('quick-view--open');
      this.addEventListener('transitionend', () => this.wrapper?.remove());
    }

    addToCart(event){
      event.preventDefault();
      event.stopPropagation();

      const form = this.querySelector(this.selectors.productForm);
      if (!form) return;

      const addToCartBtn = this.querySelector(this.selectors.addToCartBtn);
      if (addToCartBtn) {
        addToCartBtn.setAttribute('disabled', true);
      }

      const formData = new FormData(form);
      const id = formData.get('id');
      const quantity = parseInt(formData.get('quantity')) || 1;
      
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            id,
            quantity
          }]
        })
      })
      .then((response) => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Something went wrong. Try again later.');
          })
        }
        return response.json();
      })
      .then((data) => {
        let addedProductsMessage = '';
        data.items.forEach((item, idx) => {
          addedProductsMessage += item.title + (idx === data.items.length - 1 ? '' : ', ');
        });
        addedProductsMessage += ' - ' + 'added to cart';
        
        document.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: addedProductsMessage }
        }));
      })
      .catch((error) => {
        document.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: error.message, type: 'error' }
        }));
      })
      .finally(() => {
        addToCartBtn.removeAttribute('disabled');
      });
    }

    onClick(event) {
      const minusBtn = event.target.closest(this.selectors.qtyMinus);
      const plusBtn = event.target.closest(this.selectors.qtyPlus);
      const closeBtn = event.target.closest(this.selectors.close);
      const addToCartBtn = event.target.closest(this.selectors.addToCartBtn);
      
      if (minusBtn || plusBtn) {
        const qtyInput = this.querySelector(this.selectors.qtyInput);
        if (!qtyInput) return;
        
        const min_value = parseInt(qtyInput.getAttribute('min')) || 1;
        const max_value = parseInt(qtyInput.getAttribute('max')) || 9999;
        let current = parseInt(qtyInput.value) || min_value;
        
        if (minusBtn) current--;
        else if (plusBtn) current++;
        
        qtyInput.value = Math.max(min_value, Math.min(max_value, current));
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if(closeBtn){
        this.close();
      }

      if(addToCartBtn){
        this.addToCart(event);
      }
    }

    onChange(event) {
      if (event.target.matches(this.selectors.qtyInput)) {
        this.updateQuantity(event.target);
      } else if (event.target.matches(this.selectors.optionInput)) {
        this.updateProductData();
      }
    }

    onInput(event) {
      if (event.target.matches(this.selectors.qtyInput)) {
        this.updateQuantity(event.target);
      }
    }

    updateQuantity(qtyInput) {
      const min_value = parseInt(qtyInput.getAttribute('min')) || 1;
      const max_value = parseInt(qtyInput.getAttribute('max')) || 9999;
      let current = parseInt(qtyInput.value) || min_value;
      
      qtyInput.value = Math.max(min_value, Math.min(max_value, current));
      
      const minusBtn = this.querySelector(this.selectors.qtyMinus);
      if (minusBtn) {
        minusBtn.toggleAttribute('disabled', current <= min_value);
      }
    }

    setOptionsContent(newOptionsHTML){
      const currentOptionsWrapper = this.querySelector(this.selectors.optionsWrapper);
      if (newOptionsHTML && currentOptionsWrapper) {
        currentOptionsWrapper.replaceWith(newOptionsHTML);
      }
    }

    setPriceContent(newPriceHTML){
      const currentPrice = this.querySelector(this.selectors.price);
      if (newPriceHTML && currentPrice) {
        currentPrice.replaceWith(newPriceHTML);
      }
    }

    setAddToCartBtnContent(){
      const addToCartBtn = this.querySelector(this.selectors.addToCartBtn);
      if (addToCartBtn && this.currentProductVariantData) {
        const textAddToCart = addToCartBtn.dataset.textAddToCart;
        const textSoldOut = addToCartBtn.dataset.textSoldOut;

        if (this.currentProductVariantData.available) {
          addToCartBtn.removeAttribute('disabled');
          addToCartBtn.textContent = textAddToCart || 'Add To Cart';
        } else {
          addToCartBtn.setAttribute('disabled', true);
          addToCartBtn.textContent = textSoldOut || 'Sold out';
        }
      }
    }

    setCurrentVariantData(newConfigHTML){
      if(newConfigHTML){
        try {
          this.currentProductVariantData = JSON.parse(newConfigHTML.innerHTML);
        } catch(error){
          alert('Quick view error: ' + error.message);
        }
      }

      const currentConfig = this.querySelector(this.selectors.selectedVariant);
      if (newConfigHTML && currentConfig) {
        currentConfig.replaceWith(newConfigHTML);
      }
    }

    setCurrentVariantFormId(){
      const formInput = this.querySelector(this.selectors.formVariantIdInput);
      if (formInput) formInput.value = this.currentProductVariantData.id;
    }

    updateProductData(){  
      const selectedOptionValues = Array.from(this.querySelectorAll(this.selectors.optionInput))
        .filter(input => input.checked)
        .map(input => input.dataset.optionId.split('_')[0]);

      fetch(`/products/${this.dataset.productHandle}?section_id=quick-view&option_values=${selectedOptionValues.join(',')}`)
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then((response) => {
          const html = new DOMParser().parseFromString(response, 'text/html');
          this.setCurrentVariantData(html.querySelector(this.selectors.selectedVariant));

          this.setOptionsContent(html.querySelector(this.selectors.optionsWrapper));
          this.setPriceContent(html.querySelector(this.selectors.price));

          this.setCurrentVariantFormId();
          this.setAddToCartBtnContent();

          this.productMediaSlider.setActiveImage(this.currentProductVariantData.featured_media?.id);
        })
        .catch((error) => {
          alert('Something went wrong. Try again later.')
          console.error('Quick view error', error);
        });
    }
  }

  customElements.define('quick-view-modal', QuickViewModal);
