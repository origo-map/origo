var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');
var localforage = require('localforage');

var editsStore = function featureStore() {

  $(document).on('changeFeature', featureChange);
  // var store = localforage.createInstance({
  //   name: "editor"
  // });

  /**
  Example:
  edits = {
    inserted: {
      {
        byggnader: [],
        sjoar: []
      }
    },
    modified: {


  }
  }
  }
  */

  var edits = {
    modify: {},
    insert: {},
    delete: {}
  };
  var geojson =  new ol.format.GeoJSON();

  return {
    getFeatures: getFeatures,
    saveFeatures: saveFeatures,
    syncFeatures: syncFeatures
  };

  function addFeature(e) {
    // var layer = {};
    // layer.features = geojson.writeFeatureObject(feature);
    // var featureClone = geojson.readFeatures(layer.features);
    // store.setItem('feature', layer).then(function() {
    //   return store.getItem('feature');
    // });
    var uuid = e.feature.getId();
    if (edits.insert.hasOwnProperty(e.layerName) === false) {
      edits.insert[e.layerName] = [];
    }
    edits.insert[e.layerName].push(uuid);
  }

  function removeFeature(e) {
    var index;
    if (e.action === 'insert') {
      index = edits.insert[e.layerName].indexOf(e.feature.getId());
      if (index) {
        edits.insert[e.layerName].splice(index, 1);
      }
    } else if (e.action === 'modify') {
        console.log('modify');
    } else if (e.action === 'delete') {
        console.log('delete');
    }
  }

  function saveFeatures() {

  }

  function getFeatures() {
    // return store.getItem('feature');
  }

  function syncFeatures() {

  }

  function featureChange(e) {
    if (e.status === 'pending') {
      addFeature(e);
    } else if (e.status === 'finished') {
      removeFeature(e);
    }
  }
}

module.exports = editsStore;
