import { Component, InputRange, Dropdown } from '../../ui';
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
  const alternativeStyles = viewer.getLayerAlternativeStyles(layer);

  let styleSelection;
  let overlayEl;
  let sliderEl;
  let label = '';
  if (options.labelOpacitySlider) {
    label = options.labelOpacitySlider;
  }
  const transparencySlider = InputRange({
    cls: 'o-tooltip active',
    minValue: 0,
    maxValue: 1,
    initialValue: opacity,
    step: 0.1,
    unit: '%',
    label
  });

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

  function renderStyleSelection() {
    return alternativeStyles ? styleSelection.render() : '';
  }

  return Component({
    onInit() {
      styleSelection = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-white flex',
        contentCls: 'bg-grey-darker text-smallest rounded',
        buttonCls: 'bg-black text-white',
        ariaLabel: 'Välj skala',
        buttonIconCls: 'white'
      });

      this.addComponents([transparencySlider, styleSelection]);
      this.on('click', (e) => {
        extendedLegendZoom(e);
      });
    },
    onRender() {
      this.dispatch('render');
      sliderEl = document.getElementById(transparencySlider.getId());
      overlayEl = document.getElementById(this.getId());
      overlayEl.addEventListener('click', (e) => {
        this.dispatch('click', e);
      });
      if (opacityControl) {
        sliderEl.nextElementSibling.value *= 100;
        sliderEl.addEventListener('input', () => {
          layer.setOpacity(sliderEl.valueAsNumber);
          sliderEl.nextElementSibling.value *= 100;
        });
        sliderEl.addEventListener('change', () => {
          layer.setOpacity(sliderEl.valueAsNumber);
        });
      }
      if (alternativeStyles) {
        styleSelection.setItems(Object.keys(alternativeStyles));
      }
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} border-bottom">
                <div class="padding-small">
                  ${legend}
                  ${renderStyleSelection()}
                  ${transparencySlider.render()}
                </div>
                ${abstract ? `<div class="padding-small padding-x text-small">${abstract}</div>` : ''}
              </div>`;
    },
    labelCls: 'text-small text-semibold',
    title
  });
};

export default OverlayProperties;
