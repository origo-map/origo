/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var style = require('../style')();

module.exports = function vector(options, source) {
  var vectorLayer;
  switch (options.layerType) {
    case 'vector':
      options.source = source;
      options.style = style.createStyle(options.style);
      vectorLayer = new ol.layer.Vector(options);
      break;
    case 'cluster':
      options.source = new ol.source.Cluster({
        attributions: options.attribution,
        source: source,
        distance: 60
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
