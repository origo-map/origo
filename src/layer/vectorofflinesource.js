import VectorSource from 'ol/source/Vector';
import * as LoadingStrategy from 'ol/loadingstrategy';
import { toSize } from 'ol/size';
import { fromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import GeoJson from 'ol/format/GeoJSON'
import dispatcher from '../controls/editor/editdispatcher';

const databaseName = 'origoOfflineFeatures';
// Remember to bump this one (integers only) when table schema changes
const databaseVersion = 1;

const featuresObjectsStoreName = 'features';
const extentsObjectsStoreName = 'extents';
const editsObjectsStoreName = 'edits';
// TODO: add edits

const nameCol = 'layer';
const extentCol = 'extentid';
const geoJsonCol = 'json';
const fidCol = 'fid';

const geomName = 'geom';

/**
   * Static private helper to init db.
   * @returns
   */
function initIndexedDb() {
  // Define the tables as objects so actual creation can be perfomred in a general
  // loop later to keep function less hard coded.
  // If anything is changed here, you must also bumb the version constant at the top of this file.
  // In this way it could be rewritten as a static helper in outer space if table definitions and database name are exposed as parameters.
  const stores = [
    {
      // Store for the actual features
      name: featuresObjectsStoreName,
      keyPath: [nameCol, fidCol],
      autoIncrement: false,
      indices: [extentCol, nameCol]
    },
    {
      // Store for unsynced edits
      name: editsObjectsStoreName,
      keyPath: [nameCol, fidCol],
      autoIncrement: false,
      indices: [nameCol]
    },
    // Store downloaded extents
    {
      name: extentsObjectsStoreName,
      indices: [nameCol],
      keyPath: 'rid',
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
      const db = event.target.result;

      // Do an evil db update: always remove and rebuild, will destroy data but we don't
      // have to bother with possible migrations
      while (db.objectStoreNames.length > 0) {
        db.deleteObjectStore(db.objectStoreNames[0]);
      }
      stores.forEach((store) => {
        const objectStore = db.createObjectStore(store.name, {
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
 * Abstract class that implements an offline capable source for vector layers. Implement and override async preload(extent)
 */
export default class VectorOfflineSource extends VectorSource {
  #db = null;

  constructor(options, viewer) {
    super({
      strategy: LoadingStrategy.all,
      attributions: options.attributions,
    });

    if (this.constructor === VectorOfflineSource) {
      throw new Error("Class is of abstract type and can't be instantiated");
    }
   
    /**
     *  The name used to identify this layer in indexdDb. If same name is used between applications, offline
     *  store can be shared
     */
    this.layerName = options.offlineStoreName;
    this.legendLayerName = options.name;
    this.viewer = viewer;
    //this.state = 'loading';
    super.setLoader(this.myLoader);
    super.setState('loading');
  }

  /**
 * You must call init after constructor, before this method is finished the layer is not rendered.
 * No need to actually await unless you want to handle errors.
 * */
  async init() {
    // Connect to indexdDb
    this.db = await initIndexedDb();

    console.log('Laddad');
    // Notify OL that we are ready to display some data
    super.setState('ready');
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

  myLoader(extent, resolution, projection, success, failure) {
    this._loaderHelper(extent)
      .then(f => {
        super.addFeatures(f);
        success(f);
      })
      .catch(() => failure());
  }

  async _loaderHelper(extent) {
    console.log('Loader called');
    const geoJsonFormatter = new GeoJson({
     // geometryName: geomName
    });
    const dbRes = await this.fetchLayerFromDb();
    const res = [];
    dbRes.forEach(currFeature => {
      // TODO: set geom name to configname?
      const newFeature = geoJsonFormatter.readFeature(currFeature.json);
      // This will loop twice, but it prevents sending an event for each feature
      res.push(newFeature);
    });
    return res;
  }

 

  /**
   * Private helper to store all downloaded extents. Should be protected if javascript supported that.
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
            console.log('No extents in db');
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

  /**
   * Private (protected) helper to store a set of features. 
   * (all layers are stored in the same table)
   * @param {Feature[]} features
   * @param {any} extentId
   * @returns {Promise}
   */
  storeFeatures(features, extentId) {
    return new Promise((resolve, reject) => {
      const geojsonFormat = new GeoJson();
      
      const store = this.db.transaction(featuresObjectsStoreName, 'readwrite').objectStore(featuresObjectsStoreName);
      // Use put to always overwrite. We don't care what's already in db
      // Loop to store each feature individually but in same transaction
      features.forEach(currFeature => {
        const currJsonFeature = geojsonFormat.writeFeature(currFeature);
        const newRecord = {};
        newRecord[nameCol] = this.layerName;
        newRecord[fidCol] = currFeature.getId();
        newRecord[geoJsonCol] = currJsonFeature;
        store.put(newRecord);
      });
      store.transaction.oncomplete = (event) => {
        console.log('features saved');
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        console.log(`Det sket sig ${event}`);
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to fetch a layer
   * TODO: Could be parameterized and reconciled with fetchExtent
   * @param {any} layer
   * @param {any} z
   * @param {any} x
   * @param {any} y
   * @returns
   */

  fetchLayerFromDb() {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(featuresObjectsStoreName, 'readonly');
        const objectStore = transaction.objectStore(featuresObjectsStoreName);

        const index = objectStore.index(nameCol);
        const getRequest = index.getAll(this.layerName);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            resolve(getRequest.result);
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

  /**
   * Clears the storage used by this layer
   */
  clearStorage() {
    // Can't call it clear, baseclass has a clear
    return new Promise((resolve, reject) => {
      try {
        // TODO: remove edits
        const transaction = this.db.transaction([featuresObjectsStoreName, extentsObjectsStoreName], 'readwrite');
        const objectStore = transaction.objectStore(featuresObjectsStoreName);
        const extentsStore = transaction.objectStore(extentsObjectsStoreName);

        const index = objectStore.index(nameCol);
        const getRequest = index.getAll(this.layerName);

        const extentsIndex = extentsStore.index(nameCol);
        const getExtentsReq = extentsIndex.getAll(this.layerName);
        transaction.oncomplete = () => {
          this.refresh();
          console.log('All items deleted');
          resolve(true);
        };
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            getRequest.result.forEach(currRow => {
              // TODO: use correct composite key
              const delreq = objectStore.delete([currRow[nameCol], currRow[tileZCol], currRow[tileXCol], currRow[tileYCol]]);
              delreq.onsuccess = () => {
                console.log('Deleted tile');
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
        getExtentsReq.onsuccess = () => {
          if (getExtentsReq.result) {
            getExtentsReq.result.forEach(currRow => {
              const delreq = extentsStore.delete(currRow.rid);
              delreq.onsuccess = () => {
                console.log('Deleted extent');
              };
            });
          } else {
            const e = new Error('Hittades inte');
            reject(e);
          }
        };
        getExtentsReq.onerror = (event) => {
          reject(event.target.error);
        };
      } catch (error) {
        console.log(error);
      }
    });
  }

  storeEdits(edits) {
    return new Promise((resolve, reject) => {
      const geojsonFormat = new GeoJson();

      const transaction = this.db.transaction([featuresObjectsStoreName, editsObjectsStoreName], 'readwrite');
      const featuresStore = transaction.objectStore(featuresObjectsStoreName);
      const editsStore = transaction.objectStore(editsObjectsStoreName);
      // Use put to always overwrite. We don't care what's already in db
      // Loop to store each feature individually but in same transaction
      edits.forEach(currEdit => {
        const currFeature = currEdit.feature;
        const currFid = currFeature.getId();

          // To be fair, ins does not need to know if there is a previous edit as there can't be one,
          // but the implementation is almost the same as update
          const oldEditReq = editsStore.get([this.layerName, currFid]);
        oldEditReq.onsuccess = () => {
          const oldEdit = oldEditReq.result;
          if (currEdit.type === 'ins' || currEdit.type === 'upd') {

            // TODO: break out to common func as storeFeatures does the same
            const currJsonFeature = geojsonFormat.writeFeature(currFeature);
            const newRecord = {};
            newRecord[nameCol] = this.layerName;
            newRecord[fidCol] = currFid;
            newRecord[geoJsonCol] = currJsonFeature;
            featuresStore.put(newRecord);

            // Don't overwrite an insert with an update. The feature must be created at server if it is both inserted and edited
            // This can occur if there are multiple offline saves between sync. Normally the editstore prevents several edits for a feature
            // but the editstore can't keep track of already saved edits
            if (!(currEdit.type === 'upd' && oldEdit)) {
              const newEdit = {};
              newEdit[nameCol] = this.layerName;
              newEdit[fidCol] = currFid;
              newEdit.type = currEdit.type;
              editsStore.put(newEdit);
            }

          }
          else {
            // If there was an insert no entry at all should be written! From the server's view, the feature has never existed
            if (oldEdit && oldEdit.type === 'ins') {
              editsStore.delete([this.layerName, currFid]);
            } else {
              // Don't care what was there before. Overwrite or create new
              const newEdit = {};
              newEdit[nameCol] = this.layerName;
              newEdit[fidCol] = currFid;
              newEdit.type = currEdit.type;
              editsStore.put(newEdit);
            }

            // And remove it from localdb
            // No need to wait
            featuresStore.delete([this.layerName, currFid]);
          }
        }
        // So it must be 'del'

      });
        
      transaction.oncomplete = (event) => {
        console.log('Edits saved');
        resolve(event.target.result);
      };
      transaction.onerror = (event) => {
        console.log(`Det sket sig ${event}`);
        reject(event.target.error);
      };
    });
  }
  /**
   * 
   * @param {any} transaction The transaction ca consist of several edits
   */
  async persistEdits(transaction) {
    const edits = [];
    if (transaction.insert) {
      transaction.insert.forEach(currFeature => {
        const newEdit = {
          feature: currFeature,
          type: 'ins'
        };
        edits.push(newEdit);
      });
    }

    if (transaction.update) {
      transaction.update.forEach(currFeature => {
        const newEdit = {
          feature: currFeature,
          type: 'upd'
        };
        edits.push(newEdit);
      });
    }

    if (transaction.delete) {
      transaction.delete.forEach(currFeature => {
        const newEdit = {
          feature: currFeature,
          type: 'del'
        };
        edits.push(newEdit);
      });
    }
    await this.storeEdits(edits);
    // Dispatch events so editStore can remove edits and signal toolbar that it can grey out the save button
    // Feels kinda awkward way to do it. Edit handler could just await the call, but that's how was done before in wfstransaction
    if (transaction.update) {
      dispatcher.emitChangeFeature({
        feature: transaction.update,
        layerName: this.legendLayerName,
        status: 'finished',
        action: 'update'
      });
    }

    if (transaction.delete) {
      dispatcher.emitChangeFeature({
        feature: transaction.delete,
        layerName: this.legendLayerName,
        status: 'finished',
        action: 'delete'
      });
    }

    if (transaction.insert) {
      dispatcher.emitChangeFeature({
        feature: transaction.insert,
        layerName: this.legendLayerName,
        status: 'finished',
        action: 'insert'
      });
    }
  }
  // TODO: declare as abstract, impl must be in wfsofflinesource with possibly a litte help from us
  async syncEdits() {
   
  }
}
