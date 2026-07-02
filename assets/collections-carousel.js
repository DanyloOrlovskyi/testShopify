class CollectionsCarousel extends HTMLElement {

    connectedCallback() {   
        this.selectors = {
            carousel: '.js-collections-carousel-wrapper',
            slide: '.js-collections-carousel-slide',
            slideImage: '.js-collections-carousel-slide-image',
            prevButton: '.js-collections-carousel-button-prev',
            nextButton: '.js-collections-carousel-button-next',
            backgroundImage: '.js-collections-carousel-background-image',
        }
        
        this.elements = {
            carousel: this.querySelector(this.selectors.carousel),
            prevButton: this.querySelector(this.selectors.prevButton),
            nextButton: this.querySelector(this.selectors.nextButton),
            backgroundImage: this.querySelector(this.selectors.backgroundImage),
            slides: this.querySelectorAll(this.selectors.slide)
        }

        this.carousel = null;
        this.initCarousel();

        this.handleSlideMouseOver = this.handleSlideMouseOver.bind(this);
        this.handleSlideMouseLeave = this.handleSlideMouseLeave.bind(this);
        this.addEventListener('mouseover', this.handleSlideMouseOver);

        this.setBackgroundImage(this.elements.slides[0].querySelector(this.selectors.slideImage));

        this.removeAttribute('hidden');
    }

    disconnectedCallback(){
        this.removeEventListener('mouseover', this.handleSlideMouseOver);

        this.elements.slides.forEach((slide) => {
            slide.removeEventListener('mouseleave', this.handleSlideMouseLeave);
        });

        if (this.carousel) {
            this.carousel.destroy(true, true);
            this.carousel = null;
        }
    }

    handleSlideMouseOver(event) {
        const slideWrapper = event.target.closest(this.selectors.slide);
        if (slideWrapper) {
            const collectionImage = slideWrapper.querySelector(this.selectors.slideImage);
            this.setBackgroundImage(collectionImage);

            this.classList.add('slide-hovered');

            slideWrapper.addEventListener('mouseleave', this.handleSlideMouseLeave);
        }
    }

    handleSlideMouseLeave() {
        this.classList.remove('slide-hovered');
    }

    setBackgroundImage(image) {
        if (!image) return;
        const backgroundImage = this.elements.backgroundImage;
        if (!backgroundImage) return;
        backgroundImage.src = image.src;
        backgroundImage.alt = image.alt;
    }

    initCarousel() {
        if (!this.elements.carousel) return;

        const sliderSettings = {
            loop: false,
            slidesPerView: 1.4,
            spaceBetween: 8,
            pagination: false,
            breakpoints: {
                768: {
                    slidesPerView: 4.1,
                },
                1280: { 
                    slidesPerView: 6.1,
                },
            }
        };

        if (this.elements.nextButton && this.elements.prevButton) {
            sliderSettings.navigation = {
                nextEl: this.elements.nextButton,
                prevEl: this.elements.prevButton,
            };
        }

        this.carousel = new Swiper(this.elements.carousel, sliderSettings);
    }
}

customElements.define('collections-carousel', CollectionsCarousel);