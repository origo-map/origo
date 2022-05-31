import { Component, InputRange, Dropdown } from '../../ui';
import { Legend } from '../../utils/legendmaker';
import Style from '../../style';

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
  const stylePicker = viewer.getLayerStylePicker(layer);

  const legendComponent = Component({
    render() {
      return `<div id=${this.getId()}>${legend}</div>`;
    }
  });

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

  function hasStylePicker() {
    return stylePicker.length > 0;
  }

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
    const html = `<div class="o-stylepicker-header text-small padding-small">Välj stil</div>${styleSelection.render()}`;
    return hasStylePicker() ? html : '';
  }

  function getStyleDisplayName(styleName) {
    const altStyle = stylePicker.find(s => s.style === styleName);
    return (altStyle && altStyle.title) || styleName;
  }

  const onSelectStyle = (styleTitle) => {
    const altStyleIndex = stylePicker.findIndex(s => s.title === styleTitle);
    const altStyle = stylePicker[altStyleIndex];
    styleSelection.setButtonText(styleTitle);
    const newStyle = Style.createStyle({ style: altStyle.style, clusterStyleName: altStyle.clusterStyle, viewer });
    const legendCmp = document.getElementById(legendComponent.getId());
    legendCmp.innerHTML = Legend(viewer.getStyle(altStyle.style), opacity);
    if (!layer.get('defaultStyle')) layer.setProperties({ defaultStyle: layer.get('styleName') });
    layer.setProperties({ altStyleIndex });
    layer.setProperties({ styleName: altStyle.style });
    layer.setStyle(newStyle);
    layer.dispatchEvent('change:style');
  };

  return Component({
    onInit() {
      styleSelection = Dropdown({
        direction: 'up',
        cls: 'o-stylepicker text-black flex',
        contentCls: 'bg-grey-lighter text-smaller rounded',
        buttonCls: 'bg-white border text-black box-shadow',
        buttonTextCls: 'text-smaller',
        text: getStyleDisplayName(layer.get('styleName')),
        buttonIconCls: 'black',
        ariaLabel: 'Välj stil'
      });
      const components = [transparencySlider];
      if (hasStylePicker()) {
        components.push(styleSelection);
      }
      this.addComponents(components);
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
      if (hasStylePicker()) {
        styleSelection.setItems(stylePicker.map(altStyle => altStyle.title));
        const styleSelectionEl = document.getElementById(styleSelection.getId());
        styleSelectionEl.addEventListener('dropdown:select', (evt) => {
          onSelectStyle(evt.target.textContent);
        });
      }
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} border-bottom">
                <div class="padding-small">
                  ${legendComponent.render()}
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
