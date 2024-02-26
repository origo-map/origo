import { Component } from '../../ui';
import { isHidden, renderSvgIcon } from '../../utils/legendmaker';
import ImageLayerLegendRules, { getSourceUrl } from '../../utils/imagelayerlegendutils';

/**
 * More information: https://developers.arcgis.com/rest/services-reference/enterprise/legend-map-service-.htm
 *
 * @typedef {{
 *   layers: {
 *     layerId: string,
 *     layerName: string,
 *     layerType: string,
 *     minScale: number,
 *     maxScale: number,
 *     legend: {
 *       label: string,
 *       url: string,
 *       imageData: string,
 *       contentType: string,
 *       height: number,
 *       width: number,
 *       values: string[]
 *     }[]
 *   }[]
 * }} ArcGISLegendResponse
 */

/**
 * @param {{layer: Layer, viewer: Viewer}} options
 * @returns {string}
 */
const LayerRow = function LayerRow(options) {
  const {
    layer,
    viewer
  } = options;

  /**
   * @param {string} title
   * @param {string[]} children
   * @returns {string}
   */
  const getTitleWithChildren = (title, children) => `
    <div class="flex row">
      <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
    </div>
    <div class="padding-left">
      <ul>${children.join('\n')}</ul>
    </div>`;

  /**
   * @param {string} title
   * @param {string} icon
   * @returns {string}
   */
  const getTitleWithIcon = (title, icon) => `
    <div class="flex row">
      <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
        <span class="icon">
          ${icon}
        </span>
      </div>
      <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
    </div>`;

  /**
   * @param {string} title
   * @param {string} icon
   * @param {boolean} iconLink
   * @returns {string}
   */
  const getListItem = (title, icon, iconLink = false) => {
    const iconElement = iconLink ? `<img src="${icon}" style="width:100%;height:100%;object-fit:contain;" title="" alt="${title}"/>` : icon;
    return `
      <li class="flex row align-center padding-left padding-right item">
        <div class="flex column">
          <div class="flex row">
            <div class="grey-lightest round compact icon-small light relative no-shrink legend-icon" style="height: 1.5rem; width: 1.5rem;">
              ${iconElement}
            </div>
            <div class="padding-left-small grow no-select overflow-hidden">${title}</div>
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

    const children = style.map((thisStyle, index) => {
      if (!isHidden(thisStyle)) {
        const styleIcon = getStyleIcon(thisStyle);
        const rowTitle = thisStyle[0].label ? thisStyle[0].label : index + 1;
        return getListItem(rowTitle, styleIcon);
      }
      return '';
    });
    return getTitleWithChildren(title, children);
  };

  /**
   * Return the HTML for a legend based for a WMS layer
   *
   * @param {string} title
   * @returns {Promise<string>}
   */
  const getWMSJSONContent = async (title, serverVendor) => {
    const maxResolution = viewer.getResolutions()[viewer.getResolutions().length - 1];
    const getLegendGraphicUrl = layer.getSource().getLegendUrl(maxResolution, {
      legend_options: 'dpi:150'
    });
    const rules = await ImageLayerLegendRules({
      layer,
      viewer
    });

    if (!rules) {
      return `
        <div class="flex row">
          <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
        </div>
        <div class="padding-left">
          <img src="${getLegendGraphicUrl}" alt="${title}" />
        </div>`;
    }
    if (rules.length <= 1) {
      const icon = `<img class="cover" src="${getLegendGraphicUrl}"  alt="${title}"/>`;
      return getTitleWithIcon(title, icon);
    }

    const listItems = rules.map((rule, index) => {
      let ruleImageSource;
      if (serverVendor === 'qgis') {
        ruleImageSource = `data:image/png;base64,${rule.icon}`;
      } else {
        ruleImageSource = `${getLegendGraphicUrl}&rule=${rule.name}`;
      }
      const rowTitle = rule.title ? rule.title : index + 1;
      return getListItem(rowTitle, ruleImageSource, true);
    });
    return getTitleWithChildren(title, listItems);
  };

  /**
   * Return the HTML for a legend based for a ArcGIS MapServer layer
   *
   * @param {string} title
   * @param {string} id
   * @returns {Promise<string>}
   */
  const getAGSJSONContent = async (title, id) => {
    const layersDetails = await ImageLayerLegendRules({
      layer,
      viewer,
      legendOpts: {
        dpi: 150
      }
    });

    if (layersDetails.length === 0) {
      return getTitleWithIcon(title, '');
    }
    const legendLayer = layersDetails.find((l) => +l.layerId === +id || l.layerName === id);
    if (!legendLayer) {
      return getTitleWithIcon(title, '');
    }
    const rules = legendLayer.legend.map((l) => getListItem(l.label, `data:${l.contentType};base64,${l.imageData}`, true));
    return getTitleWithChildren(title, rules);
  };

  return Component({
    async render() {
      const title = layer.get('title') || 'Titel saknas';
      let content = '';
      const style = viewer.getStyle(layer.get('styleName'));
      if (style && style[0] && (!style[0][0].extendedLegend)) {
        content = getStyleContent(title, style);
      } else {
        content = getTitleWithIcon(title, '');
        const lType = layer.get('type');
        const mapSource = viewer.getMapSource();
        const sourceName = layer.get('sourceName');
        const serverVendor = mapSource[sourceName].type?.toLowerCase();
        if ((lType?.includes('AGS')) || ((lType?.includes('WMS')) && (getSourceUrl(layer).includes('/arcgis/'))) || (serverVendor === 'arcgis')) {
          content = await getAGSJSONContent(title, layer.get('id'));
        } else if (lType && lType.includes('WMS')) {
          content = await getWMSJSONContent(title, serverVendor);
        }
      }
      return `
          <li id="${this.getId()}" class="flex row align-center padding-left padding-right item legend-${layer.get('type')}">
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
        if (!layer.get('drawlayer')) {
          overlayEls.push(LayerRow({ layer, viewer }));
        }
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
          <div class="control overflow-hidden flex row o-legend o-no-boxshadow">
            <div class="flex column overflow-hidden relative">
              ${await overlaysCmp.render()}
            </div>
          </div>
        </div>`;
    }
  });
}
