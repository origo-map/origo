var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');
var localforage = require('localforage');
var offlineLayer = require('./offlinelayer')();
var dispatcher = require('./offlinedispatcher');
var editorDispatcher = require('../editor/editdispatcher');
var format = new ol.format.GeoJSON();
var storage = {};
var editsStorage = {};
var offlineLayers = {};
var storageName;
var editsStorageName;
var map;

function offlineStore() {

  return {
    getOfflineLayers: getOfflineLayers,
    getOfflineLayer: getOfflineLayer,
    getOfflineEdits: getOfflineEdits,
    getEditsItems: getEditsItems,
    init: Init
  };

  function Init(opt_options) {
    var options = opt_options || {};
    var layerNames;
    map = viewer.getMap();
    storageName = options.name || 'origo-layers';
    editsStorageName = options.editsName || 'origo-layers-edits';
    layerNames = viewer.getLayersByProperty('offline', true, true);
    setOfflineLayers(layerNames);
    storage = createInstances(layerNames, storageName);
    editsStorage = createInstances(layerNames, editsStorageName);
    initLayers();

    $(document).on('changeOffline', onChangeOffline);
    $(document).on('changeOfflineEdits', onChangeOfflineEdits);
  }

  function createInstances(layerNames, name) {
    var instances = {};
    layerNames.forEach(function(layerName) {
      instances[layerName] = localforage.createInstance({
        name: name,
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
    } else {
      return undefined;
    }
  }

  function setOfflineLayers(layerNames) {
    layerNames.forEach(function(layerName) {
      var layer = viewer.getLayer(layerName);
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
    if (editsStorage[e.layerName]) {

    } else {
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
        .then(function() {
          saveFeaturesToStorage(layerName);
        });
    } else {
      saveFeaturesToStorage(layerName);
    }
  }

  function ondEdits(layerName, ids) {
    var promises = ids.map(function(id) {
      return removeFromEditsStorage(id, layerName);
    });
    return Promise.all(promises).then(function() {
      return true;
    });
  }

  function onRemove(layerName) {
    if (offlineLayers[layerName].edits) {
      var proceed = confirm('Du har fortfarande offline-ändringar som inte är sparade. Om du fortsätter kommer dessa att försvinna.');
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
        .then(function() {
          setLayerOnline(layerName);
          dispatcher.emitChangeOfflineEnd(layerName, 'download');
        });
    }
  }

  function createOfflineObj() {
    return {
      downloaded: false,
      edits: false
    }
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
    var features;
    if (storage[layerName]) {
      features = viewer.getLayer(layerName).getSource().getFeatures();
      setItems(layerName, features);
    } else {
      console.log(layerName + ' is missing in storage');
    }
  }

  function setItems(layerName, features) {
    var promises = features.map(function(feature) {
      var id = feature.getId();
      var obj = format.writeFeatureObject(feature);
      return storage[layerName].setItem(id, obj);
    });
    Promise.all(promises).then(function(results) {
      setLayerOffline(layerName, features);
      dispatcher.emitChangeOfflineEnd(layerName, 'offline');
    });
  }

  function getItems(layerName) {
    var layer = viewer.getLayer(layerName);
    var geometryName = layer.get('geometryName');
    var features = [];
    return storage[layerName].iterate(function(value, key, index) {
        var storedFeature = format.readFeature(value);
        var feature = restoreGeometryName(storedFeature, geometryName);
        features.push(feature);
      })
      .then(function() {
        return features;
      });
  }

  function getEditsItems(layerName) {
    var layer = viewer.getLayer(layerName);
    var items = [];
    return editsStorage[layerName].iterate(function(value, key, index) {
        var obj = {};
        obj[key] = value;
        items.push(obj);
      })
      .then(function() {
        return items;
      });
  }

  function initLayers() {
    var layerNames = Object.getOwnPropertyNames(storage);
    layerNames.forEach(function(layerName) {
      getItems(layerName).then(function(features) {
        var layer;
        if (features.length) {
          setLayerOffline(layerName, features);
        } else {
          setLayerOnline(layerName, features);
        }
      });
      getEditsItems(layerName).then(function(items) {
        var layer;
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
    updates.forEach(function(feature) {
      var id = feature.getId();
      var action = 'update';
      editsStorage[layerName].getItem(id)
        .then(function(result) {
          if (result === null) {
            saveToEditsStorage(feature, layerName, action);
          } else {
            saveFeatureToStorage(feature, layerName, action);
          }
        });
    });
  }

  function saveInsert(inserts, layerName) {
    inserts.forEach(function(feature) {
      var action = 'insert';
      saveToEditsStorage(feature, layerName, action);
    });
  }

  function saveDelete(deletes, layerName) {
    deletes.forEach(function(feature) {
      var id = feature.getId();
      var action = 'delete';
      editsStorage[layerName].getItem(id)
        .then(function(result) {
          if (result === null) {
            saveToEditsStorage(feature, layerName, action);
          } else if (result === 'insert') {
            removeFromEditsStorage(feature.getId(), layerName)
              .then(function() {
                emitChangeFeature(feature, layerName, action);
              });
          } else {
            saveFeatureToStorage(feature, layerName, action);
          }
        });
    });
  }

  function saveToEditsStorage(feature, layerName, action) {
    var id = feature.getId();
    editsStorage[layerName].setItem(id, action)
      .then(function() {
        setEdits(layerName, true);
        saveFeatureToStorage(feature, layerName, action);
      });
  }

  function removeFromEditsStorage(id, layerName) {
    return editsStorage[layerName].removeItem(id)
      .then(function() {
        editsStorage[layerName].length()
          .then(function(nr) {
            if (nr > 0) {
              setEdits(layerName, true);
            } else {
              setEdits(layerName, false);
            }
          });
      });
  }

  function saveFeatureToStorage(feature, layerName, action) {
    var id = feature.getId();
    storage[layerName].setItem(id, format.writeFeatureObject(feature))
      .then(function() {
        emitChangeFeature(feature, layerName, action);
      });
  }

  function emitChangeFeature(feature, layerName, action) {
    editorDispatcher.emitChangeFeature({
      feature: [feature],
      layerName: layerName,
      status: 'finished',
      action: action
    });
  }

  function restoreGeometryName(feature, geometryName) {
    var geometry = feature.getGeometry();
    feature.unset(feature.getGeometryName());
    feature.setGeometryName(geometryName);
    feature.setGeometry(geometry);
    return feature;
  }

}

module.exports = offlineStore;
