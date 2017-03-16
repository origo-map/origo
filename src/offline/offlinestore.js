var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');
var localforage = require('localforage');
// var dispatcher = require('./editdispatcher');
var lsLayers = {};
var layerSources = {};

var offlineStore = function offlineStore() {

  var store = localforage.createInstance({
    name: "origo",
    storeName: 'byggimport1'
  });

  var format = new ol.format.GeoJSON();
  $(document).on('changeOffline', changeOffline);

  return {
    getLsLayers: getLsLayers,
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

  function Init() {

  }

  function getLsLayers() {
    return lsLayers;
  }

  function changeOffline(e) {
    e.stopImmediatePropagation();
    if (e.status === 'download') {
      addDownload(e);
    } else if (e.status === 'sync') {

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
  function addDownload(e) {
    if (lsLayers.hasOwnProperty(e.layerName) === false) {
      lsLayers[e.layerName] = createOfflineObj();
      saveToLs(e.layerName);
    }
    // if (hasFeature(type, feature, layerName) === false) {
    //   edits[layerName][type].push(feature.getId());
    // }
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
      data: {},
      edits: {}
    }
  }

  function saveToLs(layerName) {
    var features = viewer.getLayer(layerName).getSource().getFeatures();
    setItems(features);
  }
  //
  // function hasEdits() {
  //   if (Object.getOwnPropertyNames(edits).length) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  function setItems(features) {
    var promises = features.map(function(feature) {
      var id = feature.getId();
      var obj = format.writeFeatureObject(feature);
      return store.setItem(id, obj);
    });
    Promise.all(promises).then(function(results) {
        console.log(results);
    });
  }
}

module.exports = offlineStore;
