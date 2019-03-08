import $ from 'jquery';
import GeoJSONFormat from 'ol/format/GeoJSON';
import localforage from 'localforage';
import viewer from '../../viewer';
import dispatcher from './offlinedispatcher';
import editorDispatcher from '../editor/editdispatcher';
import OfflineLayer from './offlinelayer';

const offlineLayer = OfflineLayer();

const format = new GeoJSONFormat();
let storage = {};
let editsStorage = {};
const offlineLayers = {};
let storageName;
let editsStorageName;

function offlineStore() {
  function init(optOptions) {
    const options = optOptions || {};
    const layerNames = viewer.getLayersByProperty('offline', true, true);
    storageName = options.name || 'origo-layers';
    editsStorageName = options.editsName || 'origo-layers-edits';
    setOfflineLayers(layerNames);
    storage = createInstances(layerNames, storageName);
    editsStorage = createInstances(layerNames, editsStorageName);
    initLayers();

    $(document).on('changeOffline', onChangeOffline);
    $(document).on('changeOfflineEdits', onChangeOfflineEdits);
  }

  function createInstances(layerNames, name) {
    const instances = {};
    layerNames.forEach((layerName) => {
      instances[layerName] = localforage.createInstance({
        name,
        storeName: layerName
      });
    });

    return instances;
  }

  function getOfflineLayers() {
    return offlineLayers;
  }

  function getOfflineLayer(layerName) {
    return offlineLayers[layerName];
  }

  function getOfflineEdits(layerName) {
    if (offlineLayers[layerName].edits) {
      return getEditsItems(layerName);
    }

    return undefined;
  }

  function setOfflineLayers(layerNames) {
    layerNames.forEach((layerName) => {
      const layer = viewer.getLayer(layerName);
      layer.set('onlineType', layer.get('type'));
      offlineLayers[layerName] = createOfflineObj();
      offlineLayer.setOfflineSource(layerName, []);
    });
  }

  function onChangeOffline(e) {
    e.stopImmediatePropagation();
    if (e.action === 'download') {
      onDownload(e.layerName)
    } else if (e.action === 'edits') {
      ondEdits(e.layerName, e.ids);
    } else if (e.action === 'remove') {
      onRemove(e.layerName);
    }
  }

  function onChangeOfflineEdits(e) {
    e.stopImmediatePropagation();
    if (editsStorage[e.layerName] === undefined) {
      editsStorage[e.layerName] = localforage.createInstance({
        name: editsStorageName,
        storeName: e.layerName
      });
    }
    if (e.edits.update) {
      saveUpdate(e.edits.update, e.layerName);
    }
    if (e.edits.insert) {
      saveInsert(e.edits.insert, e.layerName);
    }
    if (e.edits.delete) {
      saveDelete(e.edits.delete, e.layerName);
    }
  }

  function onDownload(layerName) {
    if (offlineLayers[layerName].downloaded) {
      storage[layerName].clear()
        .then(() => {
          saveFeaturesToStorage(layerName);
        });
    } else {
      saveFeaturesToStorage(layerName);
    }
  }

  function ondEdits(layerName, ids) {
    const promises = ids.map(id => removeFromEditsStorage(id, layerName));
    return Promise.all(promises).then(() => true);
  }

  function onRemove(layerName) {
    if (offlineLayers[layerName].edits) {
      const proceed = confirm('Du har fortfarande offline-ändringar som inte är sparade. Om du fortsätter kommer dessa att försvinna.');
      if (proceed) {
        removeDownloaded(layerName);
      }
    } else {
      removeDownloaded(layerName);
    }
  }

  function removeDownloaded(layerName) {
    if (offlineLayers[layerName]) {
      return storage[layerName].clear()
        .then(() => {
          setLayerOnline(layerName);
          dispatcher.emitChangeOfflineEnd(layerName, 'download');
        });
    }
  }

  function createOfflineObj() {
    return {
      downloaded: false,
      edits: false
    };
  }

  function setDownloaded(layerName, downloaded) {
    if (downloaded) {
      offlineLayers[layerName].downloaded = true;
    } else {
      offlineLayers[layerName].downloaded = false;
    }
  }

  function setEdits(layerName, edits) {
    if (edits) {
      offlineLayers[layerName].edits = true;
    } else {
      offlineLayers[layerName].edits = false;
    }
  }

  function saveFeaturesToStorage(layerName) {
    if (storage[layerName]) {
      const features = viewer.getLayer(layerName).getSource().getFeatures();
      setItems(layerName, features);
    } else {
      console.log(`${layerName} is missing in storage`);
    }
  }

  function setItems(layerName, features) {
    const promises = features.map((feature) => {
      const id = feature.getId();
      const obj = format.writeFeatureObject(feature);
      return storage[layerName].setItem(id, obj);
    });
    Promise.all(promises).then(() => {
      setLayerOffline(layerName, features);
      dispatcher.emitChangeOfflineEnd(layerName, 'offline');
    });
  }

  function getItems(layerName) {
    const layer = viewer.getLayer(layerName);
    const geometryName = layer.get('geometryName');
    const features = [];
    return storage[layerName].iterate((value, key, index) => {
      const storedFeature = format.readFeature(value);
      const feature = restoreGeometryName(storedFeature, geometryName);
      features.push(feature);
    })
      .then(() => features);
  }

  function getEditsItems(layerName) {
    const items = [];
    return editsStorage[layerName].iterate((value, key, index) => {
      const obj = {};
      obj[key] = value;
      items.push(obj);
    })
      .then(() => items);
  }

  function initLayers() {
    const layerNames = Object.getOwnPropertyNames(storage);
    layerNames.forEach((layerName) => {
      getItems(layerName).then((features) => {
        if (features.length) {
          setLayerOffline(layerName, features);
        } else {
          setLayerOnline(layerName, features);
        }
      });
      getEditsItems(layerName).then((items) => {
        if (items.length) {
          setEdits(layerName, true);
        } else {
          setEdits(layerName, false);
        }
      });
    });
  }

  function setLayerOffline(layerName, features) {
    offlineLayer.setOfflineSource(layerName, features);
    setDownloaded(layerName, true);
  }

  function setLayerOnline(layerName) {
    offlineLayer.setOnlineSource(layerName);
    setDownloaded(layerName, false);
  }

  function saveUpdate(updates, layerName) {
    updates.forEach((feature) => {
      const id = feature.getId();
      const action = 'update';
      editsStorage[layerName].getItem(id)
        .then((result) => {
          if (result === null) {
            saveToEditsStorage(feature, layerName, action);
          } else {
            saveFeatureToStorage(feature, layerName, action);
          }
        });
    });
  }

  function saveInsert(inserts, layerName) {
    inserts.forEach((feature) => {
      const action = 'insert';
      saveToEditsStorage(feature, layerName, action);
    });
  }

  function saveDelete(deletes, layerName) {
    deletes.forEach((feature) => {
      const id = feature.getId();
      const action = 'delete';
      editsStorage[layerName].getItem(id)
        .then((result) => {
          if (result === null) {
            saveToEditsStorage(feature, layerName, action);
          } else if (result === 'insert') {
            removeFromEditsStorage(feature.getId(), layerName)
              .then(() => {
                emitChangeFeature(feature, layerName, action);
              });
          } else {
            saveFeatureToStorage(feature, layerName, action);
          }
        });
    });
  }

  function saveToEditsStorage(feature, layerName, action) {
    const id = feature.getId();
    editsStorage[layerName].setItem(id, action)
      .then(() => {
        setEdits(layerName, true);
        saveFeatureToStorage(feature, layerName, action);
      });
  }

  function removeFromEditsStorage(id, layerName) {
    return editsStorage[layerName].removeItem(id)
      .then(() => {
        editsStorage[layerName].length()
          .then((nr) => {
            if (nr > 0) {
              setEdits(layerName, true);
            } else {
              setEdits(layerName, false);
            }
          });
      });
  }

  function saveFeatureToStorage(feature, layerName, action) {
    const id = feature.getId();
    storage[layerName].setItem(id, format.writeFeatureObject(feature))
      .then(() => {
        emitChangeFeature(feature, layerName, action);
      });
  }

  function emitChangeFeature(feature, layerName, action) {
    editorDispatcher.emitChangeFeature({
      feature: [feature],
      layerName,
      status: 'finished',
      action
    });
  }

  function restoreGeometryName(feature, geometryName) {
    const geometry = feature.getGeometry();
    feature.unset(feature.getGeometryName());
    feature.setGeometryName(geometryName);
    feature.setGeometry(geometry);
    return feature;
  }

  return {
    getOfflineLayers,
    getOfflineLayer,
    getOfflineEdits,
    getEditsItems,
    init
  };
}

export default offlineStore;
