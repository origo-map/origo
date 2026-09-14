// We use underscore to denote private class methods. JS has no good support for that.
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
import ImageTileSource from 'ol/source/ImageTile';
import { toSize } from 'ol/size';
import { fromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import createObjectStores from '../utils/createobjectstores';

const databaseName = 'origoOfflineTiles';
// Remember to bump this one (integers only) when table schema changes
const databaseVersion = 5;

const tilesObjectsStoreName = 'tiles';
const extentsObjectsStoreName = 'extents';
const legendGraphicsObjectsStoreName = 'legendgraphics';

const nameCol = 'layer';
const extentIdCol = 'extentid';
const extentCol = 'extent';
const blobCol = 'file';
const tileZCol = 'z';
const tileXCol = 'x';
const tileYCol = 'y';

/**
   * Static private helper to init db.
   * @returns {Promise<any>} A promise that resolves when init is done.
   */
function initIndexedDb() {
  // Define the tables as objects so actual creation can be performed in a general function
  // If anything is changed here, you must also bump the version constant at the top of this file.
  const stores = [
    {
      // Store for the actual tiles
      name: tilesObjectsStoreName,
      // Set up a composite key.
      keyPath: [nameCol, tileZCol, tileXCol, tileYCol],
      autoIncrement: false,
      indices: [extentIdCol, nameCol]
    },
    // Store for legendgraphics
    {
      name: legendGraphicsObjectsStoreName,
      keyPath: nameCol,
      autoIncrement: false,
      indices: []
    },
    // Store for downloaded extents
    {
      name: extentsObjectsStoreName,
      indices: [nameCol],
      keyPath: 'rid',
      autoIncrement: true
    }
  ];
  return createObjectStores(databaseName, databaseVersion, stores);
}

/**
 * Abstract class that implements an offline capable source for tiled image layers. Implement and override async preload(extent) to
 * support any image source.
 */
export default class ImageTileOfflineSource extends ImageTileSource {
  /**
   * Private pointer to db
   */
  #db = null;

  constructor(options, viewer) {
    super({
      tileGrid: options.tileGrid,
      gutter: 0,
      projection: options.projection,
      attributions: options.attributions
    });

    // Make sure this class is never instantiated
    if (this.constructor === ImageTileOfflineSource) {
      throw new Error("Class is of abstract type and can't be instantiated");
    }
    /** Estimated compression factor. Can be overridden by option */
    this.compressionFactor = options.compressionFactor || 0.1;
    this.maxZoom = options.offlineMaxZoom || options.tileGrid.getMaxZoom();
    this.minZoom = options.offlineMinZoom || options.tileGrid.getMinZoom();
    /**
     *  The name used to identify this layer in indexdDb. If same name is used between applications, offline
     *  store can be shared
     */
    this.layerName = options.offlineStoreName;
    this.viewer = viewer;
    this.legendLayerName = options.name;
    this.noRemoteStyle = options.noRemoteStyle;
    this.extendedLegend = options.hasThemeLegend;

    // Set our loader for this source
    // As no loader is set in super constructor, this source state is 'loading' until we explitily set it to 'ready',
    // which is done in init() when db has been set up
    // One could argue for that a call to setLoader should also set state to ready as other sources seem to do ...
    super.setLoader(this._myLoader);
  }

  /**
   * Calculates the tiles that will be fetched for the given extent
   * @param {any} extent Extent to calculate tiles for
   * @returns Array of objects with extent, resolution, tileCoord
   */
  calculateTiles(extent) {
    const start = this.minZoom;
    const stop = this.maxZoom;

    const extents = [];
    for (let i = start; i <= stop; i += 1) {
      this.tileGrid.forEachTileCoord(extent, i, (tileCoord) => {
        const currTileExtent = this.tileGrid.getTileCoordExtent(tileCoord);
        const resolution = this.tileGrid.getResolution(i);
        extents.push({ extent: currTileExtent, resolution, tileCoord });
      });
    }
    return extents;
  }

  /**
   * Calculates how many tiles and and estimate of bytes that needs to be downloaded for the given extent.
   * @param {any} extent Extent in map's coordinate system
   * @return {object} Object with numberOfTiles and estimateBytes
   */
  calculateEstimateForExtent(extent) {
    const numberOfTiles = this.calculateTiles(extent).length;
    const tileSize = toSize(this.tileGrid.getTileSize());
    const estimateBytes = numberOfTiles * tileSize[0] * tileSize[1] * this.compressionFactor;
    return { numberOfTiles, estimateBytes };
  }

  /**
   * Preloads the given extent. Must not resolve until all tiles have been stored in indexddb.
   * Override this method in your specialized class
   * @param {any} extent
   *
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  async preload(extent, progressCallback) {
    throw new Error('async preload(extent) must be overridden');
  }

  /**
   * Private helper that implements the ImageTile loader interface. Called by ImageTile base class
   * @param {any} z
   * @param {any} x
   * @param {any} y
   * @returns
   */
  _myLoader = async (z, x, y) => {
    // Written as arrow function to bind "this", as it is called from outer space
    const blob = await this._fetchTileFromDb(this.layerName, z, x, y);
    return createImageBitmap(blob);

    // If tile is not is in store, calling function will receive exception from fetchTileFromDb and ignores the tile
  };

  /**
   * Updates the legend graphic when a symbol has been preloaded into db
   */
  async _updateLegend() {
    const theImage = await this._fetchLegendGrapicFromDb();
    // This style will leave the objectUrl lingering as we don't know when it's loaded unless we can get hands on
    // the img tag that is created and attach a load event handler. Lucky for us, it only happens once and images are small.
    // Other solutions is to rewrite the style object to accept a clean up handler or when the tag is created a removeUrl handler
    // is attached if url has objectUrl format (src="blob:....") or possibly embed the image in the src attr but that would probaby waste more memory
    if (theImage) {
      const urlen = URL.createObjectURL(theImage);
      // This requires that viewer already has added us and that legend has been created.
      // Currently it should as there is no async code in viewer init so the await above will ensure that
      // viewer init has run to completion.
      // If that changes there will be a race condition between viewer added legend and initindexdDb.
      const l = this.viewer.getLayer(this.legendLayerName);
      const style = [[{
        icon: {
          src: urlen
        },
        extendedLegend: this.extendedLegend
      }]];
      // A bit complicated way of updating the legend, but it how style picker works.
      // Other solution would be doing this manually be finding the DOM element somehow and replace it.
      const styleName = `${this.layerName}__offlinestyle`;
      this.viewer.addStyle(styleName, style);
      l.set('styleName', styleName);
      l.dispatchEvent('change:style');
    }
  }

  /**
   * Sets the legendgraphics persitantly
   * @param {any} legendImg
   */
  async setLegendGraphics(legendImg) {
    await this._storeLegendGraphic(legendImg);
    await this._updateLegend();
  }

  /**
   * You must call init after constructor, before this method is finished the layer is not rendered.
   * No need to actually await unless you want to handle errors.
   * */
  async init() {
    // Connect to indexdDb
    this.#db = await initIndexedDb();

    // Don't load image if client side symbol
    if (!this.noRemoteStyle) {
      await this._updateLegend();
    }

    // Notify OL that we are ready to display some data
    super.setState('ready');
  }

  /**
   * Stores one extent
   *
   * @param {any} extent
   * @returns Id of created database row
   */
  storeExtent(extent) {
    const newRecord = {};
    newRecord[nameCol] = this.layerName;
    newRecord[extentCol] = extent;
    return new Promise((resolve, reject) => {
      const store = this.#db.transaction(extentsObjectsStoreName, 'readwrite').objectStore(extentsObjectsStoreName);
      const req = store.put(newRecord);

      req.onsuccess = (event) => {
        // Return the created key
        resolve(event.target.result);
      };
      req.onerror = (event) => {
        // Turn into Error
        reject(event.target.error);
      };
    });
  }

  /**
   * private helper to fetch all preloaded extents
   * @returns
   */
  _fetchExtentsFromDb() {
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(extentsObjectsStoreName, 'readonly');
      const objectStore = transaction.objectStore(extentsObjectsStoreName);

      const index = objectStore.index(nameCol);
      const getRequest = index.getAll(this.layerName);
      getRequest.onsuccess = () => {
        resolve(getRequest.result);
      };
      getRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Get all downloaded extents for this layer
   * @returns {Feature[]} Array of features representing each downloaded extent
   */
  async getExtents() {
    const extents = await this._fetchExtentsFromDb();
    return extents.map(currExtent => {
      const geom = fromExtent(currExtent[extentCol]);
      const feat = new Feature(geom);
      return feat;
    });
  }

  /**
   * Stores a legend grapichs for this source in db.
   * @param {any} blob
   * @returns
   */
  _storeLegendGraphic(blob) {
    return new Promise((resolve, reject) => {
      const newRecord = {};
      newRecord[nameCol] = this.layerName;
      newRecord[blobCol] = blob;

      const store = this.#db.transaction(legendGraphicsObjectsStoreName, 'readwrite').objectStore(legendGraphicsObjectsStoreName);
      store.put(newRecord);
      // use transaction callback. It determines if anything actually was saved. Request's callback has more info on each record,
      // but does not know if transaction actually was comitted
      store.transaction.oncomplete = (event) => {
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Stores one tile. Each tile is stored in its own transaction to not block table for other layers
   * (all layers are stored in the same table)
   * @param {any} layer
   * @param {any} z
   * @param {any} x
   * @param {any} y
   * @param {any} file
   * @param {any} extentId
   * @returns
   */
  storeTile(z, x, y, file, extentId) {
    return new Promise((resolve, reject) => {
      const tiledata = {};
      tiledata[nameCol] = this.layerName;
      tiledata[tileZCol] = z;
      tiledata[tileXCol] = x;
      tiledata[tileYCol] = y;
      tiledata[blobCol] = file;
      tiledata[extentIdCol] = extentId;

      const store = this.#db.transaction(tilesObjectsStoreName, 'readwrite').objectStore(tilesObjectsStoreName);
      // Use put to always overwrite. We don't care what's already in db
      store.put(tiledata);
      store.transaction.oncomplete = (event) => {
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to fetch one tile
   * @param {any} layer
   * @param {any} z
   * @param {any} x
   * @param {any} y
   * @returns {Promise<any>} When resolved returns the tile data
   */

  _fetchTileFromDb(layer, z, x, y) {
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(tilesObjectsStoreName, 'readonly');
      const objectStore = transaction.objectStore(tilesObjectsStoreName);

      // Table uses composite key. Must get using values in the same order as keyPath
      const getRequest = objectStore.get([layer, z, x, y]);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result.file);
        } else {
          // Signal to OL that tile is missing so it can be ignored instead of blocking other tiles
          const e = new Error('Tile not in store');
          reject(e);
        }
      };
      getRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to fetch a legend grapics from db
   * @returns
   */
  _fetchLegendGrapicFromDb() {
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(legendGraphicsObjectsStoreName, 'readonly');
      const objectStore = transaction.objectStore(legendGraphicsObjectsStoreName);

      const getRequest = objectStore.get(this.layerName);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result[blobCol]);
        } else {
          // No graphic in db. This is not really an error. It is probably due to configuration changes.
          resolve(null);
        }
      };
      getRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Clears the storage used by this layer
   */
  clearStorage() {
    // Can't call it clear, baseclass has a clear
    return new Promise((resolve, reject) => {
      // Legend graphics are not cleared as they are overwritten, so we can leave them to have a nice legend ready for next preload.
      const transaction = this.#db.transaction([tilesObjectsStoreName, extentsObjectsStoreName], 'readwrite');
      const objectStore = transaction.objectStore(tilesObjectsStoreName);
      const extentsStore = transaction.objectStore(extentsObjectsStoreName);

      // indexeddb can't delete by index. We have to get by index and loop all items and delete
      const index = objectStore.index(nameCol);
      const getRequest = index.getAll(this.layerName);

      // indexeddb can't delete by index. We have to get by index and loop all items and delete
      const extentsIndex = extentsStore.index(nameCol);
      const getExtentsReq = extentsIndex.getAll(this.layerName);

      // When transaction completes (all gets and deletes are done) we are done and can resolve
      transaction.oncomplete = () => {
        this.refresh();
        resolve(true);
      };
      getRequest.onsuccess = () => {
        // Only delete if there are something to delete
        if (getRequest.result) {
          getRequest.result.forEach(currRow => {
            // Delete deletes by key.
            // Don't really care if this actually deletes the row so no need to set up handlers.
            objectStore.delete([currRow[nameCol], currRow[tileZCol], currRow[tileXCol], currRow[tileYCol]]);
          });
        }
      };
      getRequest.onerror = (event) => {
        reject(event.target.error);
      };
      getExtentsReq.onsuccess = () => {
        // Only delete if there are something to delete
        if (getExtentsReq.result) {
          getExtentsReq.result.forEach(currRow => {
            // Delete deletes by key.
            // Don't really care if this actually deletes the row so no need to set up handlers
            extentsStore.delete(currRow.rid);
          });
        }
      };
      getExtentsReq.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}
