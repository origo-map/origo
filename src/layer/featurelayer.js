/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var vector = require('./vector');

var featureLayer = function featureLayer(layerOptions) {
  var options = layerOptions;
  var sourceOptions = {};
  sourceOptions.attribution = layerOptions.attribution;
  sourceOptions.features = layerOptions.features;

  var vectorSource = createSource(sourceOptions);
  return vector(options, vectorSource);

  function createSource(options) {
    return new ol.source.Vector({
      attributions: options.attribution,
      features: options.features
    });
  }
}

module.exports = featureLayer;
