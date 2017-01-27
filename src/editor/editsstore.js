var ol = require('openlayers');
var localforage = require('localforage');

var editsStore = function featureStore() {

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
  var tempId = '_tempId';

  var edits = {
    modified: {},
    inserted: {},
    deletes: {}
  };
  var geojson =  new ol.format.GeoJSON();

  return {
    getFeatures: getFeatures,
    addFeature: addFeature,
    saveFeatures: saveFeatures,
    syncFeatures: syncFeatures
  };

  function addFeature(uuid, layerName) {
    // var layer = {};
    // layer.features = geojson.writeFeatureObject(feature);
    // var featureClone = geojson.readFeatures(layer.features);
    // store.setItem('feature', layer).then(function() {
    //   return store.getItem('feature');
    // });
    if (edits.inserted.hasOwnProperty(layerName) === false) {
      edits.inserted[layerName] = [];
    }
    edits.inserted[layerName].push(uuid);
  }

  function saveFeatures() {

  }

  function getFeatures() {
    // return store.getItem('feature');
  }

  function syncFeatures() {

  }
}

module.exports = editsStore;
