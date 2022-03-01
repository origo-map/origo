import { ImageWMS, ImageArcGISRest } from 'ol/source';
import {
  Component
} from '../../ui';
import { renderSvgIcon } from '../../utils/legendmaker';

const LayerRow = function LayerRow(options) {
  const {
    layer,
    viewer
  } = options;

  const getLegendUrl = (aLayer, type) => {
    const source = aLayer.getSource();
    let url = '';
    if ((source instanceof ImageWMS || source instanceof ImageArcGISRest) && typeof source.getUrl === 'function') {
      url = source.getUrl();
    } else if (typeof source.getUrls === 'function') {
      url = source.getUrls()[0];
    } else {
      return '';
    }
    const layerName = aLayer.get('name');
    return `${url}?SERVICE=WMS&layer=${layerName}&format=${type}&version=1.1.1&request=getLegendGraphic&scale=401&legend_options=dpi:300`;
  };

  const getLegendGraphicJSON = async (url) => {
    try {
      if (!url) {
        return null;
      }
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  const getTitleWithChildren = (title, children) => `
    <div class="flex row">
      <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
    </div>
    <div class="padding-left">
      <ul>${children}</ul>
    </div>`;

  const getTitleWithIcon = (title, icon) => `
    <div class="flex row">
      <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
        <span class="icon">
          ${icon}
        </span>
      </div>
      <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
    </div>`;

  const getListItem = (title, icon, iconLink = false) => {
    const iconElement = iconLink ? `<img class="cover" src="${icon}" style="" title=""></img>` : icon;
    return `
      <li class="flex row align-center padding-left padding-right item">
        <div class="flex column">
          <div class="flex row">
            <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
              <span class="icon">
                ${iconElement}
              </span>
            </div>
            <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
          </div>
        </div>
      </li>`;
  };

  const getStyleIcon = (style) => {
    const styleIcon = renderSvgIcon(style, { opacity: 100 });
    if (styleIcon.includes('<svg')) {
      return styleIcon.replaceAll('24px', '100%');
    }
    return styleIcon.replaceAll('style=""', 'style="height:100%;"');
  };

  const getStyleContent = (title, style) => {
    if (style.length < 2) {
      return getTitleWithIcon(title, getStyleIcon(style[0]));
    }

    let styles = '';
    style.forEach((thisStyle, index) => {
      const styleIcon = getStyleIcon(thisStyle);
      const rowTitle = thisStyle[0].label ? thisStyle[0].label : index + 1;
      styles += getListItem(rowTitle, styleIcon);
    });
    return getTitleWithChildren(title, styles);
  };

  const getJSONContent = async (title) => {
    const getLegendGraphicUrl = getLegendUrl(layer, 'image/png');
    const json = await getLegendGraphicJSON(getLegendUrl(layer, 'application/json'));

    if (!json) {
      return getTitleWithIcon(title, '');
    }
    if (json.Legend[0].rules.length <= 1) {
      const icon = `<img class="cover" src="${getLegendGraphicUrl}">`;
      return getTitleWithIcon(title, icon);
    }

    let rules = '';
    json.Legend[0].rules.forEach((rule, index) => {
      const ruleImageUrl = `${getLegendGraphicUrl}&rule=${rule.name}`;
      const rowTitle = rule.title ? rule.title : index + 1;
      rules += getListItem(rowTitle, ruleImageUrl, true);
    });
    return getTitleWithChildren(title, rules);
  };

  return Component({
    async render() {
      const title = layer.get('title') || 'Titel saknas';
      let content = '';

      const style = viewer.getStyle(layer.get('styleName'));
      if (style && style[0]) {
        content = getStyleContent(title, style);
      } else if ((!layer.get('type')) || (layer.get('type').includes('AGS'))) {
        content = getTitleWithIcon(title, '');
      } else {
        content = await getJSONContent(title);
      }
      return `
          <li id="${this.getId()}" class="flex row align-center padding-left padding-right item">
            <div class="flex column">
              ${content}
            </div>
          </li>`;
    }
  });
};

const LayerRows = function LayerRows(options) {
  const {
    viewer
  } = options;

  return Component({
    async render() {
      const overlays = viewer.getLayers().filter((layer) => layer.get('group') !== 'background' && layer.get('group') !== 'none' && layer.get('visible'));
      const overlayEls = [];

      overlays.forEach((layer) => {
        overlayEls.push(LayerRow({ layer, viewer }));
      });
      const layerListCmp = Component({
        async render() {
          const content = await overlayEls.reduce(async (acc, item) => await acc + await item.render(), '');
          return `<ul id="${this.getId()}" class="list">${content}</ul>`;
        }
      });
      return `
        <div id="${this.getId()}" class="overflow-hidden" style="height: 100%;">
          <div class="flex column overflow-hidden width-100" style="width: 100%">
            ${await layerListCmp.render()}
          </div>
        </div>`;
    }
  });
};

export default function PrintLegend(options = {}) {
  const {
    viewer
  } = options;

  const setVisible = (display) => {
    document.getElementById('legendContainer').hidden = !display.showPrintLegend;
  };

  return Component({
    setVisible(display) {
      setVisible(display);
    },
    async render() {
      const overlaysCmp = LayerRows({
        viewer
      });

      return `
        <div id="legendContainer">
          <div class="control overflow-hidden flex row o-legend">
            <div class="flex column overflow-hidden relative">
              ${await overlaysCmp.render()}
            </div>
          </div>
        </div>`;
    }
  });
}
