"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var layerCreator = require('../layercreator');

var offlineLayer = function offlineLayer() {

  return {
    setOfflineSource: setOfflineSource,
    setOnlineSource: setOnlineSource
  }

  function setOfflineSource(layerName, features) {
    var layer = viewer.getLayer(layerName);
    var source;
    var options;
    layer.set('type', 'OFFLINE');

    // Create a feature layer and get the source
    options = layer.getProperties();
    options.type = 'FEATURE';
    options.features = features;
    options.style = options.styleName;
    source = layerCreator(options).getSource();
    layer.setSource(source);
    return layer;
  }

  function setOnlineSource(layerName) {
    var layer = viewer.getLayer(layerName);
    var source;
    var options;

    // Create a layer with the online source and get the source
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
