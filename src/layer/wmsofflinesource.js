import ImageTileSource from 'ol/source/ImageTile';
import { createLoader } from 'ol/source/wms';

const databaseName = 'origoOffline';
const databaseVersion = 1;

const tilesObjectsStoreName = 'tiles';
const extentsObjectsStoreName = 'extents';

const nameCol = "layer";
const extentCol = "extentid";
const blobCol = "file";
const tileZCol = "z";
const tileXCol = "x";
const tileYCol = "y";

/**
 * Skall man g�ra en abstrakt basklass ovanf�r denna: ImageTileOfflineSource d�r man l�gger i princip allt utom
 * preload-url-skaparfunktionen? D� skulle man l�tt kunna g�ra nya offlinesources. Troligtvis ingen id� att blanda Vector och tile
 * d� de kommer att funka olika och multipelt arv inte finns i javascript.
 */

export default class WmsOfflineSource extends ImageTileSource {
  /**
   * Creates a new instance of WfsSource. Remeber to call Init afterwards to set up async stuff.
   * @param {any} options The options to use.
   */
  constructor(options) {
    super({
      // TODO: skicka vidare relevanta properties, t.ex grid.
      tileGrid: options.tileGrid,
      gutter: 0
    }

      


    );

    // TODO: ta hand om "v�ra" options, t.ex lagernamn
    /** Estimated compression factor. Can be overridden by option */
    this.compressionFactor = 0.1; 
    this.maxZoom = options.offlineMaxZoom || options.tileGrid.getMaxZoom() ;
    this.minZoom = options.offlineMinZoom || options.tileGrid.getMinZoom()
    /**
     *  The name used to identify this layer in indexdDb. If same name is used between applications, offline
     * store can be shared
     */
    this.layerName = options.offlineStoreName;


    // Har man ingen loader i konstruktorn s�tter den state='loading' och lagret ignoreras
    // vi nyttjar det till att initialisera indexdb asynkront innan vi s�tter state till 
    // Set our loader for this source
    super.setLoader(this._myLoader);
    
    
    this.dbVersion = 1;
    this.db = null;
    this.grid = options.tileGrid;


    // TODO: Loadern b�r brytas ut till en specialiserad WmsTilEoffline-klass, det �r egentligen bara den som skiljer mellan
    // vilken Tile-tj�snt som helst
    // TODO: se �ver vilka parametrar som faktiskt skall skickas med till loadern

    // Create a function to fetch WMS tiles. Not to be confused with the ImageTile class loader.
    // Use the helper from OL to query WMS server. It can be done manully, but someone has already provided it for us.
    this.WmsLoader = createLoader({ ratio: 1, url: options.url, params: options.params, crossOrigin:options.crossOrigin  });

  }


  // TODO: Hur hanterar vi detta? Skall vi h�mta den? Skall den cachas? Skall vi ignorera den?
  // Den b�r h�mtas och cachas, men hur hanterar man 
  getLegendUrl() {
    return false;
  }

  calculateTiles(extent) {
    const start = this.minZoom;
    const stop = this.maxZoom;

    const extents = [];
    for (let i = start; i <= stop; i++) {
      this.tileGrid.forEachTileCoord(extent, i, (tileCoord) => {
        const currTileExtent = this.tileGrid.getTileCoordExtent(tileCoord);
        const resolution = this.tileGrid.getResolution(i);
        extents.push({ currTileExtent, resolution, tileCoord });
      });
    }
    return extents;
  }

  /**
   * Calculates how many tiles that needs to be downloaded for the given extent.
   * @param {any} extent Extent in map's coordinate system
   * @return {object} Object with numberOfTiles and estimateBytes
   */
  calculateEstimateForExtent(extent) {
    const numberOfTiles = this.calculateTiles(extent).length;
    const estimateBytes = numberOfTiles * this.tileGrid.getTileSize()[0] * this.tileGrid.getTileSize()[1] * this.compressionFactor;
      return { numberOfTiles, estimateBytes };
  }

