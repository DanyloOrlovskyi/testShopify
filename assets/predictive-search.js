class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onOverlayClick = this.onOverlayClick.bind(this);
    this.debounceTimer = null;
    this.activeTab = '';
    this.results = {};
    this.currentQuery = '';
  }

  connectedCallback() {
    this.input = this.querySelector('.predictive-search__input');
    this.clearBtn = this.querySelector('.predictive-search__clear-btn');
    this.closeBtn = this.querySelector('.predictive-search__close-btn');
    this.toggleBtn = this.querySelector('.predictive-search__toggle');
    this.overlay = this.querySelector('.predictive-search-overlay');
    this.initialState = this.querySelector('.predictive-search__initial');
    this.resultsSection = this.querySelector('.predictive-search__results');
    this.tabsContainer = this.querySelector('.predictive-search__tabs-inner');
    this.resultsList = this.querySelector('.predictive-search__results-list');
    this.noResults = this.querySelector('.predictive-search__no-results');
    this.footer = this.querySelector('.predictive-search__footer');
    this.seeAllLink = this.querySelector('.predictive-search__see-all');

    this.resourcesType = this.dataset.resourcesType || 'product';
    this.moneyFormat = this.dataset.moneyFormat || '{{amount}}';
    this.arrowIcon = window.__predictiveSearchIcons?.arrowRight || '';
    this.placeholderImage = window.__predictiveSearchIcons?.placeholderImage || '';
    this.ellipse = window.__predictiveSearchIcons?.ellipse || '·';

    this.toggleBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.clearBtn?.addEventListener('click', () => this.clearInput());
    this.overlay?.addEventListener('click', this.onOverlayClick);
    this.input?.addEventListener('input', this.onInput);
    document.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  open() {
    this.overlay?.removeAttribute('hidden');
    this.toggleBtn?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('search-overlay-open');
    this.input?.focus();
  }

  close() {
    this.overlay?.setAttribute('hidden', '');
    this.toggleBtn?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('search-overlay-open');
  }

  clearInput() {
    if (!this.input) return;
    this.input.value = '';
    this.clearBtn?.setAttribute('hidden', '');
    this.currentQuery = '';
    this.showInitialState();
    this.input.focus();
  }

  onOverlayClick(e) {
    if (e.target === this.overlay) this.close();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.close();
  }

  onInput() {
    const query = this.input.value.trim();

    if (query.length > 0) {
      this.clearBtn?.removeAttribute('hidden');
    } else {
      this.clearBtn?.setAttribute('hidden', '');
    }

    clearTimeout(this.debounceTimer);

    if (!query) {
      this.currentQuery = '';
      this.showInitialState();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      this.currentQuery = query;
      this.fetchResults(query);
    }, 500);
  }

  fetchResults(query) {
    const root = window.Shopify?.routes?.root ?? '/';
    const params = new URLSearchParams();

    params.set('q', query);
    params.set('resources[limit]', '6');
    params.set('resources[type]', this.resourcesType);
    params.set('resources[options][unavailable_products]', 'hide');

    fetch(`${root}search/suggest.json?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(({ resources }) => {
        this.results = resources.results;
        this.renderResults(query);
      })
      .catch((err) => {
        console.error('[PredictiveSearch]', err);
      });
  }

  renderResults(query) {
    this.updateSeeAllLink(query);

    const enabledTypes = this.resourcesType.split(',');
    const availableTabs = [];

    if (enabledTypes.includes('product') && this.results.products?.length) {
      availableTabs.push({ key: 'products', label: 'Products' });
    }
    if (enabledTypes.includes('article') && this.results.articles?.length) {
      availableTabs.push({ key: 'articles', label: 'Articles' });
    }
    if (enabledTypes.includes('page') && this.results.pages?.length) {
      availableTabs.push({ key: 'pages', label: 'Pages' });
    }

    if (!availableTabs.length) {
      this.showNoResults();
      return;
    }

    if (!availableTabs.find((t) => t.key === this.activeTab)) {
      this.activeTab = availableTabs[0].key;
    }

    this.tabsContainer.innerHTML = availableTabs
      .map(
        (tab) =>
          `<button
            class="predictive-search__tab"
            type="button"
            role="tab"
            data-tab="${tab.key}"
            aria-selected="${tab.key === this.activeTab}"
          >${tab.label}</button>`
      )
      .join('');

    this.tabsContainer.querySelectorAll('.predictive-search__tab').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    this.initialState.setAttribute('hidden', '');
    this.noResults.setAttribute('hidden', '');
    this.resultsSection.removeAttribute('hidden');
    this.footer.removeAttribute('hidden');

    this.renderActiveTab();
  }

  switchTab(tabKey) {
    this.activeTab = tabKey;
    this.tabsContainer.querySelectorAll('.predictive-search__tab').forEach((btn) => {
      btn.setAttribute('aria-selected', btn.dataset.tab === tabKey ? 'true' : 'false');
    });
    this.renderActiveTab();
  }

  renderActiveTab() {
    const items = this.results[this.activeTab] || [];
    if (this.activeTab === 'products') {
      this.resultsList.innerHTML = items.map((item) => this.renderProduct(item)).join('');
    } else if (this.activeTab === 'articles') {
      this.resultsList.innerHTML = items.map((item) => this.renderArticle(item)).join('');
    } else if (this.activeTab === 'pages') {
      this.resultsList.innerHTML = items.map((item) => this.renderPage(item)).join('');
    }
    this.resultsSection.dataset.activeType = this.activeTab;
  }

  renderProduct(product) {
    const imageSrc = product.image?.src ?? product.image;
    const imageHtml = imageSrc
      ? `<img src="${imageSrc}" alt="${product.title}" width="120" height="120" loading="lazy">`
      : this.placeholderImage;

    const onSale = parseFloat(product.compare_at_price_min) > parseFloat(product.price);
    const priceHtml = this.formatMoney(product.price);
    const comparePriceHtml = onSale
      ? `<s class="predictive-search__product-compare-price">${this.formatMoney(product.compare_at_price_min)}</s>`
      : '';

    return `<a href="${product.url}" class="predictive-search__product-item">
      <div class="predictive-search__product-image">${imageHtml}</div>
      <div class="predictive-search__product-info">
        <p class="predictive-search__product-title">${product.title}</p>
        <p class="predictive-search__product-price${onSale ? ' predictive-search__product-price--sale' : ''}">
          ${priceHtml}${comparePriceHtml}
        </p>
      </div>
    </a>`;
  }

  formatMoney(amount) {
    const number = parseFloat(amount);
    if (isNaN(number)) return amount;

    const formatted = new Intl.NumberFormat(document.documentElement.lang || 'en', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);

    return this.moneyFormat
      .replace('{{amount}}', formatted)
      .replace('{{amount_no_decimals}}', Math.round(number))
      .replace('{{amount_with_comma_separator}}', formatted.replace('.', ','))
      .replace('{{amount_no_decimals_with_comma_separator}}', Math.round(number));
  }

  renderArticle(article) {
    const imageSrc = article.image?.src ?? article.image;
    const imageHtml = imageSrc
      ? `<img src="${imageSrc}" alt="${article.title}" width="120" height="120" loading="lazy">`
      : this.placeholderImage;

    const metaParts = [];
    if (article.published_at) {
      metaParts.push(
        new Date(article.published_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    }
    if (article.author) metaParts.push(article.author);
    if (article.comments_enabled && article.comments_count > 0) {
      metaParts.push(`${article.comments_count} comment${article.comments_count === 1 ? '' : 's'}`);
    }

    const metaHtml = metaParts.length
      ? `<p class="predictive-search__article-meta">${metaParts.join(` ${this.ellipse} `)}</p>`
      : '';

    return `<a href="${article.url}" class="predictive-search__article-item">
      <div class="predictive-search__article-image">${imageHtml}</div>
      <div class="predictive-search__article-info">
        ${metaHtml}
        <p class="predictive-search__article-title">${article.title}</p>
      </div>
    </a>`;
  }

  renderPage(page) {
    return `<a href="${page.url}" class="predictive-search__page-item">
      <span class="predictive-search__page-title">${page.title}</span>
      <span class="predictive-search__page-icon">
        ${this.arrowIcon}
      </span>
    </a>`;
  }

  showInitialState() {
    this.initialState?.removeAttribute('hidden');
    this.resultsSection?.setAttribute('hidden', '');
    this.noResults?.setAttribute('hidden', '');
    this.footer?.setAttribute('hidden', '');
    if (this.tabsContainer) this.tabsContainer.innerHTML = '';
    if (this.resultsList) this.resultsList.innerHTML = '';
  }

  showNoResults() {
    this.initialState?.setAttribute('hidden', '');
    this.resultsSection?.setAttribute('hidden', '');
    this.noResults?.removeAttribute('hidden');
    this.footer?.setAttribute('hidden', '');
  }

  updateSeeAllLink(query) {
    if (this.seeAllLink) {
      this.seeAllLink.href = `/search?q=${encodeURIComponent(query)}`;
    }
  }
}

customElements.define('predictive-search', PredictiveSearch);
