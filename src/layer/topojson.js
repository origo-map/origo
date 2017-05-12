"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');
var isUrl = require('../utils/isurl');

var topojson = function topojson(layerOptions) {
  var baseUrl = viewer.getBaseUrl();
  var toposonDefault = {
    layerType: 'vector'
  };
  var topojsonOptions = $.extend(topojsonDefault, layerOptions);
  sourceOptions.attribution = topojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName.layerOptions.sourceName;
  if (isUrl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else {
    sourceOptions.url = baseUrl + geojsonOptions.source;
  }

  var topojsonSource = createSource(topojsonOptions);
  return vector(topojsonOptions, topojsonSource);

  function createSource(options) {
    return new ol.source.Vector({
      attributions: options.attribution,
      url: options.url,
      format: new ol.format.TopoJSON({
        defaultDataProjection: options.projectionCode
      })
    });
  }
}

module.exports = topojson;