  /**
   * Preloads the given extent. Does not resolve until all tiles have been stored in indexddb.
   * @param {any} extent
   * 
   */
  async preload(extent) {
    // TODO: Spara extent per lager kanske inte �r s� smart. Skall man ta in id fr�n toolet som d� ansvarar f�r att
    // skapa sin egen tabell? Skall man ha extent per lager m�ste man d� ha ett index s� att vi vet vilka som �r "v�ra" extent
    //const extentId = await this.storeExtent(extent);
    const extentId = 1;
    const extents = this.calculateTiles(extent);
    const allDownloadPromises = extents.map(async (currExtent) => {
      // Fetch the image, returns an Image, which can't be stored in indexeddb as-as. Must convert it to Blob first
      const req = await this.WmsLoader(currExtent.currTileExtent, currExtent.resolution, 1.0);
      // Convert to Blob. Quite a hassle. An alternative would be fetching manually and just .blob() the result,
      // but that would require writing our own loader and the image.src trick used by the loader seems to circumvent
      // some coors limitation.
      const bmp = req.image;
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      // get a bitmaprenderer context and draw the bitmap on it
      const ctx = canvas.getContext('bitmaprenderer');
      ctx.transferFromImageBitmap(bmp);
      // Get it back as a Blob
      // ImageBitmap is actually stored as some sort of compressed format, so blob is not larger than original compressed PNG.
      const blob = await new Promise((res) => canvas.toBlob(res));
      // TODO: adjust compression ratio based on dowloaded tiles

      return this.storeTile(this.layerName, currExtent.tileCoord[0], currExtent.tileCoord[1], currExtent.tileCoord[2], blob, extentId);
    });
    await Promise.all(allDownloadPromises);
    console.log('Vad fick jag?');

    // Need to refresh to show tiles
    super.refresh();
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
    const blob = await this.fetchTileFromDb(this.layerName, z,x,y);
    return createImageBitmap(blob)

    // If tile is not is in store, calling function will receive exception from fetchTileFromDb and ignores the tile
  }

  /** 
   * You must call init after constructor, before this method is finished the layer is not rendered.
   * No need to actually await unless you want to handle errors.
   * */
  async init() {
    // Connect to indexdDb
    this.db = await this.initIndexedDb();
    
    // Notify OL that we are ready to display some data
    super.setState('ready');
  }

  /**
   * Private helper to init db.
   * TODO: could be rewritten as a static helper in outer space if table definitions and database name is exposed as parameters.
   * TODO: Kanske skall ligga p� tool-niv�, vi kan inte k�nna till andra lagertypers tabeller, eller s� f�r man ha en databas per lagertyp
   * @returns
   */
  initIndexedDb() {
    const stores = [
      {
        name: tilesObjectsStoreName,
        // Set up a composite key.
        keyPath: [nameCol, tileZCol, tileXCol, tileYCol],
        autoIncrement: false,
        indices: [extentCol, nameCol]
      }
      // TODO: Lagra extents per lager kanske inte �r s� smart. I s�dana fall beh�vs ocks� ett index f�r lager p� extentet
      //,
      //{
      //  name: extentsObjectsStoreName,
      //  autoIncrement: true
      //}
    ];
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
            })
          }
        });
      };
    });
  }

  /**
   * Private helper to stora all downloaded extents
   * 
   * @param {any} extent
   * @returns Id of created database row
   */
  storeExtent(extent) {
    return new Promise((resolve, reject) => {

      const store = this.db.transaction(extentsObjectsStoreName, 'readwrite').objectStore(extentsObjectsStoreName);
      const req = store.put(extent);

      req.onsuccess = (event) => {
        console.log('extent saved');
        // Return the created key
        resolve(event.target.result);
      };
      req.onerror = (event) => {
        console.log('Det sket sig ' + event);
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
  storeTile(layer, z,x,y, file, extentId) {
    return new Promise((resolve, reject) => {
     
      const tiledata = {};
      tiledata[nameCol] = layer;
      tiledata[tileZCol] = z;
      tiledata[tileXCol] = x;
      tiledata[tileYCol] = y;
      tiledata[blobCol] = file;
      tiledata[extentCol] = extentId;

      const store = this.db.transaction(tilesObjectsStoreName, 'readwrite').objectStore(tilesObjectsStoreName);
      store.put(tiledata);
      // TODO: maybe use the request's callback. This is transaction, but we use one transaction for each tile not block table for other layers
      store.transaction.oncomplete = (event) => {
        console.log('file saved');
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        console.log('Det sket sig ' + event);
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

  fetchTileFromDb (layer, z, x, y) {
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
        }
      } catch (error) {
        console.log(error);
      }
    });
  };

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
        transaction.oncomplete = (event) => {
          this.refresh();
          console.log('All items deleted');
          resolve(true);
        }
        getRequest.onsuccess = (event) => {
          if (getRequest.result) {
            getRequest.result.forEach(currRow => {
              const delreq = objectStore.delete([currRow[nameCol], currRow[tileZCol], currRow[tileXCol], currRow[tileYCol]]);
              delreq.onsuccess = (event) => {
                console.log('Deleted');
              }
            });
          } else {
            const e = new Error('Hittades inte');
            reject(e);
          }
        };
        getRequest.onerror = (event) => {
          reject(event.target.error);
        }
      } catch (error) {
        console.log(error);
      }
    });
   
  }

}