"use strict";

var ol = require('openlayers');

module.exports = function tile(options, source) {
  options.source = source;
  return new ol.layer.Tile(options);
}
