// We use underscore to denote private class methods. JS has no good support for that.
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
import VectorSource from 'ol/source/Vector';
import * as LoadingStrategy from 'ol/loadingstrategy';
import { fromExtent } from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import GeoJson from 'ol/format/GeoJSON';
import dispatcher from '../controls/editor/editdispatcher';
import createObjectStores from '../utils/createobjectstores';

const databaseName = 'origoOfflineFeatures';
// Remember to bump this one (integers only) when table schema changes
const databaseVersion = 2;

const featuresObjectsStoreName = 'features';
const extentsObjectsStoreName = 'extents';
const editsObjectsStoreName = 'edits';

const nameCol = 'layer';
const extentIdCol = 'extentid';
const extentCol = 'extent';
const geoJsonCol = 'json';
const fidCol = 'fid';

/**
   * Static private (by non exporting) helper to init db.
   * @returns {Promise<any>} A promise that resolves to a database instance when init is done.
   */
function initIndexedDb() {
  // Define the tables as objects
  // If anything is changed here, you must also bumb the version constant at the top of this file.
  const stores = [
    {
      // Store for the actual features
      name: featuresObjectsStoreName,
      keyPath: [nameCol, fidCol],
      autoIncrement: false,
      indices: [extentIdCol, nameCol]
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
  return createObjectStores(databaseName, databaseVersion, stores);
}

/**
 * Abstract class that implements an offline capable source for vector layers. Implement and override async preload(extent)
 * If layer is editable syncEdits() must also be overridden.
 *
 * After construct is called riemeber to call async init() to set up async stuff.
 */
export default class VectorOfflineSource extends VectorSource {
  /** Private database object */
  #db = null;

  // Must stuff happens in VectorSource
  constructor(options, viewer) {
    super({
      strategy: LoadingStrategy.all,
      attributions: options.attributions
    });

    // Avoid instantiation of this class
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
    super.setLoader(this._myLoader);
    // Prevent Ol from displaying this layer until we are ready.
    super.setState('loading');
  }

  /**
   * You must call init after constructor, before this method is finished the layer is not rendered.
   * No need to actually await unless you want to handle errors.
   * */
  async init() {
    // Connect to indexdDb
    this.#db = await initIndexedDb();

    // Notify OL that we are ready to display some data
    super.setState('ready');
  }

  /**
   * Preloads the given extent. Must be overridden.
   * Must not resolve until all features have been stored in indexddb. If layer is configured with offlineUseLayerExtent
   * the extent parameter should be ignored
   * @param {any} extent
   *
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  async preload(extent, progressCallback) {
    throw new Error('async preload(extent) must be overridden');
  }

  /**
   * The loader that OL calls to populate this source. Is only called when state is set to 'ready' and on refresh as
   * strategy all is hardcoded.
   * @param {any} extent The extent to load (ignored)
   * @param {any} resolution The resolution (igored)
   * @param {any} projection The projection to fetch for (ignored as we has viewer's projection)
   * @param {any} success Callback when done
   * @param {any} failure Callback for failure
   */
  _myLoader(extent, resolution, projection, success, failure) {
    this._fetchFeaturesFromDb()
      .then(f => {
        super.addFeatures(f);
        success(f);
      })
      .catch(() => failure());
  }

  /**
   * Private helper that reads all features from localdb
   * @returns All features read
   */
  async _fetchFeaturesFromDb() {
    const geoJsonFormatter = new GeoJson({
      geometryName: this.viewer.getLayer(this.legendLayerName).get('geometryName')
    });
    const dbRes = await this._fetchAllFeaturesFromDb();
    // Add each feature to an array before adding the entire array to source to avoid getting an add event for each feature
    const res = [];
    dbRes.forEach(currFeature => {
      const newFeature = geoJsonFormatter.readFeature(currFeature.json);
      res.push(newFeature);
    });
    return res;
  }

  /**
   * Private helper to store all downloaded extents.
   *
   * @param {any} extent
   * @returns {Promise<number>} Promise with Id of created database row
   */
  _storeExtent(extent) {
    const newRecord = {};
    newRecord[nameCol] = this.layerName;
    newRecord[extentCol] = extent;
    return new Promise((resolve, reject) => {
      const store = this.#db.transaction(extentsObjectsStoreName, 'readwrite').objectStore(extentsObjectsStoreName);
      store.put(newRecord);

      store.transaction.oncomplete = (event) => {
        // Return the created key
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to fetch all extents from indexeddb
   * @returns {Promise<any>} Promise that resolves to array of features
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
   * Get all downloaded extents for this layer as features for displaying in map.
   * If offlineUseLayerExtent is used no extent is returned.
   * @returns {Feature[]} Array of features representing each downloaded extent
   */
  async getExtents() {
    const extents = await this._fetchExtentsFromDb();
    return extents.map(currExtent => {
      const geom = fromExtent(currExtent[extentCol]);
      const feat = new Feature(geom);
      feat.setId(currExtent.rid);
      return feat;
    });
  }

  /**
   * Returns all extents the should be re-preloaded, includes layer extent if offlineUseLayerExtent
   * @returns {any[]} Array of extents
   */
  async getExtentsToRefresh() {
    if (this.options.offlineUseLayerExtent) {
      return [this.options.customExtent];
    }
    return this._fetchExtentsFromDb();
  }

  /**
   * Private helper that creates a db feature from OL feature
   * @param {any} formatter The formatterinstance to use
   * @param {any} feature The OL feature
   * @param {any} extentId The extentId for the extent to which this feature belong
   * @returns {any} A database representation of a feature
   */
  _createDbFeature(formatter, feature, extentId) {
    const currJsonFeature = formatter.writeFeature(feature);
    const newRecord = {};
    newRecord[nameCol] = this.layerName;
    newRecord[fidCol] = feature.getId();
    newRecord[geoJsonCol] = currJsonFeature;
    newRecord[extentId] = extentId;
    return newRecord;
  }

  /**
   * Private helper to store a set of features.
   * (all layers are stored in the same table)
   * @param {Feature[]} features
   * @param {any} extentId
   * @returns {Promise}
   */
  _storeFeatures(features, extentId) {
    return new Promise((resolve, reject) => {
      const geojsonFormat = new GeoJson();

      const store = this.#db.transaction(featuresObjectsStoreName, 'readwrite').objectStore(featuresObjectsStoreName);
      // Use put to always overwrite. We don't care what's already in db
      // Loop to store each feature individually but in same transaction
      features.forEach(currFeature => {
        const newRecord = this._createDbFeature(geojsonFormat, currFeature, extentId);
        store.put(newRecord);
      });
      store.transaction.oncomplete = (event) => {
        resolve(event.target.result);
      };
      store.transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Private helper to fetch all features from indexeddb for this source
   *
   * @returns {Promise<any>} Promise that resolves to all features in db format
   */
  _fetchAllFeaturesFromDb() {
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(featuresObjectsStoreName, 'readonly');
      const objectStore = transaction.objectStore(featuresObjectsStoreName);

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
   * Clears the storage used by this layer
   */
  clearStorage() {
    // Can't call it clear, baseclass has a clear
    return new Promise((resolve, reject) => {
      // As all layers are in the same table we have to search all objects using index and iterate to delete
      // them individually. There is no function similar to SQL "delete from where ..."
      const transaction = this.#db.transaction([featuresObjectsStoreName, extentsObjectsStoreName, editsObjectsStoreName], 'readwrite');
      const objectStore = transaction.objectStore(featuresObjectsStoreName);
      const extentsStore = transaction.objectStore(extentsObjectsStoreName);
      const editsStore = transaction.objectStore(editsObjectsStoreName);

      const index = objectStore.index(nameCol);
      const getRequest = index.getAll(this.layerName);

      const extentsIndex = extentsStore.index(nameCol);
      const getExtentsReq = extentsIndex.getAll(this.layerName);

      const editsIndex = editsStore.index(nameCol);
      const getEditsReq = editsIndex.getAll(this.layerName);

      // Return success
      transaction.oncomplete = () => {
        this.refresh();
        resolve(true);
      };

      // Return error. State is undefined
      transaction.onerror = (ev) => {
        reject(ev.target.error);
      };

      // Delete all features
      getRequest.onsuccess = () => {
        // No need to zero check. It will be an empty array
        getRequest.result.forEach(currRow => {
          objectStore.delete([this.layerName, currRow[fidCol]]);
        });
      };

      // Delete all extents
      getExtentsReq.onsuccess = () => {
        getExtentsReq.result.forEach(currRow => {
          extentsStore.delete(currRow.rid);
        });
      };

      // Delete all edits
      getEditsReq.onsuccess = () => {
        getEditsReq.result.forEach(currRow => {
          editsStore.delete([this.layerName, currRow[fidCol]]);
        });
      };
    });
  }

  /**
   * Private helper to store edits to indexeddb
   * @param {any} edits Array of edits in db format
   * @returns
   */
  _storeEdits(edits) {
    return new Promise((resolve, reject) => {
      const geojsonFormat = new GeoJson();

      const transaction = this.#db.transaction([featuresObjectsStoreName, editsObjectsStoreName], 'readwrite');
      const featuresStore = transaction.objectStore(featuresObjectsStoreName);
      const editsStore = transaction.objectStore(editsObjectsStoreName);

      edits.forEach(currEdit => {
        const currFeature = currEdit.feature;
        const currFid = currFeature.getId();

        // Check if there is a previous edit of this feature. The must only be one edit per feature and following
        // is the intricate logic to determine which wins. It is same logic as in editStore.
        // To be fair, ins does not need to know if there is a previous edit as there can't be one,
        // but the implementation is almost the same as update
        const oldEditReq = editsStore.get([this.layerName, currFid]);
        oldEditReq.onsuccess = () => {
          const oldEdit = oldEditReq.result;
          if (currEdit.type === 'ins' || currEdit.type === 'upd') {
            // Insert/Update the feaure itself
            const newRecord = this._createDbFeature(geojsonFormat, currFeature);
            featuresStore.put(newRecord);

            // Insert/Update a edit record if necessary.
            // Don't overwrite an insert with an update. The feature must be created at server if it is both inserted and edited
            // This can occur if there are multiple offline saves between sync. Normally the editstore prevents several edits for a feature
            // but the editstore can't keep track of already saved edits. This is same logic as in editstore when autosave is not used.
            if (!(currEdit.type === 'upd' && oldEdit)) {
              const newEdit = {};
              newEdit[nameCol] = this.layerName;
              newEdit[fidCol] = currFid;
              newEdit.type = currEdit.type;
              editsStore.put(newEdit);
            }
          } else {
            // So it must be a 'del'
            // If there was an old insert entry, no entry at all should be written! From the server's view, the feature has never existed
            if (oldEdit && oldEdit.type === 'ins') {
              editsStore.delete([this.layerName, currFid]);
            } else {
              // Don't care what was there before. Overwrite or create new 'del' record
              const newEdit = {};
              newEdit[nameCol] = this.layerName;
              newEdit[fidCol] = currFid;
              newEdit.type = currEdit.type;
              editsStore.put(newEdit);
            }

            // And remove the feature itself from localdb
            // No need to wait, errors are handled at transaction leven
            featuresStore.delete([this.layerName, currFid]);
          }
        };
      });

      transaction.oncomplete = (event) => {
        resolve(event.target.result);
      };
      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Stores edits to local storage. This resembles the wfsTransactionHandler.
   * @param {any} transaction Edits to store to local storage on the same form as editStore uses
   */
  async persistEdits(transaction) {
    // Transform editStore transaction to an array of db edits.
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
    await this._storeEdits(edits);

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

  /**
   * Synchronized persisted edits with server.
   * Must be overridden with an implementation adapted to the actual source, e.g. wfs.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  async syncEdits() {
    throw new Error('syncEdits must be overridden for editable layers');
  }

  /**
   * Private helper to read edit record from indexeddb
   * @returns
   */
  _fetchEditsFromDb() {
    return new Promise((resolve, reject) => {
      const transaction = this.#db.transaction(editsObjectsStoreName, 'readonly');
      const objectStore = transaction.objectStore(editsObjectsStoreName);

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
   * Reads all edits from local storage.
   * @returns {Object} A transaction obect of the same format that editStore uses
   */
  async getLocalEdits() {
    const edits = await this._fetchEditsFromDb();
    // Rebuild the quirky edit structure that editstore uses. This is also done in edithandler but that is not exposed and does it from
    // another source format
    const transaction = {
      insert: [],
      delete: [],
      update: []
    };
    edits.forEach(currEdit => {
      if (currEdit.type === 'ins') {
        transaction.insert.push(super.getFeatureById(currEdit[fidCol]));
      } else if (currEdit.type === 'upd') {
        transaction.update.push(super.getFeatureById(currEdit[fidCol]));
      } else {
        const dummy = new Feature();
        dummy.setId(currEdit[fidCol]);
        transaction.delete.push(dummy);
      }
    });

    return transaction;
  }

  /**
   * Stores features for an extent i local storage
   * @param {any} features
   * @param {any} extent
   */
  async addFeaturesForExtent(features, extent) {
    let myExtent = extent;
    let extentId = 0;
    if (this.options.offlineUseLayerExtent) {
      myExtent = this.options.customExtent;
    } else {
      // Store extent first to get an id to link each feature.
      // The linking has limited usage as a new overlapping extent will overwrite the feature and the connection to the old extent is lost
      extentId = await this._storeExtent(myExtent);
    }
    await this._storeFeatures(features, extentId);
  }
}
