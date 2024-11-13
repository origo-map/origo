import WmsOfflineSource from './wmsofflinesource';
import tile from './tile';
import maputils from '../maputils';

// TODO: could be simplified as we only support tile source. Code was stolen from wms layer.
// It just copies options, which could be done in caller.
function createTileSource(options, viewer) {
  const sourceOptions = {
    attributions: options.attribution,
    url: options.url,
    gutter: options.gutter,
    crossOrigin: options.crossOrigin,
    projection: options.projection,
    tileGrid: options.tileGrid,
    params: {
      LAYERS: options.id,
      TILED: true,
      VERSION: options.version,
      FORMAT: options.format,
      STYLES: options.style, // getMap uses STYLES, send both to not have to bother in the source
      STYLE: options.style // Legendgraphics uses STYLE
    }
  };

  if (options.params) {
    Object.keys(options.params).forEach((element) => {
      sourceOptions.params[element] = options.params[element];
    });
  }
  sourceOptions.offlineStoreName = options.offlineStoreName;
  sourceOptions.offlineMinZoom = options.offlineMinZoom;
  sourceOptions.offlineMaxZoom = options.offlineMaxZoom;
  sourceOptions.name = options.name;
  sourceOptions.styleUrl = options.styleUrl;
  sourceOptions.noRemoteStyle = options.noRemoteStyle;
  const offlineSource = new WmsOfflineSource(sourceOptions, viewer);
  // This call is async, but we can't await it here. Let it just finish when it's done.
  offlineSource.init().then(() => {
    console.log(`init offline layer ${options.id}`);
  })
    .catch((e) => {
      // TODO: throw up a red angry toaster
      console.error(`Failed to initialise offline database${e}`);
    });
  return offlineSource;
}
/**
 * Factory method for wmsoffline layer.
 *
 * Example configuration:
 * {
 *    "offlineStoreName": "multipoly", // Name in indexeddb. Not same as layer as it can be shared between applications
 *    "offlineMinZoom": 6, // outermost zoom level to cache. Use usual minZoom for visibility.
 *    "offlineMaxZoom": 8, // innermost zoom level to cache. Use usual maxZoom for visibility
 *    "name": "sf:multipolygonlager", // Same as for WMS. id can also be used
 *    "title": "Offline", // Title in legend
 *    "group": "root",
 *    "type": "WMSOFFLINE", // This type,
 *    "visible": true,
 *    "source": "local",
 *    "compressionRatio": 0.1
 *  }
 *
 * More options are available:
 *
 * style: Only support for named style with one icon or image or client side symbol for legend. Image, icon and affects legend. Also supports wmsStyle for alternative
 *        server style. If no style is specified or style contain no icon, image or client side symbol, server side style is queried on preload using getLegendGraphics
 * params: any optional WMS params. Necessary params will be overridden (LAYERS, MINX etc)
 * @param {any} layerOptions
 * @param {any} viewer
 * @returns
 */
const wmsoffline = function wmsoffline(layerOptions, viewer) {
  const wmsDefault = {
    featureinfoLayer: null,
    queryable: false
  };
  const sourceDefault = {
    crossOrigin: 'anonymous',
    version: '1.1.1',
    gutter: 0,
    format: 'image/png'
  };
  const wmsOptions = Object.assign(wmsDefault, layerOptions);
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.offlineStoreName = wmsOptions.offlineStoreName;
  sourceOptions.offlineMaxZoom = wmsOptions.offlineMaxZoom;
  sourceOptions.offlineMinZoom = wmsOptions.offlineMinZoom;
  sourceOptions.attribution = wmsOptions.attribution;
  sourceOptions.crossOrigin = wmsOptions.crossOrigin ? wmsOptions.crossOrigin : sourceOptions.crossOrigin;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.id = wmsOptions.id;
  sourceOptions.params = Object.assign({}, wmsOptions.sourceParams);
  sourceOptions.format = wmsOptions.format ? wmsOptions.format : sourceOptions.format;
  sourceOptions.name = wmsOptions.name;

  if (wmsOptions.style) {
    const namedStyle = viewer.getStyle(wmsOptions.style);
    // Hijack remote styles as they must be performed by source
    if (namedStyle) {
      const src = namedStyle[0].find(s => (s.image && s.image.src) || (s.icon && s.icon.src));
      if (src) {
        const img = src.image ? src.image : src.icon;
        sourceOptions.styleUrl = img.src;
      } else {
        // Style is clientside. What happens if it is both client side and icon? Won't work unless we strip the icon part.
        wmsOptions.styleName = wmsOptions.style;
        sourceOptions.noRemoteStyle = true;
      }

      // Check if there is an alternative wms style. Could as well be defined directly in the params, but for compatibility with
      // ordinary wms we support it
      const alternativeStyle = namedStyle[0].find(s => s.wmsStyle);
      if (alternativeStyle) {
        sourceOptions.style = alternativeStyle.wmsStyle;
      }
    }
  }
  if (!sourceOptions.noRemoteStyle) {
    // Set a temmporary default style until the real deal can be fecthed from indexeddb

    // TODO: maybe set a better lookin default, but if it is an image, it must be cached by service worker first.
    const style = [[{
      text: { text: 'H' }
    }]];

    viewer.addStyle('wmsofflinestyle', style);
    wmsOptions.styleName = 'wmsofflinestyle';
  }

  if (wmsOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(wmsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (wmsOptions.extent) {
      sourceOptions.tileGrid.extent = wmsOptions.extent;
    }
  }

  const source = createTileSource(sourceOptions, viewer);
  // All wmsOptions will by magic become properties on the layer.
  return tile(wmsOptions, source);
};

export default wmsoffline;
