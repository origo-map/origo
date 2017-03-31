/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var layerCreator = require('../layercreator');

var offlineLayer = function offlineLayer() {

  return {
    setLayerOffline: setLayerOffline,
    setLayerOnline: setLayerOnline
  }

  function setLayerOffline(layerName, features) {
    var layer = viewer.getLayer(layerName);
    var source;
    var options = layer.getProperties();
    options.type = 'FEATURE';
    options.features = features;
    options.style = options.styleName;
    source = layerCreator(options).getSource();
    layer.setSource(source);
    return layer;
  }

  function setLayerOnline(layerName) {
    var layer = viewer.getLayer(layerName);
    var source;
    var options;
    layer.set('type', layer.get('onlineType'));
    options = layer.getProperties();
    options.source = options.sourceName;
    options.style = options.styleName;
    source = layerCreator(options).getSource();
    layer.setSource(source);
    return layer;
  }
}

module.exports = offlineLayer;
