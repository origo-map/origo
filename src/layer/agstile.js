"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');
var maputils = require('../maputils');

var agsTile = function agsTile(layerOptions) {
  var agsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var agsOptions = $.extend(agsDefault, layerOptions);
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.params = agsOptions.params || {};
  sourceOptions.params.layers = "show:" + agsOptions.id;

  if (agsOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(agsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (agsOptions.extent) {
      sourceOptions.tileGrid.extent = agsOptions.extent;
    }
  }

  var agsSource = createSource(sourceOptions);
  return tile(agsOptions, agsSource);

  function createSource(options) {
    return new ol.source.TileArcGISRest({
      attributions: options.attribution,
      projection: options.projection,
      crossOrigin: 'anonymous',
      params: options.params,
      url: options.url,
      tileGrid: options.tileGrid
    });
  }
}

module.exports = agsTile;
