/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');

var wfs = function wfs(layer) {
  var sourceOptions = viewer.getMapSource()[layer.get('sourceName')];
  sourceOptions.featureType = layer.get('name').split('__').shift();
  sourceOptions.geometryName = layer.get('geometryName');
  sourceOptions.filter = layer.get('filter');
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.extent = layer.get('extent');
  sourceOptions.projectionCode = viewer.getProjectionCode();

  var request = createRequest(sourceOptions);
  return request;

  function createRequest(options) {
    var format = new ol.format.GeoJSON({
      geometryName: options.geometryName
    });

    var serverUrl = options.url;
    var queryFilter;

    //If cql filter then bbox must be used in the filter.
    if (options.filter) {
      queryFilter = '&CQL_FILTER=' + options.filter +
        ' AND BBOX(' + options.geometryName + ',' +
        options.extent.join(',') + ',' +
        "'" + options.projectionCode + "')";
    } else {
      queryFilter = '&BBOX=' +
        options.extent.join(',') + ',' + options.projectionCode;
    }

    var url = serverUrl +
      '?service=WFS&' +
      'version=1.1.0&request=GetFeature&typeName=' + options.featureType +
      '&outputFormat=application/json' +
      '&srsname=' + options.projectionCode +
      queryFilter;

    return $.ajax({
        url: url,
        cache: false
      })
      .then(function(response) {
        return format.readFeatures(response);
      });
  }
}

module.exports = wfs;
