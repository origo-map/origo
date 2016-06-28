/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');

var sourceType = {};
var projectionCode = viewer.getProjectionCode();
var source = viewer.getMapSource();

module.exports = function(id, layer) {
    var serverUrl = source[layer.get('sourceName')].url;
    var type = layer.get('type');
    return sourceType[type](id, layer, serverUrl);
}

sourceType.AGS_FEATURE = function agsFeature(id, layer, serverUrl) {
  var esriSrs = projectionCode.split(':').pop();
  var layerId = layer.get('id');
  var esrijsonFormat = new ol.format.EsriJSON();

  var url = serverUrl + layerId +
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
        var features = esrijsonFormat.readFeatures(response, {
                featureProjection: viewer.getProjection()
        });
        if(features.length > 0) {
            return features;
        }
        else {
            console.log('No features returned');
        }
    }, fail
    );
}

function fail(response) {
    if(response.error) {
        alert(response.error.message + '\n' +
            response.error.details.join('\n'));
    }
}
