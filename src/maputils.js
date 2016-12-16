/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');

module.exports = {
  customProjection: function(projectionCode, extent) {
      return new ol.proj.Projection({
          code: projectionCode,
          extent: extent
      });
  },
  tileGrid: function(extent, resolutions) {
      var origin = ol.extent.getTopLeft(extent);
      return new ol.tilegrid.TileGrid({
          extent: extent,
          origin: origin,
          resolutions: resolutions
      });
  },
  checkZoomChange: function checkZoomChange(resolution, currentResolution) {
      if(resolution !== currentResolution) {
        return true;
      }
      else {
        return false;
      }
  },
  createPointFeature: function createPointFeature(coordinate, style) {
      var feature = new ol.Feature({
          geometry: new ol.geom.Point(coordinate)
      });
      feature.setStyle(style);
      return feature;
  },
  geojsonToFeature: function geojsonToFeature(obj) {
      var vectorSource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(obj)
      });
      return vectorSource.getFeatures()[0];
  },
  wktToFeature: function wktToFeature(wkt, srsName) {
      var format = new ol.format.WKT();
      var feature = format.readFeature(wkt, {
        dataProjection: srsName,
        featureProjection: srsName
      });
      return feature;
  },
  zoomToExent: function zoomToExent(geometry, level) {
      var map = viewer.getMap();
      var view = map.getView();
      var maxZoom = level;
      var extent = geometry.getExtent();
      if(extent) {
          view.fit(extent, map.getSize(), {maxZoom: maxZoom});
          return extent;
      }
      else {
        return undefined;
      }
  }
}
