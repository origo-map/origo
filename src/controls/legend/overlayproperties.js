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
  const opacityControl = layer.get('opacityControl') !== false;
  const style = viewer.getStyle(layer.get('styleName'));
  const legend = Legend(style, opacity);
  let overlayEl;
  let sliderEl;
  let label = '';
  if (options.labelOpacitySlider) {
    label = `<span class="text-smaller">${options.labelOpacitySlider}</span>`;
  }
  const inputRange = opacityControl ? `<div class="padding-smaller o-tooltip active"><input id="opacitySlider" type="range" min="0" max="1" value="${opacity}" step="0.1"><div class="text-align-center"><span class="text-smaller float-left">0%</span>${label}<span class="text-smaller float-right">100%</span></div></div>` : '';

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
      overlayEl.addEventListener('click', (e) => {
        this.dispatch('click', e);
        e.preventDefault();
      });
      if (opacityControl) {
        sliderEl = document.getElementById('opacitySlider');
        sliderEl.addEventListener('input', () => {
          layer.setOpacity(sliderEl.valueAsNumber);
        });
        sliderEl.addEventListener('change', () => {
          layer.setOpacity(sliderEl.valueAsNumber);
        });
      }
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} border-bottom">
                <div class="padding-small">${legend}${inputRange}</div>
                <p class="padding-bottom-small padding-x text-small">${abstract}</p>
              </div>`;
    },
    labelCls: 'text-small text-semibold',
    title
  });
};

export default OverlayProperties;
