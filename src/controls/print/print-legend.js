import { ImageWMS, ImageArcGISRest } from 'ol/source';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
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
    const url = source instanceof ImageWMS || source instanceof ImageArcGISRest ? source.getUrl() : source.getUrls()[0];
    const layerName = aLayer.get('name');
    return `${url}?SERVICE=WMS&layer=${layerName}&format=${type}&version=1.1.1&request=getLegendGraphic&scale=401&legend_options=dpi:300`;
  };

  const getLegendGraphicJSON = async (url) => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  return Component({
    async render() {
      const title = layer.get('title') || 'Titel saknas';
      let content = '';
      let isTheme = false;
      let icon = '';
      let json;
      let getLegendGraphicUrl;

      if ((layer instanceof TileLayer || layer instanceof ImageLayer) && !layer.get('type').includes('AGS')) {
        const style = viewer.getStyle(layer.get('styleName'));
        if (style && style[0]) {
          icon = renderSvgIcon(style[0], { opacity: 100 });
        } else {
          getLegendGraphicUrl = getLegendUrl(layer, 'image/png');
          json = await getLegendGraphicJSON(getLegendUrl(layer, 'application/json'));
          if (!json) {
            isTheme = false;
          } else {
            isTheme = json.Legend[0].rules.length > 1;
            icon = `<img class="cover" src="${getLegendGraphicUrl}">`;
          }
        }
      } else if (layer instanceof VectorLayer || layer instanceof VectorImageLayer) {
        const style = viewer.getStyle(layer.get('styleName'));
        if (style && style[0]) {
          icon = renderSvgIcon(style[0], { opacity: 100 });
          icon = icon.replaceAll('24px', '100%');
        }
      }

      if (!isTheme) {
        content = `
          <div class="flex row">
            <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
              <span class="icon">
                ${icon}
              </span>
            </div>
            <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
          </div>`;
      } else if (getLegendGraphicUrl) {
        let rules = '';
        json.Legend[0].rules.forEach((rule, index) => {
          const ruleImageUrl = `${getLegendGraphicUrl}&rule=${rule.name}`;
          const rowTitle = rule.title ? rule.title : index + 1;
          rules += `
            <li class="flex row align-center padding-left padding-right item">
              <div class="flex column">
                <div class="flex row">
                  <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
                    <span class="icon">
                      <img class="cover" src="${ruleImageUrl}" style="" title="">
                    </span>
                  </div>
                  <div class="padding-x-small grow no-select overflow-hidden">${rowTitle}</div>
                </div>
              </div>
            </li>`;
        });
        content = `
          <div class="flex row">
            <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
          </div>
          <div class="padding-left">
            <ul>${rules}</ul>
          </div>`;
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
