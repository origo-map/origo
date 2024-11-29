import ImageTileSource from 'ol/source/ImageTile';
import { toSize } from 'ol/size';
import { fromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

const databaseName = 'origoOfflineTiles';
// Remember to bump this one (integers only) when table schema changes
const databaseVersion = 2;

const tilesObjectsStoreName = 'tiles';
const extentsObjectsStoreName = 'extents';
const legendGraphicsObjectsStoreName = 'legendgraphics';

const nameCol = 'layer';
const extentCol = 'extentid';
const blobCol = 'file';
const tileZCol = 'z';
const tileXCol = 'x';
const tileYCol = 'y';

/**
   * Static private helper to init db.
   * @returns
   */
function initIndexedDb() {
  // Define the tables as objects so actual creation can be perfomred in a general
  // If anything is changed here, you must also bumb the version constant at the top of this file.
  // loop later to keep function less hard coded.
  // In this way it could be rewritten as a static helper in outer space if table definitions and database name are exposed as parameters.
  // TODO: rewrite as hardcoded to support migrations.
  const stores = [
    {
      // Store for the actual tiles
      name: tilesObjectsStoreName,
      // Set up a composite key.
      keyPath: [nameCol, tileZCol, tileXCol, tileYCol],
      autoIncrement: false,
      indices: [extentCol, nameCol]
    },
    // Store for legendgraphics
    {
      name: legendGraphicsObjectsStoreName,
      keyPath: nameCol,
      autoIncrement: false,
      indices: []
    },
    // Store downloaded extents
    {
      name: extentsObjectsStoreName,
      indices: [nameCol],
      autoIncrement: true
    }
  ];
  // This is the static general part.
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onerror = (event) => {
      reject(event.target.error);
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onupgradeneeded = (event) => {
      stores.forEach((store) => {
        const objectStore = event.target.result.createObjectStore(store.name, {
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement
        });
        if (store.indices) {
          store.indices.forEach((index) => {
            objectStore.createIndex(index, index, { unique: false });
          });
        }
      });
    };
  });
}

/**
 * Abstract class that implements an offline capable source for tiled image layers. Implement and override async preload(extent)
 */
export default class ImageTileOfflineSource extends ImageTileSource {
  #db = null;

  constructor(options, viewer) {
    super({
      // TODO: Pass on some more of the relevant options.
      tileGrid: options.tileGrid,
      gutter: 0,
      projection: options.projection,
      attributions: options.attributions
    });

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

    this.viewer.on('loaded', () => {

    });
    // Set our loader for this source
    // As no loader is set in super constructor, this source state is 'loading' until we explitily set it to 'ready',
    // which is done in init() when db has been set up
    // One could argue for that a call to setLoader should also set state to ready as other sources seem to do ...
    super.setLoader(this.myLoader);
  }

