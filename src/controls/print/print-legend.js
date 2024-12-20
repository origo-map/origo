import { ImageArcGISRest, ImageWMS } from 'ol/source';
import { Component } from '../../ui';
import { isHidden, renderSvgIcon } from '../../utils/legendmaker';

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
   * @param {Layer} aLayer
   * @returns {string|null}
   */
  const getOneUrl = (aLayer) => {
    const source = aLayer.getSource();
    if ((source instanceof ImageWMS || source instanceof ImageArcGISRest) && typeof source.getUrl === 'function') {
      return source.getUrl();
    } else if (typeof source.getUrls === 'function') {
      return source.getUrls()[0];
    }
    return null;
  };

  /**
   * Helper that creates a WMS getLegendGraphics request url string
   * @param {any} url base url
   * @param {any} layerName name of layer to create legend for
   * @param {any} format valid mime type
   * @returns {string} A WMS getLegendGraphics request url string
   */
  const createGetlegendGrapicUrl = (url, layerName, format) => `${url}?SERVICE=WMS&layer=${layerName}&format=${format}&version=1.1.1&request=getLegendGraphic&scale=401&legend_options=dpi:300`;

  /**
   * Returns the URL to the WMS legend in the specified format
   *
   * @param {Layer} aLayer
   * @param {"image/png"|"application/json"} format
   * @returns {string|null}
   */
  const getWMSLegendUrl = (aLayer, format) => {
    const url = getOneUrl(aLayer);
    const layerName = aLayer.get('name');
    const style = viewer.getStyle(aLayer.get('styleName'));
    if (style && style[0] && style[0][0] && style[0][0].icon) {
      if (style[0][0].icon.src.includes('?')) {
        return `${style[0][0].icon.src}&format=${format}`;
      }
      return `${style[0][0].icon.src}?format=${format}`;
    }
    return createGetlegendGrapicUrl(url, layerName, format);
  };

  /**
   * Returns the JSON-encoded legend from the ArcGIS Legend Map Service
   *
   * More information: https://developers.arcgis.com/rest/services-reference/enterprise/legend-map-service-.htm
   *
   * @param {Layer} aLayer
   * @param {number} dpi
   * @returns {Promise<ArcGISLegendResponse>}
   */
  const getAGSLegendJSON = async (aLayer, dpi = 150) => {
    // rewrite the URL if needed
    const mapServerUrl = getOneUrl(aLayer).replace(/\/arcgis(\/rest)?\/services\/([^/]+\/[^/]+)\/MapServer\/WMSServer/, '/arcgis/rest/services/$2/MapServer');
    const url = `${mapServerUrl}/legend?f=json&dpi=${dpi}`;
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

  /**
   * @param {string|null} url
   * @returns {Promise<null|any>}
   */
  const getLegendGraphicJSON = async (url) => {
    try {
      if (!url) {
        return null;
      }
      const response = await fetch(url);
      return await response.json();
    } catch (e) {
      console.warn(e);
      return null;
    }
  };

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

    const hasThematicStyle = (layer.get('thematicStyling') === true);
    const children = style.map((thisStyle, index) => {
      if (!(isHidden(thisStyle))) {
        if ((!(hasThematicStyle)) || (!(thisStyle[0]?.visible === false))) {
          const styleIcon = getStyleIcon(thisStyle);
          const rowTitle = thisStyle[0].label ? thisStyle[0].label : index + 1;
          return getListItem(rowTitle, styleIcon);
        }
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
  const getWMSJSONContent = async (title) => {
    const getLegendGraphicUrl = getWMSLegendUrl(layer, 'image/png');
    const json = await getLegendGraphicJSON(getWMSLegendUrl(layer, 'application/json'));

    if (!json) {
      return `
        <div class="flex row">
          <div class="padding-x-small grow no-select overflow-hidden">${title}</div>
        </div>
        <div class="padding-left">
          <img src="${getLegendGraphicUrl}" alt="${title}" />
        </div>`;
    }
    // Handle the simple one first. One layer, one rule
    if (json.Legend.length === 1 && json.Legend[0].rules.length <= 1) {
      const icon = `<img class="cover" src="${getLegendGraphicUrl}"  alt="${title}"/>`;
      return getTitleWithIcon(title, icon);
    }

    const thematicStyle = (layer.get('thematicStyling') === true) ? viewer.getStyle(layer.get('styleName')) : undefined;
    const rules = [];
    let index = 0;
    const layerName = layer.get('id');
    const isLayerGroup = json.Legend.length > 1;
    // Loop all layers in json response. Usually there is only one, but Layer Groups have several.
    json.Legend.forEach(currLayer => {
      let currLayerName = currLayer.layerName;
      currLayer.rules.forEach(currRule => {
        if (!(layer.get('thematicStyling')) || thematicStyle[0]?.thematic[index]?.visible) {
          let layerImageUrl;
          if (isLayerGroup) {
            // This is layer group and the contained layer is most likely not known to us,
            // so we can't treat is as an Origo layer.
            // Generate a request and hope that the server has a layer by that name.
            const baseUrl = getOneUrl(layer);
            const layerWs = layerName.split(':');
            if (layerWs.length > 1) {
              currLayerName = `${layerWs[0]}:${currLayer.layerName}`;
            }
            // This is a little bit shaky, if Layer Group name constains workspace, contained layers must come from
            // the same workspace, but if layer group is a top level layer group (no workspace), contained layers can
            // come from any workspace but the json response NEVER contains info about workspace.
            // So for Layer Groups with a workspace prefix we can assume that the actual layers should have the same workspace prefix,
            // but for top level Layer Groups we have absolutely no idea which workspace the layer is in.
            // But not all is lost as Geoserver tries its best to get the legend for any workspace with that layer name.
            // Problem is when the same layer name appears in several workspaces. In that case you get from what is configured as default.
            // One more tricky thing is that layer groups can configure different symbols than the actual layer.
            // Querying the layer Group for png will return the group layer style, but the getLegendGrapich for each layer
            // will return the symbol for the actual layer, so legend and print legend will differ.
            layerImageUrl = createGetlegendGrapicUrl(baseUrl, currLayerName, 'image/png');
          } else {
            layerImageUrl = getLegendGraphicUrl;
          }
          let ruleImageUrl = `${layerImageUrl}`;
          // Add specific rule if necessary. If there is only one rule there is no need (in fact it will probably break as most
          // styles using only one rule will not have a named rule). This is to handle Layer Groups without rules in some of the contained
          // layer's style
          if (currLayer.rules.length > 1) {
            ruleImageUrl += `&rule=${currRule.name}`;
          }
          const rowTitle = currRule.title ? currRule.title : index + 1;
          rules.push(getListItem(rowTitle, ruleImageUrl, true));
        }
        index += 1;
      });
    });

    return getTitleWithChildren(title, rules);
  };

  /**
   * Return the HTML for a legend based for a ArcGIS MapServer layer
   *
   * @param {string} title
   * @param {string} id
   * @returns {Promise<string>}
   */
  const getAGSJSONContent = async (title, id) => {
    const json = await getAGSLegendJSON(layer);
    if (!json) {
      return getTitleWithIcon(title, '');
    }
    const legendLayer = json.layers.find((l) => +l.layerId === +id || l.layerName === id);
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
        if ((lType && lType.includes('AGS')) || /\/arcgis\/services\/[^/]+\/[^/]+\/MapServer\/WMSServer/.test(getOneUrl(layer))) {
          content = await getAGSJSONContent(title, layer.get('id'));
        } else if (lType && lType.includes('WMS')) {
          content = await getWMSJSONContent(title);
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
          const rowPromises = overlayEls.map((item) => item.render());
          const rows = await Promise.all(rowPromises);
          return `<ul id="${this.getId()}" class="list">${rows.reverse().join('')}</ul>`;
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
