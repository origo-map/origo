/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var vector = require('./vector');

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
  sourceOptions.tileGrid = viewer.getTileGrid();

  var vectortileSource = createSource(sourceOptions, vectortileOptions);
  return vector(vectortileOptions, vectortileSource);

  function createSource(options, vectortileOptions) {
	  var format;
	  switch(vectortileOptions.format) {
			case 'topojson':
			format = new ol.format.TopoJSON({defaultDataProjection: options.projection, featureProjection: options.projection, geometryName:'geom', featureClass: ol.render.Feature});
		break;
			case 'geojson':
			format = new ol.format.GeoJSON({defaultDataProjection: options.projection, featureProjection: options.projection, geometryName:'geom', featureClass: ol.render.Feature});
		break;
			case 'pbf':
			format = new ol.format.MVT({featureClass: ol.render.Feature});
		break;
	  }
	options.url += vectortileOptions.layerName + '@'  + vectortileOptions.gridset + '@' + vectortileOptions.format + '/{z}/{x}/{-y}.'+ vectortileOptions.format;
	options.format = format;
    return new ol.source.VectorTile(options);
  }
}

module.exports = vectortile;