/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');

var wms = function wms(layerOptions) {
  var wmsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {
    version: '1.1.1',
    gutter: 0
  };
  var wmsOptions = $.extend(wmsDefault, layerOptions);
  wmsOptions.name.split(':').pop();
  wmsOptions.sourceName = wmsOptions.name;
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = wmsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.name = wmsOptions.name;

  var wmsSource = createSource(sourceOptions);
  return tile(wmsOptions, wmsSource);

  function createSource(options) {
    return new ol.source.TileWMS(({
      attributions: options.attribution,
      url: options.url,
      gutter: options.gutter,
      crossOrigin: 'anonymous',
      projection: options.projectionCode,
      params: {
        'LAYERS': options.name,
        'TILED': true,
        VERSION: options.version
      }
    }))
  }
}

module.exports = wms;
