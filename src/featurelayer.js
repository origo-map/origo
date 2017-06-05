"use strict";

var ol = require('openlayers');

//create unmanaged layer
module.exports = function(features, map) {
  var collection = features ? [features] : [];
  var featureLayerStore = new ol.source.Vector({
      features: collection
  });
  var featureLayer = new ol.layer.Vector({
    source: featureLayerStore,
    map: map
  });
  return {
      addFeature: function addFeature(feature) {
          featureLayerStore.addFeature(feature);
      },
      getFeatures: function getFeatures() {
          return featureLayerStore.getFeatures();
      },
      getFeatureLayer: function getFeatureLayer() {
          return featureLayer;
      },
      getFeatureStore: function getFeatureStore() {
          return featureLayerStore;
      },
      clear: function clear() {
          featureLayerStore.clear();
      },
      clearAndAdd: function clearAndAdd(feature, style) {
          featureLayerStore.clear();
          featureLayer.setStyle(style);
          featureLayerStore.addFeature(feature);
      }
  }
}
