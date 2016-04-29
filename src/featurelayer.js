/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');

//create unmanaged layer
module.exports = function(features, map) {
  var featureLayerStore = new ol.source.Vector({
      features: features || []
  }),
  featureLayer = new ol.layer.Vector({
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
          return featurelayer;
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
