"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');
var maputils = require('../maputils');

var vectortile = function vectortile(layerOptions) {
  var vectortileDefault = {
    layerType: 'vectortile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var vectortileOptions = $.extend(vectortileDefault, layerOptions);
  vectortileOptions.sourceName = vectortileOptions.name;
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = vectortileOptions.attribution;
  sourceOptions.projection = viewer.getProjectionCode() || 'EPSG:3857';
  if(sourceOptions.tileGrid){
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();
  }
  
  var vectortileSource = createSource(sourceOptions, vectortileOptions);
  return vector(vectortileOptions, vectortileSource);
}

function createSource(options, vectortileOptions) {
  var format;
  switch(vectortileOptions.format) {
    case 'topojson':
    format = new ol.format.TopoJSON();
    break;
    case 'geojson':
    format = new ol.format.GeoJSON();
    break;
    case 'pbf':
    format = new ol.format.MVT();
    break;
  }
  if(vectortileOptions.layerURL){
    options.url += vectortileOptions.layerURL;
  }
  else {
    options.url += vectortileOptions.layerName + '@'  + vectortileOptions.gridset + '@' + vectortileOptions.format + '/{z}/{x}/{-y}.'+ vectortileOptions.format;
  }
  options.format = format;
  return new ol.source.VectorTile(options);
}

module.exports = vectortile;