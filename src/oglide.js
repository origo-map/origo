import Glide from '@glidejs/glide';

const generateSlides = function generateSlides(o) {
  const { slides, oiItems } = o;
  oiItems.forEach((item) => {
    const slide = document.createElement('li');
    slide.classList.add('glide__slide');
    slide.appendChild(item);
    slides.appendChild(slide);
  });
};
const generateBullets = function generateBullets(o) {
  const { bullets, oiItems } = o;
  oiItems.forEach((item, index) => {
    const bullet = document.createElement('button');
    bullet.classList.add('glide__bullet');
    bullet.setAttribute('data-glide-dir', `=${index}`);
    bullets.appendChild(bullet);
  });
};

function OGlide(options) {
  // Polyfill for IE11 to set class on svg element
  if (!Object.getOwnPropertyDescriptor(Element.prototype,'classList')){
    if (HTMLElement&&Object.getOwnPropertyDescriptor(HTMLElement.prototype,'classList')){
      Object.defineProperty(Element.prototype,'classList',Object.getOwnPropertyDescriptor(HTMLElement.prototype,'classList'));
    }
  } 
  const { id, callback } = options;
  const oiContent = Array.from(document.querySelectorAll('.o-identify-content'));
  const target = document.querySelector(id);
  const glide = document.createElement('div');
  glide.classList.add('glide');
  target.appendChild(glide);
  const track = document.createElement('div');
  track.classList.add('glide__track');
  track.setAttribute('data-glide-el', 'track');
  const slides = document.createElement('ul');
  slides.classList.add('glide__slides');
  generateSlides({ slides, oiItems: oiContent });
  track.appendChild(slides);
  glide.appendChild(track);
  /** Generate Buttons */
  const arrows = document.createElement('div');
  arrows.classList.add('glide_arrows');
  arrows.setAttribute('data-glide-el', 'controls');
  /** LEFT */
  const leftBtn = document.createElement('button');
  leftBtn.classList.add('glide__arrow');
  leftBtn.classList.add('glide__arrow--left');
  leftBtn.setAttribute('data-glide-dir', '<');
  const leftSpan = document.createElement('span');
  leftSpan.classList.add('icon');
  const leftSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leftSvg.classList.add('o-icon-fa-chevron-left');
  const leftUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  leftUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#fa-chevron-left');
  leftSvg.appendChild(leftUse);
  leftSpan.appendChild(leftSvg);
  leftBtn.appendChild(leftSpan);
  arrows.appendChild(leftBtn);
  /** RIGHT */
  const rightBtn = document.createElement('button');
  rightBtn.classList.add('glide__arrow');
  rightBtn.classList.add('glide__arrow--right');
  rightBtn.setAttribute('data-glide-dir', '>');
  const rightSpan = document.createElement('span');
  rightSpan.classList.add('icon');
  const rightSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  rightSvg.classList.add('o-icon-fa-chevron-right');
  const rightUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  rightUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#fa-chevron-right');
  rightSvg.appendChild(rightUse);
  rightSpan.appendChild(rightSvg);
  rightBtn.appendChild(rightSpan);
  arrows.appendChild(rightBtn);
  glide.appendChild(arrows);
  /** Generate bullets  */
  const bullets = document.createElement('div');
  bullets.classList.add('glide__bullets');
  bullets.setAttribute('data-glide-el', 'controls[nav]');
  generateBullets({ bullets, oiItems: oiContent });
  glide.appendChild(bullets);

  const el = new Glide('.glide', {
    type: 'carousel',
    ocusAt: '1',
    startAt: 0,
    perView: 1,
    direction: 'ltr',
    gap: 0,
    perTouch: 1
  });
  el.mount();
  el.on('move', () => {
    callback({ item: { index: el.index, count: oiContent.length } });
  });
}

export default OGlide;
