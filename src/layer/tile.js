/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');

module.exports = function tile(options, source) {
  options.source = source;
  return new ol.layer.Tile(options);
}
