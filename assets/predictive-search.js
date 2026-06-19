class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onOverlayClick = this.onOverlayClick.bind(this);
    this.onResourcesClick = this.onResourcesClick.bind(this);
    this.debounceTimer = null;
  }

  connectedCallback() {
    this.selectors = {
      input: this.querySelector('.js-predictive-search-input'),
      clearBtn: this.querySelector('.js-predictive-search-clear-btn'),
      closeBtn: this.querySelector('.js-predictive-search-close-btn'),
      togglerBtn: this.querySelector('.js-predictive-search-toggler'),
      wrapper: this.querySelector('.js-predictive-search'),
      initialWrapper: this.querySelector('.js-predictive-search-initial'),
      searchResultsWrapper: this.querySelector('.js-predictive-search-search-results')
    };

    this.resultTypes = this.dataset.resultTypes || 'product';
    console.log('this.selectors.clearBtn', this.selectors.clearBtn)
    this.selectors.togglerBtn.addEventListener('click', () => this.open());
    this.selectors.closeBtn.addEventListener('click', () => this.close());
    this.selectors.clearBtn.addEventListener('click', () => this.clearInput());
    this.selectors.wrapper.addEventListener('click', this.onOverlayClick);
    this.selectors.input.addEventListener('input', this.onInput);
    this.selectors.searchResultsWrapper.addEventListener('click', this.onResourcesClick);
    document.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  open() {
    this.selectors.wrapper.removeAttribute('hidden');
    this.selectors.togglerBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('search-overlay-open');
    this.selectors.input.focus();
  }

  close() {
    this.selectors.wrapper.setAttribute('hidden', '');
    this.selectors.togglerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('search-overlay-open');
  }

  clearInput() {
    if (!this.selectors.input) return;
    this.selectors.input.value = '';
    this.selectors.clearBtn.setAttribute('hidden', '');
    this.showInitialState();
    this.selectors.input.focus();
  }

  onOverlayClick(e) {
    if (e.target === this.selectors.wrapper) this.close();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.close();
  }

  onInput() {
    const query = this.selectors.input.value.trim();

    if (query.length > 0) {
      this.selectors.clearBtn.removeAttribute('hidden');
    } else {
      this.selectors.clearBtn.setAttribute('hidden', '');
    }

    clearTimeout(this.debounceTimer);

    if (!query) {
      this.showInitialState();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.fetchResults(query);
    }, 500);
  }

  fetchResults(query) {
    this.selectors.input.disabled = true;
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('resources[limit]', '6');
    params.set('resources[type]', this.resultTypes);
    params.set('resources[options][unavailable_products]', 'hide');
    params.set('section_id', 'predictive-search');

    fetch(`/search/suggest?${params}`)
      .then((response) => {
        if (!response.ok){
          const error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((response_html) => {
        const resultsMarkup = new DOMParser()
        .parseFromString(response_html, 'text/html')
        .querySelector('.shopify-section').innerHTML;
        this.selectors.searchResultsWrapper.innerHTML = resultsMarkup ? resultsMarkup : response_html;
        this.selectors.initialWrapper.setAttribute('hidden', '');
        this.selectors.searchResultsWrapper.removeAttribute('hidden');
        this.selectors.input.setAttribute('aria-expanded', 'true');
      })
      .catch((err) => {
        alert('Something went wrong! Please try again later.');
        console.error('[PredictiveSearch]', err);
      }).finally(() => {
        this.selectors.input.disabled = false;
      })
  }

  onResourcesClick(e) {
    const tab = e.target.closest('.predictive-search__tab');
    if (tab) this.switchTab(tab.dataset.tab);
  }

  switchTab(tabKey) {
    this.selectors.searchResultsWrapper.querySelectorAll('.predictive-search__tab').forEach((btn) => {
      btn.setAttribute('aria-selected', btn.dataset.tab === tabKey ? 'true' : 'false');
    });
    this.selectors.searchResultsWrapper.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.toggleAttribute('hidden', panel.dataset.tabPanel !== tabKey);
    });
    this.selectors.searchResultsWrapper
      .querySelector('.predictive-search__results')
      .setAttribute('data-active-type', tabKey);
  }

  showInitialState() {
    this.selectors.initialWrapper.removeAttribute('hidden');
    this.selectors.searchResultsWrapper.setAttribute('hidden', '');
    if (this.selectors.searchResultsWrapper) this.selectors.searchResultsWrapper.innerHTML = '';
    this.selectors.input.setAttribute('aria-expanded', 'false');
  }
}

customElements.define('predictive-search', PredictiveSearch);
