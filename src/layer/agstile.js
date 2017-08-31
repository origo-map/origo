"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');

var agsTile = function agsTile(layerOptions) {
  var agsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var agsOptions = $.extend(agsDefault, layerOptions);
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.params = agsOptions.params || {};
  sourceOptions.params.layers = "show:" + agsOptions.id;

  var agsSource = createSource(sourceOptions);
  return tile(agsOptions, agsSource);

  function createSource(options) {
    return new ol.source.TileArcGISRest({
      attributions: options.attribution,
      projection: options.projectionCode,
      crossOrigin: 'anonymous',
      params: options.params,
      url: options.url
    });
  }
}

module.exports = agsTile;
