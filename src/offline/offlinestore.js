var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');
var localforage = require('localforage');
var layerCreator = require('../layercreator');
var offlineLayer = require('./offlinelayer');
var dispatcher = require('./offlinedispatcher');
var format = new ol.format.GeoJSON();
var storage = {};
var offlineLayers = {};
var map;
var mapName;

function offlineStore() {

  return {
    getOfflineLayers: getOfflineLayers,
    init: Init
  };

  // function addEdit(e) {
  //   if (e.action === 'insert') {
  //     addFeature('insert', e.feature, e.layerName);
  //   } else if (e.action === 'update') {
  //     if (hasFeature('insert', e.feature, e.layerName) === false) {
  //       addFeature('update', e.feature, e.layerName);
  //     }
  //   } else if (e.action === 'delete') {
  //     if (removeFeature('insert', e.feature, e.layerName) === false) {
  //       removeFeature('update', e.feature, e.layerName);
  //       addFeature('delete', e.feature, e.layerName);
  //     }
  //   }
  //   if (hasEdits() === true) {
  //     dispatcher.emitEditsChange(1);
  //   } else {
  //     dispatcher.emitEditsChange(0);
  //   }
  // }

  // function removeEdit(e) {
  //   if (e.feature.length) {
  //     e.feature.forEach(function(feature) {
  //       removeFeature(e.action, feature, e.layerName)
  //     });
  //   }
  //   if (hasEdits() === false) {
  //     dispatcher.emitEditsChange(0);
  //   }
  // }

  function Init(opt_options) {
    var options = opt_options || {};
    var layers;
    map = viewer.getMap();
    mapName = options.name || 'origo-layers';
    layers = setOfflineLayers();
    storage = createInstances(layers);
    initLayers();

    $(document).on('changeOffline', changeOffline);
  }

  function createInstances(layers) {
    var instances = {};
    layers.forEach(function(layer) {
      var layerName = layer.get('name');
      instances[layerName] = localforage.createInstance({
        name: mapName,
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

  function changeOffline(e) {
    e.stopImmediatePropagation();
    if (e.action === 'download') {
      addDownloaded(e);
    } else if (e.action === 'sync') {

    } else if (e.action === 'remove') {
      removeDownloaded(e);
      removeEdits(e);
    }
  }
  //
  // function hasFeature(type, feature, layerName) {
  //   if (edits.hasOwnProperty(layerName)) {
  //     if (edits[layerName][type].indexOf(feature.getId()) > -1) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }
  //
  function addDownloaded(e) {
    if (storage[e.layerName]) {
      setDownloaded(e.layerName, true);
      saveToStorage(e.layerName);
    }
    // if (hasFeature(type, feature, layerName) === false) {
    //   edits[layerName][type].push(feature.getId());
    // }
  }

  function removeDownloaded(e) {
    if (offlineLayers[e.layerName]) {
      setDownloaded(e.layerName, false);
      storage[e.layerName].clear();
      dispatcher.emitChangeOfflineEnd(e.layerName, 'download');
    }
  }

  function removeEdits(e) {

  }
  //
  // function removeFeature(type, feature, layerName) {
  //   var index = 0;
  //   if (edits.hasOwnProperty(layerName)) {
  //     index = edits[layerName][type].indexOf(feature.getId());
  //     if (index > -1) {
  //       edits[layerName][type].splice(index, 1);
  //       isFinished(layerName);
  //       return true;
  //     }
  //   }
  //   return false;
  // }
  //
  // function isFinished(layerName) {
  //   var editTypes;
  //   var finished = true;
  //   if (edits.hasOwnProperty(layerName)) {
  //     editTypes = Object.getOwnPropertyNames(edits[layerName]);
  //     editTypes.forEach(function(editType) {
  //       if (edits[layerName][editType].length) {
  //         finished = false;
  //         return finished;
  //       }
  //     });
  //     if (finished) {
  //       delete edits[layerName];
  //       return finished;
  //     }
  //   } else {
  //     return finished;
  //   }
  // }
  //
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
  //
  // function hasEdits() {
  //   if (Object.getOwnPropertyNames(edits).length) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
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
        if (features.length) {
          setDownloaded(layerName, true);
          offlineLayer(viewer.getLayer(layerName), features);
        } else {
          console.log('No features in ' + layerName);
        }
      });
    });
  }
}

module.exports = offlineStore;
