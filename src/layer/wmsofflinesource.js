import WKT from 'ol/format/WKT';
import { fromExtent } from 'ol/geom/Polygon';
import { createLoader, getLegendUrl } from 'ol/source/wms';
import ImageTileOfflineSource from './imagetileofflinesource';

/**
 * WMS tile offline source class.
 * Handles preloading WMS tiles and WMS legend graphics
 */
export default class WmsOfflineSource extends ImageTileOfflineSource {
  /**
   * Creates a new instance of WmsOfflineSource. Remember to call Init afterwards to set up async stuff.
   * @param {any} options The options to use.
   */
  constructor(options, viewer) {
    // Most stuff is happening in the base class.
    super(options, viewer);

    this.legendUrl = options.styleUrl ? options.styleUrl : getLegendUrl(options, 90);
    this.style = options.style;
    this.options = options;
  }

  /**
   * Overrides base class.
   * Preloads the given extent. Does not resolve until all tiles have been stored in indexddb.
   * @param {any} extent
   *
   */
  async preload(extent, progressCallback) {
    // Fetch and store legend graphics
    if (this.legendUrl) {
      const legendReq = await fetch(this.legendUrl);
      const legendImg = await legendReq.blob();
      await this.storeLegendGraphic(legendImg);
    }

    // Store extent first to get an id to link each tile with.
    // Usage is limited as a new extent will overwrite the tile and the connection
    // will be lost. Also if tile load fails, the extent will be bigger than actual extent of existing tiles
    const extentId = await this.storeExtent(extent);
    const extents = super.calculateTiles(extent);
    const paramstosend = Object.assign({}, this.options.params);
    // Clip all tiles to extent to avoid zoomed out levels to cover more area.
    // only works for GeoServer as clip is a vendor parameter.
    if (this.options.clip) {
      const wkt = new WKT();
      const clipenv = wkt.writeGeometry(fromExtent(extent));
      paramstosend.clip = clipenv;
    }
    // Create a function to fetch WMS tiles. Not to be confused with the ImageTile class loader.
    // Use the helper from OL. It can be done manully, but someone has already provided it for us.
    // Request depends on params, so a new loader must be created for each call to preload.
    const wmsLoader = createLoader({ ratio: 1, url: this.options.url, params: paramstosend, crossOrigin: this.options.crossOrigin, projection: this.options.projection });

    const allDownloadPromises = extents.map(async (currExtent) => {
      console.log('One tile to load');

      // Fetch the image, returns an Image, which can't be stored in indexeddb as-as. Must convert it to Blob first
      const wmsResponse = await wmsLoader(currExtent.currTileExtent, currExtent.resolution, 1.0);
      // Convert to Blob. Quite a hassle. An alternative would be fetch-ing manually and just .blob() the result,
      // but that would require writing our own loader and the image.src trick used by the loader seems to circumvent
      // some cors limitation.
      const bmp = wmsResponse.image;
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      // get a bitmaprenderer context and draw the bitmap on it
      const ctx = canvas.getContext('bitmaprenderer');
      ctx.transferFromImageBitmap(bmp);
      // Get it back as a Blob
      // ImageBitmap is actually stored as some sort of compressed format, so blob is not larger than original compressed PNG.
      const blob = await new Promise((res) => { canvas.toBlob(res); });
      // Callback progress. Actually, this tile is not stored yet, but is fetched, which
      // is the most timeconsuming part. When it is stored happens in the allSettled.
      if (progressCallback) {
        progressCallback();
      }
      // TODO: adjust compression ratio based on dowloaded tiles for better progress?
      return super.storeTile(currExtent.tileCoord[0], currExtent.tileCoord[1], currExtent.tileCoord[2], blob, extentId);
    });
    // TODO: maybe do some error handling?
    // Those who work work, all others fail ...
    await Promise.allSettled(allDownloadPromises);

    // Need to refresh to show tiles
    super.refresh();
  }
}
