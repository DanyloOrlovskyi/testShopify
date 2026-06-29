class BlogPostsSection extends HTMLElement {
  constructor() {
    super();
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.isHovered = false;
    this.animationFrameId = null;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.animateCursor = this.animateCursor.bind(this);
  }

  connectedCallback() {
    this.selectors = {
        wrappers: this.querySelectorAll('.js-blog-posts-section-post-card-image-wrapper'),
        cursor: this.querySelector('.js-blog-posts-section-custom-cursor')
    }
    if (!this.selectors.wrappers.length || !this.selectors.cursor) return;

    window.addEventListener('mousemove', this.onMouseMove);

    this.selectors.wrappers.forEach((wrapper) => {
      wrapper.addEventListener('mouseenter', this.onMouseEnter);
      wrapper.addEventListener('mouseleave', this.onMouseLeave);
    });

    this.animateCursor();
  }

  disconnectedCallback() {
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  onMouseEnter(e) {
    this.isHovered = true;
    this.selectors.cursor.style.opacity = '1';

    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.cursorX = this.mouseX;
    this.cursorY = this.mouseY;
    this.selectors.cursor.style.transform = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0) translate(-50%, -50%)`;
  }

  onMouseLeave() {
    this.isHovered = false;
    this.selectors.cursor.style.opacity = '0';
  }

  animateCursor() {
    if (this.isHovered || Math.abs(this.cursorX - this.mouseX) > 0.1 || Math.abs(this.cursorY - this.mouseY) > 0.1) {
      this.cursorX += (this.mouseX - this.cursorX) * 0.15;
      this.cursorY += (this.mouseY - this.cursorY) * 0.15;
      this.selectors.cursor.style.transform = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0) translate(-50%, -50%)`;
    }
    this.animationFrameId = requestAnimationFrame(this.animateCursor);
  }
}

customElements.define('blog-posts-section', BlogPostsSection);