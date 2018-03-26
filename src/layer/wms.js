"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');
var maputils = require('../maputils');

var wms = function wms(layerOptions) {
  var wmsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {
    version: '1.1.1',
    gutter: 0,
    format: 'image/png'
  };
  var wmsOptions = $.extend(wmsDefault, layerOptions);
  wmsOptions.name.split(':').pop();
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = wmsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.id = wmsOptions.id;
  sourceOptions.format = wmsOptions.format ? wmsOptions.format : sourceOptions.format;

  if (wmsOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(wmsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (wmsOptions.extent) {
      sourceOptions.tileGrid.extent = wmsOptions.extent;
    }
  }

  var wmsSource = createSource(sourceOptions);
  return tile(wmsOptions, wmsSource);

  function createSource(options) {
    return new ol.source.TileWMS(({
      attributions: options.attribution,
      url: options.url,
      gutter: options.gutter,
      crossOrigin: 'anonymous',
      projection: options.projectionCode,
      tileGrid: options.tileGrid,
      params: {
        'LAYERS': options.id,
        'TILED': true,
        'VERSION': options.version,
        'FORMAT': options.format
      }
    }))
  }
}

module.exports = wms;
