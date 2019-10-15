import { Component } from '../../ui';
import { Legend } from '../../utils/legendmaker';

const OverlayProperties = function OverlayProperties(options = {}) {
  const {
    cls: clsOptions = '',
    layer,
    viewer
  } = options;

  const cls = `${clsOptions} item`.trim();
  const title = layer.get('title') || '';
  const abstract = layer.get('abstract') || '';
  const opacity = layer.getOpacity();
  const style = viewer.getStyle(layer.get('styleName'));
  const legend = Legend(style, opacity);
  let overlayEl;
  let sliderEl;

  function extendedLegendZoom(e) {
    const parentOverlay = document.getElementById(options.parent.getId());

    if (e.target.classList.contains('extendedlegend')) {
      if (parentOverlay.classList.contains('width-100')) {
        parentOverlay.classList.remove('width-100');
      } else {
        parentOverlay.classList.add('width-100');
      }
    }
  }

  return Component({
    onInit() {
      this.on('click', (e) => {
        extendedLegendZoom(e);
      });
    },
    onRender() {
      overlayEl = document.getElementById(this.getId());
      sliderEl = overlayEl.getElementsByTagName('input')[0];
      overlayEl.addEventListener('click', (e) => {
        this.dispatch('click', e);
        e.preventDefault();
      });
      sliderEl.addEventListener('input', (e) => {
       layer.setOpacity(sliderEl.value);
      });
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} border-bottom">
                <div class="padding-small">${legend}<input type="range" min="0" max="1" value="${layer.getOpacity()}" step="0.05"></div>
                <p class="padding-bottom-small padding-x text-small">${abstract}</p>
              </div>`;
    },
    labelCls: 'text-small text-semibold',
    title
  });
};

export default OverlayProperties;
