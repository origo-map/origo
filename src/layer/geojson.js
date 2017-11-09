"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');
var isUrl = require('../utils/isurl');

var geojson = function geojson(layerOptions) {
  var baseUrl = viewer.getBaseUrl();
  var geojsonDefault = {
    layerType: 'vector'
  };
  var geojsonOptions = $.extend(geojsonDefault, layerOptions);
  var geojsonSource;
  var sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isUrl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = baseUrl + geojsonOptions.source;
  }

  geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource);

  function createSource(options) {
    return new ol.source.Vector({
      attributions: options.attribution,
      url: options.url,
      format: new ol.format.GeoJSON()
    });
  }
}

module.exports = geojson;
