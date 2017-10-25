"use strict";

var ol = require('openlayers');
var style = require('../style')();
var viewer = require('../viewer');

module.exports = function vector(options, source) {
  var vectorLayer;
  switch (options.layerType) {
    case 'vector':
      options.source = source;
      options.style = style.createStyle(options.style);
      vectorLayer = new ol.layer.Vector(options);
      break;
    case 'cluster':
      options.clusterOptions = options.clusterOptions || {};
      source.clusterOptions = viewer.getMapSource()[options.sourceName].clusterOptions || {};
      var clusterDistance = options.clusterOptions.clusterDistance || source.clusterOptions.clusterDistance || viewer.getClusterOptions().clusterDistance || 60;
      var clusterMaxZoom = options.clusterOptions.clusterMaxZoom || source.clusterOptions.clusterMaxZoom || viewer.getClusterOptions().clusterMaxZoom || viewer.getResolutions().length-1;
      var clusterInitialDistance = viewer.getSettings().zoom > clusterMaxZoom ? 0 : clusterDistance;
      options.source = new ol.source.Cluster({
        attributions: options.attribution,
        source: source,
        distance: clusterInitialDistance
      });
      options.source.setProperties({
        clusterDistance : clusterDistance,
        clusterMaxZoom : clusterMaxZoom
      });
      options.style = style.createStyle(options.style, options.clusterStyle);
      vectorLayer = new ol.layer.Vector(options);
      break;
    case 'image':
      options.source = new ol.source.ImageVector({
        source: source,
        style: style.createStyle(options.style)
      });
      vectorLayer = new ol.layer.Image(options);
      break;
  }
  return vectorLayer;
}
