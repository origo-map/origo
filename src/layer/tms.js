/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');

var tms = function tms(layerOptions) {
  var tmsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var tmsOptions = $.extend(tmsDefault, layerOptions);
  tmsOptions.sourceName = tmsOptions.name;
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = tmsOptions.attribution;
  sourceOptions.projection = viewer.getProjectionCode() || 'EPSG:3857';
  sourceOptions.tileGrid = viewer.getTileGrid();

  var tmsSource = createSource(sourceOptions, tmsOptions);
  return tile(tmsOptions, tmsSource);

  function createSource(options, tmsOptions) {
	options.url += tmsOptions.layerName + '@'  + tmsOptions.gridset + '@' + tmsOptions.format + '/{z}/{x}/{-y}.'+ tmsOptions.format;
    return new ol.source.XYZ(options);
  }
}

module.exports = tms;
