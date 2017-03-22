/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var layerCreator = require('../layercreator');

var offlineLayer = function offlineLayer(layer, features) {
  var source;
  var options = layer.getProperties();
  options.type = 'FEATURE';
  options.features = features;
  options.style = options.styleName;
  source = layerCreator(options).getSource();
  layer.setSource(source);
  return layer;
}

module.exports = offlineLayer;
