/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');

var sourceType = {};
var projectionCode;
var source;

module.exports = function(id, layer) {
    projectionCode = viewer.getProjectionCode();
    source = viewer.getMapSource();
    var serverUrl = source[layer.get('sourceName')].url;
    var type = layer.get('type');
    //returns a promise with features as result
    return sourceType[type](id, layer, serverUrl);
}

sourceType.AGS_FEATURE = function agsFeature(id, layer, serverUrl) {
  var esriSrs = projectionCode.split(':').pop();
  var layerId = layer.get('id');
  var esrijsonFormat = new ol.format.EsriJSON();

  var url = serverUrl + '/' + layerId +
      '/query?f=json&' +
      'returnGeometry=true' +
      '&objectIds=' + id +
      '&geometryType=esriGeometryEnvelope'+
      '&inSR=' + esriSrs +
      '&outFields=*' +
      '&returnIdsOnly=false' +
      '&returnCountOnly=false' +
      '&geometryPrecision=2' +
      '&outSR=' + esriSrs;

  return $.ajax({
        url: url,
        dataType: 'jsonp'
  })
    .then(function(response) {
        if(response.error) {
            fail(response);
            return [];
        }
        else {
            var features = esrijsonFormat.readFeatures(response, {
                    featureProjection: viewer.getProjection()
            });
            return features;
        }
    }, fail
    );
}

sourceType.WFS = function(id, layer, serverUrl) {
  var geometryName = layer.get('geometryName');
  var format = new ol.format.GeoJSON({geometryName: geometryName});
  var url = serverUrl +'?';
  var data = 'service=WFS' +
      '&version=1.0.0' +
      '&request=GetFeature&typeName=' + layer.get('name') +
      '&outputFormat=json' +
      '&featureId=' + id;
  return $.ajax({
    url: url,
    data: data,
    type: 'POST',
    dataType: 'json'
  })
    .then(function(response) {
        return format.readFeatures(response);
    });
}

function fail(response) {
    if(response.error) {
        console.log(response.error.message + '\n' +
            response.error.details.join('\n'));
    }
}
