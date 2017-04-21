/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');

var wmts = function wmts(layerOptions) {
  var wmtsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {
    matrixSet: viewer.getProjectionCode(),
    matrixIdsPrefix: viewer.getProjectionCode() + ':',
    format: 'image/png',
    resolutions: viewer.getResolutions(),
    tileSize: [256, 256]
  };
  var wmtsOptions = $.extend(wmtsDefault, layerOptions);
  wmtsOptions.name.split(':').pop();
  wmtsOptions.sourceName = wmtsOptions.name;
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  if (wmtsOptions.hasOwnProperty('format')) {
    sourceOptions.format = wmtsOptions.format;
  }
  sourceOptions.attribution = wmtsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.matrixIds = [];
  sourceOptions.resolutions.forEach(function(resolution, i) {
    sourceOptions.matrixIds[i] = sourceOptions.matrixIdsPrefix + i;
  });
  sourceOptions.projectionExtent = viewer.getProjection().getExtent();
  sourceOptions.id = wmtsOptions.id;

  var wmtsSource = createSource(sourceOptions);
  return tile(wmtsOptions, wmtsSource);

  function createSource(options) {
    return new ol.source.WMTS({
      crossOrigin: 'anonymous',
      attributions: options.attribution,
      url: options.url,
      projection: options.projectionCode,
      layer: options.id,
      matrixSet: options.matrixSet,
      format: options.format,
      tileGrid: new ol.tilegrid.WMTS({
        origin: options.origin || ol.extent.getTopLeft(options.projectionExtent),
        resolutions: options.resolutions,
        matrixIds: options.matrixIds,
        tileSize: options.tileSize
      }),
      style: 'default'
    })
  }
}

module.exports = wmts;
