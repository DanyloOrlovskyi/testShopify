class Toast extends HTMLElement {
  constructor() {
    super();
    this.timeoutId = null;
  }

  connectedCallback() {
    this.messageEl = this.querySelector('.js-toast-message');

    document.addEventListener('show-toast', this.onShowToast.bind(this));
  }

  onShowToast(event) {
    const { message, type = 'info' } = event.detail;

    if (!this.messageEl) return;

    clearTimeout(this.timeoutId);

    this.classList.remove('toast-open', 'toast--error');

    this.messageEl.textContent = message;

    this.classList.add('toast-open');
    if (type === 'error') {
      this.classList.add('toast--error');
    }

    this.timeoutId = setTimeout(() => this.close(), 5000);
  }

  close() {
    this.classList.remove('toast-open');
    
    this.addEventListener('transitionend', () => {
      if (!this.classList.contains('toast-open')) {
        this.classList.remove('toast--error');
      }
    }, { once: true });
  }
}

customElements.define('custom-toast', Toast);