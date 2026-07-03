class ReviewsSection extends HTMLElement {

    connectedCallback() {
        this.selectors = {
            prevButton: '.js-review-section-slide-prev-button',
            nextButton: '.js-review-section-slide-next-button',
            sliderWrapper: '.js-reviews-section-slider'
        }

        this.elements = {
            sliderWrapper: this.querySelector(this.selectors.sliderWrapper),
        }

        if (!this.elements.sliderWrapper) return;

        this.slider = new Swiper(this.elements.sliderWrapper, {
            direction: 'horizontal',
            loop: true,
            navigation:{
                nextEl: this.selectors.nextButton,
                prevEl: this.selectors.prevButton,
            }
        });

        this.removeAttribute('hidden');
    }
}

customElements.define('reviews-section', ReviewsSection);