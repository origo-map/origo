"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');
var isUrl = require('../utils/isurl');

var topojson = function topojson(layerOptions) {
  var baseUrl = viewer.getBaseUrl();
  var topojsonDefault = {
    layerType: 'vector'
  };
  var topojsonOptions = $.extend(topojsonDefault, layerOptions);
  var topojsonSource;
  var sourceOptions = {};
  sourceOptions.attribution = topojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isUrl(topojsonOptions.source)) {
    sourceOptions.url = topojsonOptions.source;
  } else {
    topojsonOptions.sourceName = topojsonOptions.source;
    sourceOptions.url = baseUrl + topojsonOptions.source;
  }

  topojsonSource = createSource(sourceOptions);
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
