"use strict";
var ol = require('openlayers');
var $ = require('jquery');
var verifyFeatureIds = require('./verifyfeatureids');

var topoJson = {};
topoJson.request = function request(layer) {
  var source = layer.get('sourceName');
  var request = createRequest(source);
  return request;

  function createRequest(source) {
    var format = new ol.format.TopoJSON();
    var url = source;

    return $.ajax({
        url: url,
        cache: false
      })
      .then(function(response) {
        var features = format.readFeatures(response);
        features = verifyFeatureIds(features);
        return features;
      });
  }
}

module.exports = topoJson;
