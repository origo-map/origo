'use strict';

var ol = require('openlayers');

module.exports = function image(options, source) {
  options.source = source;
  return new ol.layer.Image(options);
};
