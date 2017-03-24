/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');

var agsFeature = function agsFeature(layerOptions) {
  var agsDefault = {
    layerType: 'vector'
  };
  var sourceDefault = {};
  var agsOptions = $.extend(agsDefault, layerOptions);
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.geometryName = agsOptions.geometryName;
  sourceOptions.filter = agsOptions.filter;
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.id = agsOptions.id;

  var agsSource = createSource(sourceOptions);
  return vector(agsOptions, agsSource);

  function createSource(options) {
    var vectorSource = null;
    var esriSrs = options.projectionCode.split(':').pop();
    var queryFilter = options.filter ? '&where=' + options.filter : '';
    var esrijsonFormat = new ol.format.EsriJSON();
    vectorSource = new ol.source.Vector({
      attributions: options.attribution,
      loader: function(extent, resolution, projection) {
        var that = this;
        var url = options.url + options.id +
          encodeURI('/query?f=json&' +
            'returnGeometry=true' +
            '&spatialRel=esriSpatialRelIntersects' +
            '&geometry=' + '{"xmin":' + extent[0] + ',"ymin":' +
              extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
              ',"spatialReference":{"wkid":' + esriSrs + '}}' +
            '&geometryType=esriGeometryEnvelope' +
            '&inSR=' + esriSrs + '&outFields=*' + '' +
            '&returnIdsOnly=false&returnCountOnly=false' +
            '&geometryPrecision=2' +
            '&outSR=' + esriSrs + queryFilter);
        $.ajax({
          url: url,
          dataType: 'jsonp',
          success: function(response) {
            if (response.error) {
              alert(response.error.message + '\n' +
                response.error.details.join('\n'));
            } else {

              // dataProjection will be read from document
              var features = esrijsonFormat.readFeatures(response, {
                featureProjection: projection
              });
              if (features.length > 0) {
                that.addFeatures(features);
              }
            }
          }
        });
      },
      strategy: ol.loadingstrategy.bbox
    });
    return vectorSource;
  }
}

module.exports = agsFeature;
