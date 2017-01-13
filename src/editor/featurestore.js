var ol = require('openlayers');
var localforage = require('localforage');

var featureStore = function featureStore() {

  var store = localforage.createInstance({
    name: "editor"
  });
  var edits = {
    modified: undefined,
    deletes: undefined
  };
  var geojson =  new ol.format.GeoJSON();

  return {
    getFeatures: getFeatures,
    saveFeatures: saveFeatures,
    syncFeatures: syncFeatures
  };

  function insertFeature(feature) {
    var layer = {};
    layer.features = geojson.writeFeatureObject(feature);
    var featureClone = geojson.readFeatures(layer.features);
    store.setItem('feature', layer).then(function() {
      return store.getItem('feature');
    });
  }

  function saveFeatures() {

  }

  function getFeatures() {
    return store.getItem('feature');
  }

  function syncFeatures() {

  }
}

module.exports = featureStore;
