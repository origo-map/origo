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

  function extendedLegendZoom(e) {
    const parentOverlay = document.getElementById(options.parent.getId());

    if (e.target.classList.contains('extendedlegend') && e.target.naturalWidth > e.target.width) {
      parentOverlay.classList.add('width-100');
    } else {
      parentOverlay.classList.remove('width-100');
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
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} border-bottom">
                <div class="padding-small">${legend}</div>
                <p class="padding-bottom-small padding-x text-small">${abstract}</p>
              </div>`;
    },
    labelCls: 'text-small text-semibold',
    title
  });
};

export default OverlayProperties;
