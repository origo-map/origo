import { Component, InputRange, Dropdown } from '../../ui';
import { Legend } from '../../utils/legendmaker';
import Style from '../../style';

const OverlayProperties = function OverlayProperties(options = {}) {
  const {
    cls: clsOptions = '',
    group,
    layer,
    viewer,
    localization
  } = options;
  let cls = '';
  let title;
  let abstract;
  let description;
  let opacity;
  let opacityControl;
  let style;
  let legendComponent;
  let stylePicker = [];
  if (layer) {
    cls = `${clsOptions} item`.trim();
    title = layer.get('title') || '';
    abstract = layer.get('abstract') || '';
    description = layer.get('description') || '';
    opacity = layer.getOpacity();
    opacityControl = layer.get('opacityControl') !== false;
    style = viewer.getStyle(layer.get('styleName'));
    legendComponent = Legend({ styleRules: style, opacity, layer, viewer, clickable: false });
    stylePicker = viewer.getLayerStylePicker(layer);
  } else if (group) {
    title = group.title;
    abstract = !group.showAbstractInLegend ? group.abstract || '' : '';
    description = group.description || '';
    opacity = group.opacity || 1;
    opacityControl = group.opacityControl === true;
  }
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

  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'legend', targetKey: key });
  }

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
    if (hasStylePicker()) {
      const html = `<div class="o-stylepicker-header text-small padding-small">${localize('renderStyleSelect')}</div>${styleSelection.render()}`;
      return html;
    }
    return '';
  }

  function getStyleDisplayName(styleName) {
    let altStyle = stylePicker.find(s => s.style === styleName);
    if (!altStyle) {
      altStyle = stylePicker.find(s => s.defaultWMSServerStyle);
    }
    return (altStyle && altStyle.title) || styleName;
  }

  function getSubgroups(topGroup) {
    const groups = viewer.getGroups();
    const groupArr = [topGroup];
    function loopGroups(checkGroup) {
      if (groups) {
        for (let i = 0; i < groups.length; i += 1) {
          if (groups[i].parent === checkGroup.name) {
            groupArr.push(groups[i]);
            loopGroups(groups[i], groups);
          }
        }
      }
    }
    loopGroups(topGroup, groups);
    return groupArr;
  }

  const onSelectStyle = (styleTitle) => {
    const altStyleIndex = stylePicker.findIndex(s => s.title === styleTitle);
    const altStyle = stylePicker[altStyleIndex];
    styleSelection.setButtonText(styleTitle);
    const legendCmp = document.getElementById(legendComponent.getId());
    if (!layer.get('defaultStyle')) {
      layer.setProperties({ defaultStyle: layer.get('styleName') });
    }
    layer.setProperties({ altStyleIndex });

    if (layer.get('type') === 'WMS') {
      const layerSource = layer.get('source');
      const sourceParams = layerSource.getParams();
      let styleToSet = altStyle.style;

      if (altStyle.initialStyle) {
        styleToSet = layer.get('defaultStyle');
      } else if (altStyle.defaultWMSServerStyle) {
        styleToSet = `${layer.get('name')}_WMSServerDefault`;
      }

      sourceParams.STYLES = altStyle.defaultWMSServerStyle ? '' : styleToSet;
      layerSource.refresh();
      layer.set('styleName', styleToSet);
      let maxResolution;
      if (!(altStyle.legendParams) || !(Object.keys(altStyle.legendParams).find(key => key.toUpperCase() === 'SCALE'))) {
        maxResolution = viewer.getResolutions()[viewer.getResolutions().length - 1];
      }
      let styleNameParam = styleToSet;
      if (altStyle.defaultWMSServerStyle) styleNameParam = '';
      const getLegendString = layerSource.getLegendUrl(maxResolution, {
        STYLE: styleNameParam,
        ...altStyle.legendParams
      });
      const newWmsStyle = [[{
        icon: {
          src: `${getLegendString}`
        },
        extendedLegend: altStyle.hasThemeLegend || false
      }]];
      viewer.addStyle(styleToSet, newWmsStyle);
      legendCmp.innerHTML = Legend({ styleRules: viewer.getStyle(styleToSet), opacity, layer, viewer, clickable: false }).render();
      layer.dispatchEvent('change:style');
      return;
    }

    layer.set('styleName', altStyle.style);
    legendCmp.innerHTML = Legend({ styleRules: viewer.getStyle(altStyle.style), opacity, layer, viewer, clickable: false }).render();
    const newStyle = Style.createStyle({ style: altStyle.style, clusterStyleName: altStyle.clusterStyle, viewer });
    layer.setStyle(newStyle);
    layer.dispatchEvent('change:style');
  };

  return Component({
    onInit() {
      const components = [];
      if (layer) {
        components.push(legendComponent);
      }
      if (opacityControl) {
        components.push(transparencySlider);
      }
      if (hasStylePicker()) {
        styleSelection = Dropdown({
          direction: 'up',
          cls: 'o-stylepicker text-black flex',
          contentCls: 'bg-grey-lighter text-smaller rounded',
          contentStyle: 'max-height: 12em; overflow-y: auto;',
          buttonCls: 'bg-white border text-black box-shadow',
          buttonTextCls: 'text-smaller',
          text: getStyleDisplayName(layer.get('styleName')),
          buttonIconCls: 'black',
          ariaLabel: localize('renderStyleSelect')
        });
        components.push(styleSelection);
      }
      this.addComponents(components);
      if (layer) {
        this.on('click', (e) => {
          extendedLegendZoom(e);
        });
      }
    },
    onRender() {
      if (layer) {
        viewer.getControlByName('legend').dispatch('renderOverlayProperties', { cmp: this, layer });
      }
      this.dispatch('render');
      overlayEl = document.getElementById(this.getId());
      overlayEl.addEventListener('click', (e) => {
        this.dispatch('click', e);
      });
      if (opacityControl) {
        sliderEl = document.getElementById(transparencySlider.getId());
        sliderEl.nextElementSibling.value *= 100;
        sliderEl.addEventListener('input', () => {
          if (group) {
            const groups = viewer.getGroups();
            const groupArr = getSubgroups(group, groups);
            groupArr.forEach(grp => {
              const activeGrp = grp;
              viewer.getLayersByProperty('group', activeGrp.name).forEach(l => l.setOpacity(sliderEl.valueAsNumber));
              activeGrp.opacity = sliderEl.valueAsNumber;
            });
            viewer.getLayersByProperty('id', `grouplayer-${group.name}`).forEach(l => l.setOpacity(sliderEl.valueAsNumber));
          }
          if (layer) {
            layer.setOpacity(sliderEl.valueAsNumber);
          }
          sliderEl.nextElementSibling.value *= 100;
        });
        sliderEl.addEventListener('change', () => {
          if (group) {
            const groupArr = getSubgroups(group);
            groupArr.forEach(grp => {
              const activeGrp = grp;
              viewer.getLayersByProperty('group', activeGrp.name).forEach(l => l.setOpacity(sliderEl.valueAsNumber));
              activeGrp.opacity = sliderEl.valueAsNumber;
            });
            viewer.getLayersByProperty('id', `grouplayer-${group.name}`).forEach(l => l.setOpacity(sliderEl.valueAsNumber));
          }
          if (layer) {
            layer.setOpacity(sliderEl.valueAsNumber);
          }
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
                  ${legendComponent ? legendComponent.render() : ''}
                  ${renderStyleSelection()}
                  ${opacityControl ? transparencySlider.render() : ''}
                </div>
                ${abstract ? `<div class="padding-small padding-x text-small">${abstract}</div>` : ''}
                ${description ? `<div class="padding-small padding-x text-small">${description}</div>` : ''}
              </div>`;
    },
    labelCls: 'text-small text-semibold',
    title
  });
};

export default OverlayProperties;
