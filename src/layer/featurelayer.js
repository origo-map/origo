"use strict";

var ol = require('openlayers');
var vector = require('./vector');

var featureLayer = function featureLayer(layerOptions) {
  var options = layerOptions;
  var sourceOptions = {};
  var vectorSource;
  sourceOptions.attribution = layerOptions.attribution;
  sourceOptions.features = layerOptions.features;

  vectorSource = createSource(sourceOptions);
  return vector(options, vectorSource);

  function createSource(options) {
    return new ol.source.Vector({
      attributions: options.attribution,
      features: options.features
    });
  }
}

module.exports = featureLayer;