  /**
   * internal helper to calculate the tiles that will be fetched for the given extent
   * @param {any} extent Extent to calculate tiles for
   * @returns Array of objects with currTileExtent, resolution, tileCoord
   */
  calculateTiles(extent) {
    const start = this.minZoom;
    const stop = this.maxZoom;

    const extents = [];
    for (let i = start; i <= stop; i += 1) {
      this.tileGrid.forEachTileCoord(extent, i, (tileCoord) => {
        const currTileExtent = this.tileGrid.getTileCoordExtent(tileCoord);
        const resolution = this.tileGrid.getResolution(i);
        extents.push({ currTileExtent, resolution, tileCoord });
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
   * Preloads the given extent. Does not resolve until all tiles have been stored in indexddb.
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
  myLoader = async (z, x, y) => {
    // Written as arrow function to bind "this", as it is called from outer space
    const blob = await this.fetchTileFromDb(this.layerName, z, x, y);
    return createImageBitmap(blob);

    // If tile is not is in store, calling function will receive exception from fetchTileFromDb and ignores the tile
  };

  /**
   * You must call init after constructor, before this method is finished the layer is not rendered.
   * No need to actually await unless you want to handle errors.
   * */
  async init() {
    // Connect to indexdDb
    this.db = await initIndexedDb();

    // Don't load image if client side symbol
    if (!this.noRemoteStyle) {
      const imagen = await this.fetchLegendGrapicFromDb();
      // This style will leave the objectUrl lingering as we don't know when it's loaded unless we can get hands on
      // the img tag that is created and attach a load event handler. Lucky for us, it only happens once and images are small.
      // Other solutions is to rewrite the style object to accept a clean up handler or when the tag is created a removeUrl handler
      // is attached if url has objectUrl format (src="blob:....") or possibly embed the image in the src attr but that would probaby waste more memory
      if (imagen) {
        const urlen = URL.createObjectURL(imagen);
        // This requires that viewer already has added us and that legend has been created.
        // Currently it should as there is no async code in viewer init so the await above will ensure that
        // viewer init has run to completion.
        // If that changes there will be a race condition between viewer added legend and initindexdDb.
        const l = this.viewer.getLayer(this.legendLayerName);
        const style = [[{
          icon: {
            src: urlen
          }

        }]];
        // A bit complicated way of updating the legend, but it how style picker works.
        // Other solution would be doing this manually be finding the DOM element somehow and replace it.
        const styleName = `${this.layerName}__offlinestyle`;
        this.viewer.addStyle(styleName, style);
        l.set('styleName', styleName);
        l.dispatchEvent('change:style');
      }

      console.log('Laddad');
    }
    // Notify OL that we are ready to display some data
    super.setState('ready');
  }

  /**
   * Private helper to store all downloaded extents
   *
   * @param {any} extent
   * @returns Id of created database row
   */
  storeExtent(extent) {
    const newRecord = {};
    newRecord[nameCol] = this.layerName;
    newRecord[extentCol] = extent;
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(extentsObjectsStoreName, 'readwrite').objectStore(extentsObjectsStoreName);
      const req = store.put(newRecord);

      req.onsuccess = (event) => {
        console.log('extent saved');
        // Return the created key
        resolve(event.target.result);
      };
      req.onerror = (event) => {
        console.log(`Det sket sig ${event}`);
        reject(event.target.error);
      };
    });
  }

  fetchExtentsFromDb() {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(extentsObjectsStoreName, 'readonly');
        const objectStore = transaction.objectStore(extentsObjectsStoreName);

        const index = objectStore.index(nameCol);
        const getRequest = index.getAll(this.layerName);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result);
          } else {
            console.log('No saved legend grapichs');
            resolve(null);
          }
        };
        getRequest.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        console.log(error);
      }
    });
  }

  /**
   * Get all downloaded extents for this layer
   * @returns {Feature[]} Array of features representing each downloaded extent
   */
  async getExtents() {
    const extents = await this.fetchExtentsFromDb();
    return extents.map(currExtent => {
      const geom = fromExtent(currExtent[extentCol]);
      const feat = new Feature(geom);
      return feat;
    });
  }

  storeLegendGraphic(blob) {
    return new Promise((resolve, reject) => {
      const newRecord = {};
      newRecord[nameCol] = this.layerName;
      newRecord[blobCol] = blob;

      const store = this.db.transaction(legendGraphicsObjectsStoreName, 'readwrite').objectStore(legendGraphicsObjectsStoreName);
      store.put(newRecord);
      // use trabsaction callback. It determines if anything actually was saved. Request's callback has more info on each record,
      // but does not know if transaction actually was comitted
      store.transaction.oncomplete = (event) => {
        console.log('file saved');
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        console.log(`Det sket sig ${event}`);
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to store one tile. Each tile is stored in its own transaction to not block table for other layers
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
      tiledata[extentCol] = extentId;

      const store = this.db.transaction(tilesObjectsStoreName, 'readwrite').objectStore(tilesObjectsStoreName);
      // Use put to always overwrite. We don't care what's already in db
      store.put(tiledata);
      // TODO: maybe use the request's callback. This is transaction, but we use one transaction for each tile not block table for other layers
      store.transaction.oncomplete = (event) => {
        console.log('file saved');
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        console.log(`Det sket sig ${event}`);
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
   * @returns
   */

  fetchTileFromDb(layer, z, x, y) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(tilesObjectsStoreName, 'readonly');
        const objectStore = transaction.objectStore(tilesObjectsStoreName);

        // Table uses composite key. Must get using values in the same order as keyPath
        const getRequest = objectStore.get([layer, z, x, y]);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result.file);
          } else {
            const e = new Error('Hittades inte');
            reject(e);
          }
        };
        getRequest.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        console.log(error);
      }
    });
  }

  fetchLegendGrapicFromDb() {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(legendGraphicsObjectsStoreName, 'readonly');
        const objectStore = transaction.objectStore(legendGraphicsObjectsStoreName);

        const getRequest = objectStore.get(this.layerName);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result[blobCol]);
          } else {
            console.log('No saved legend grapichs');
            resolve(null);
          }
        };
        getRequest.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        console.log(error);
      }
    });
  }

  /**
   * Clears the storage used by this layer
   */
  clearStorage() {
    // Can't call it clear, baseclass has a clear
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(tilesObjectsStoreName, 'readwrite');
        const objectStore = transaction.objectStore(tilesObjectsStoreName);

        const index = objectStore.index(nameCol);
        const getRequest = index.getAll(this.layerName);
        // TODO: clear all extents
        // TODO: clear legend graphics
        transaction.oncomplete = () => {
          this.refresh();
          console.log('All items deleted');
          resolve(true);
        };
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            getRequest.result.forEach(currRow => {
              const delreq = objectStore.delete([currRow[nameCol], currRow[tileZCol], currRow[tileXCol], currRow[tileYCol]]);
              delreq.onsuccess = () => {
                console.log('Deleted');
              };
            });
          } else {
            const e = new Error('Hittades inte');
            reject(e);
          }
        };
        getRequest.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        console.log(error);
      }
    });
  }
}
