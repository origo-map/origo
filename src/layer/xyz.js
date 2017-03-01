/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');

var xyz = function xyz(layerOptions) {
  var xyzDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var xyzOptions = $.extend(xyzDefault, layerOptions);
  xyzOptions.sourceName = xyzOptions.id;
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = xyzOptions.attribution;
  sourceOptions.projection = viewer.getProjectionCode() || 'EPSG:3857';
  sourceOptions.tileGrid = viewer.getTileGrid();

  var xyzSource = createSource(sourceOptions);
  return tile(xyzOptions, xyzSource);

  function createSource(options) {
    var format = options.sourceName.split('.')[1],
      url = options.sourceName.split('.')[0] + '/{z}/{x}/{y}.';
    url += format;
    options.url = format;
    return new ol.source.XYZ(options);
  }
}

module.exports = xyz;
