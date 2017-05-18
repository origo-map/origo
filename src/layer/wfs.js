"use strict";
var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');

var wfs = function wfs(layerOptions) {
  var wfsDefault = {
    layerType: 'vector'
  };
  var sourceDefault = {};
  var wfsOptions = $.extend(wfsDefault, layerOptions);
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  wfsOptions.featureType = sourceOptions.featureType = wfsOptions.id;
  sourceOptions.geometryName = wfsOptions.geometryName;
  sourceOptions.filter = wfsOptions.filter;
  sourceOptions.attribution = wfsOptions.attribution;
  sourceOptions.resolutions = viewer.getResolutions();
  sourceOptions.projectionCode = viewer.getProjectionCode();

  var wfsSource = createSource(sourceOptions);
  return vector(wfsOptions, wfsSource);

  function createSource(options) {
    var vectorSource = null;
    var serverUrl = options.url;

    //If cql filter then bbox must be used in the filter.
    var queryFilter = options.filter ? '&CQL_FILTER=' + options.filter + ' AND BBOX(' + options.geometryName + ',' : '&BBOX=';
    var bboxProjectionCode = options.filter ? "'" + options.projectionCode + "')" : options.projectionCode;
    vectorSource = new ol.source.Vector({
      attributions: options.attribution,
      format: new ol.format.GeoJSON({
        geometryName: options.geometryName
      }),
      loader: function(extent, resolution, projection) {
        var url = serverUrl +
          '?service=WFS&' +
          'version=1.1.0&request=GetFeature&typeName=' + options.featureType +
          '&outputFormat=application/json' +
          '&srsname=' + options.projectionCode +
          queryFilter + extent.join(',') + ',' + bboxProjectionCode;
        $.ajax({
            url: url,
            cache: false
          })
          .done(function(response) {
            vectorSource.addFeatures(vectorSource.getFormat().readFeatures(response));
          });
      },
      strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        maxZoom: options.resolutions.length
      }))
    });
    return vectorSource;
  }
}

module.exports = wfs;
