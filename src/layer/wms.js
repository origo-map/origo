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
  sourceOptions.id = wmsOptions.id;
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
        'LAYERS': options.id,
        'TILED': true,
        VERSION: options.version,
        'SRS': "EPSG:3857"
      }
    }))
  }
}

module.exports = wms;
