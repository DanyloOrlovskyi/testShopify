class Slideshow extends HTMLElement {
  connectedCallback() {
    const blocks = this.querySelectorAll('.shopify-block');
    blocks.forEach(block => block.classList.add('swiper-slide'));

    this.selectors = {
      swiperContainer: this.querySelector('.js-swiper-container'),
      pagination: this.querySelector('.js-slideshow-pagination'),
      next: this.querySelector('.js-slideshow-button-next'),
      prev: this.querySelector('.js-slideshow-button-prev'),
      slides: this.querySelectorAll('.js-slideshow-swiper-slide')
    };

    this.sliderSettings = {
      loop: true,
      autoHeight: true,
      pagination: {
        el: this.selectors.pagination,
        clickable: true,
      },
      navigation: {
        nextEl: this.selectors.next,
        prevEl: this.selectors.prev,
      },
      on: {
        init: (swiper) => this.updateMedia(swiper),
        slideChange: (swiper) => this.updateMedia(swiper),
      }
    };

    if(this.dataset.autoplaySpeed) {
      this.sliderSettings.autoplay = {
        delay: this.dataset.autoplaySpeed * 1000,
      };
    }

    this.swiper = new Swiper(this.selectors.swiperContainer, this.sliderSettings);

    this.setAspectRatio();

    this.removeAttribute('hidden');
  }

  setAspectRatio() {
    if (this.dataset.heightMode !== 'auto') return;

    const firstMedia = this.selectors.slides[0]?.querySelector('.js-media-element');
    if (!firstMedia) return;

    const ratioDesktop = firstMedia.dataset.aspectRatio;
    const ratioMobile = firstMedia.dataset.aspectRatioMobile;

    this.selectors.swiperContainer.style.setProperty('--ratio-percent', `${ratioDesktop}%`);
    this.selectors.swiperContainer.style.setProperty('--ratio-percent-mobile', `${ratioMobile}%`);
  }

  updateMedia(swiper) {
    swiper.slides.forEach(slide => this.pauseMedia(slide));
    this.playMedia(swiper.slides[swiper.activeIndex]);
  }

  pauseMedia(slide) {
    if (!slide) return;
    slide.querySelectorAll('video').forEach(video => video.pause());
    slide.querySelectorAll('iframe').forEach(frame => this.controlIFrame(frame, 'pause'));
  }

  playMedia(slide) {
    if (!slide) return;
    slide.querySelectorAll('video').forEach(video => video.play());
    slide.querySelectorAll('iframe').forEach(frame => this.controlIFrame(frame, 'play'));
  }

  controlIFrame(frame, action) {

    if (!frame || !frame.contentWindow) return;

    const src = frame.src;

    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      const func = action === 'play' ? 'playVideo' : 'pauseVideo';
      frame.contentWindow.postMessage(
        JSON.stringify(
          {
            event: 'command',
            func: func,
            args: ''
          }),
          '*'
      );
    } else if (src.includes('vimeo')) {
      frame.contentWindow.postMessage(
        JSON.stringify({ 
          method: action
        }), 
        '*'
      );
    }
  }
}

customElements.define('slideshow-component', Slideshow);
