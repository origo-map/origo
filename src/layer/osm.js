"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var tile = require('./tile');

var osm = function osm(layerOptions) {
  var osmDefault = {};
  var osmOptions = $.extend(osmDefault, layerOptions);

  var osmSource = createSource();
  return tile(osmOptions, osmSource);

  function createSource() {
    return new ol.source.OSM()
  }
}

module.exports = osm;
