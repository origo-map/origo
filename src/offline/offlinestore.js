var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');
var localforage = require('localforage');
var layerCreator = require('../layercreator');
var offlineLayer = require('./offlinelayer');
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
    init: Init
  };

  function Init(opt_options) {
    var options = opt_options || {};
    var layers;
    map = viewer.getMap();
    storageName = options.name || 'origo-layers';
    editsStorageName = options.editsName || 'origo-layers-edits';
    layers = setOfflineLayers();
    storage = createInstances(layers);
    initLayers();

    $(document).on('changeOffline', onChangeOffline);
    $(document).on('changeOfflineEdits', onChangeOfflineEdits);
  }

  function createInstances(layers) {
    var instances = {};
    layers.forEach(function(layer) {
      var layerName = layer.get('name');
      instances[layerName] = localforage.createInstance({
        name: storageName,
        storeName: layerName
      });
    });
    return instances;
  }

  function getOfflineLayers() {
    return offlineLayers;
  }

  function setOfflineLayers() {
    return map.getLayers().getArray().filter(function(layer) {
      var layerName;
      if (layer.get('offline')) {
        layerName = layer.get('name');
        offlineLayers[layerName] = createOfflineObj();
        return layer;
      }
    });
  }

  function onChangeOffline(e) {
    e.stopImmediatePropagation();
    if (e.action === 'download') {
      addDownloaded(e);
    } else if (e.action === 'sync') {

    } else if (e.action === 'remove') {
      removeDownloaded(e);
      removeEdits(e);
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
      writeUpdate(e.edits.update, e.layerName);
    }
    if (e.edits.insert) {
      writeInsert(e.edits.insert, e.layerName);
    }
    if (e.edits.delete) {
      writeDelete(e.edits.delete, e.layerName);
    }
  }

  function addDownloaded(e) {
    if (storage[e.layerName]) {
      setDownloaded(e.layerName, true);
      saveToStorage(e.layerName);
    }
  }

  function removeDownloaded(e) {
    var layer;
    if (offlineLayers[e.layerName]) {
      layer = viewer.getLayer(e.layerName);
      layer.set('type', layer.get('onlineType'));
      setDownloaded(e.layerName, false);
      storage[e.layerName].clear();
      dispatcher.emitChangeOfflineEnd(e.layerName, 'download');
    }
  }

  function removeEdits(e) {

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

  function saveToStorage(layerName) {
    dispatcher.emitChangeOfflineStart(layerName, 'download');
    var features = viewer.getLayer(layerName).getSource().getFeatures();
    setItems(layerName, features);
  }

  function setItems(layerName, features) {
    var promises = features.map(function(feature) {
      var id = feature.getId();
      var obj = format.writeFeatureObject(feature);
      return storage[layerName].setItem(id, obj);
    });
    Promise.all(promises).then(function(results) {
      dispatcher.emitChangeOfflineEnd(layerName, 'offline');
    });
  }

  function getItems(layerName) {
    var layer = viewer.getLayer(layerName);
    var features = [];
    return storage[layerName].iterate(function(value, key, index) {
      features.push(format.readFeature(value));
    })
    .then(function() {
      return features;
    });
  }

  function initLayers() {
    var layerNames = Object.getOwnPropertyNames(storage);
    layerNames.forEach(function(layerName) {
      getItems(layerName).then(function(features) {
        var layer;
        if (features.length) {
          layer = viewer.getLayer(layerName);
          layer.set('onlineType', layer.get('type'));
          layer.set('type', 'OFFLINE');
          setDownloaded(layerName, true);
          offlineLayer(layer, features);
        } else {
          console.log('No features in ' + layerName);
        }
      });
    });
  }
}

function writeUpdate(updates, layerName) {
  updates.forEach(function(feature) {
    var id = feature.getId();
    var action = 'update';
    editsStorage[layerName].getItem(id)
      .then(function(result) {
        console.log(result);
        if (result === null) {
          editsStorage[layerName].setItem(id, action)
            .then(function() {
              emitChangeFeature(feature, layerName, action);
            });
        } else {
          emitChangeFeature(feature, layerName, action);
        }
      });
  });
}

function writeInsert(inserts, layerName) {
  inserts.forEach(function(feature) {
    var id = feature.getId();
    var action = 'insert';
    editsStorage[layerName].setItem(id, action)
      .then(function() {
        emitChangeFeature(feature, layerName, action);
      });
  });
}

function writeDelete(deletes, layerName) {
  deletes.forEach(function(feature) {
    var id = feature.getId();
    editsStorage[layerName].getItem(id)
    var action = 'delete';
    editsStorage[layerName].setItem(id, action)
      .then(function() {
        emitChangeFeature(feature, layerName, action);
      });
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

module.exports = offlineStore;
