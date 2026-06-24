class BannerScrollImages extends HTMLElement {
    connectedCallback() {
        this.selectors = {
            innerWrapper: this.querySelector('.js-banner-scroll-images-inner-wrapper'),
            firstCol: this.querySelector('.js-banner-scroll-col--first'),
            secondCol: this.querySelector('.js-banner-scroll-col--second'),
            thirdCol: this.querySelector('.js-banner-scroll-col--third'),
            blocksWrapper: this.querySelector('.js-banner-scroll-images-blocks'),
        }
        this.scrollSpeed = 0.3;
        this.init();
    }

    init() {
        if(window.innerWidth < 768) {
            this.selectors.innerWrapper.removeAttribute('hidden');
            return;
        }
        this.bindScroll();
        this.selectors.innerWrapper.removeAttribute('hidden');
    }

    bindScroll() {

        this.onScroll();
        window.addEventListener('scroll', () => {
            requestAnimationFrame(() => this.onScroll());
        });
    }

    onScroll(){
        const rect = this.getBoundingClientRect();
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const offset = progress * this.offsetHeight * this.scrollSpeed;

        this.selectors.firstCol.style.transform = `translateY(-${offset}px)`;
        this.selectors.secondCol.style.transform = `translateY(${offset * 1.5}px)`;
        this.selectors.thirdCol.style.transform = `translateY(-${offset * 2}px)`;
    }
}
customElements.define('banner-scroll-images', BannerScrollImages);