import WmsOfflineSource from './wmsofflinesource';
import tile from './tile';
import maputils from '../maputils';

/** Name of temporary legend style */
const offlineStyleName = 'wmsofflinestyle';
/**
 * Factory method for wmsoffline layer.
 *
 * @param {Object} layerOptions All options as per documentation
 * @param {any} viewer The one and only viewer
 * @returns {any} An OL Layer instance
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

  /** Here be all options as passed from config with some defaults */
  const wmsOptions = Object.assign(wmsDefault, layerOptions);
  /** Only options that will be passed to source */
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.offlineStoreName = wmsOptions.offlineStoreName;
  sourceOptions.offlineMaxZoom = wmsOptions.offlineMaxZoom;
  sourceOptions.offlineMinZoom = wmsOptions.offlineMinZoom;
  sourceOptions.attribution = wmsOptions.attribution;
  sourceOptions.crossOrigin = wmsOptions.crossOrigin ? wmsOptions.crossOrigin : sourceOptions.crossOrigin;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.format = wmsOptions.format ? wmsOptions.format : sourceOptions.format;
  sourceOptions.name = wmsOptions.name;
  sourceOptions.clip = wmsOptions.clip;
  sourceOptions.hasThemeLegend = wmsOptions.hasThemeLegend;
  // Style handling is a bit messy as we can't call network. The source will have to fetch from server and store in indexedDb
  // if a server side image is to be used.
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
        if (sourceOptions.noRemoteStyle) {
          // Have to trigger read from indexeddb as above logic assumes no remote legend, but setting alternative wms style is just that.
          sourceOptions.noRemoteStyle = false;
        }
      }
    }
  }
  // Niice, it means if there is a remote style ...
  if (!sourceOptions.noRemoteStyle) {
    // Set a temmporary default style until the real deal can be fetched from indexeddb
    // which can only happen after first preload.
    // This is the offline wifi svg, but setting styles this way does not support referencing the linked svg.
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21 11l2-2c-3.73-3.73-8.87-5.15-13.7-4.31l2.58 2.58c3.3-.02 6.61 1.22 9.12 3.73zm-2 2c-1.08-1.08-2.36-1.85-3.72-2.33l3.02 3.02.7-.69zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zM3.41 1.64L2 3.05 5.05 6.1C3.59 6.83 2.22 7.79 1 9l2 2c1.23-1.23 2.65-2.16 4.17-2.78l2.24 2.24C7.79 10.89 6.27 11.74 5 13l2 2c1.35-1.35 3.11-2.04 4.89-2.06l7.08 7.08 1.41-1.41L3.41 1.64z"/></svg>';
    const style = [[{
      image: {
        src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
      }
    }]];
    viewer.addStyle(offlineStyleName, style);
    wmsOptions.styleName = offlineStyleName;
  }

  if (wmsOptions.tileGrid) {
  // layer can have grid
    sourceOptions.tileGrid = maputils.tileGrid(wmsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    // Source can have a default grid. Overwrite the grid definition with the actual grid.
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    // Default to map grid
    sourceOptions.tileGrid = viewer.getTileGrid();
    // Limit extent for this layer
    if (wmsOptions.extent) {
      sourceOptions.tileGrid.extent = wmsOptions.extent;
    }
  }

  // Some options are sent in the params object as they automagically will end up en the requst as params
  const params = {
    LAYERS: wmsOptions.id,
    TILED: true,
    VERSION: sourceOptions.version,
    FORMAT: sourceOptions.format,
    STYLES: sourceOptions.style, // getMap uses STYLES, send both to not have to bother in the source
    STYLE: sourceOptions.style // Legendgraphics uses STYLE
  };
  // Take user's params and overwrite/add
  sourceOptions.params = Object.assign(params, wmsOptions.sourceParams);

  const source = new WmsOfflineSource(sourceOptions, viewer);
  // This call is async, but we can't await it here. Let it just finish when it's done.
  source.init()
    .catch((e) => {
      // TODO: How to localize outside a control?
      const msg = `Failed to initialise offline database${e}`;
      viewer.getLogger().createToast({ status: 'danger', message: msg });
    });
  // All wmsOptions will by magic become properties on the layer.
  return tile(wmsOptions, source);
};

export default wmsoffline;
