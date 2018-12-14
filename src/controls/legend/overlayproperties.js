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

  return Component({
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
