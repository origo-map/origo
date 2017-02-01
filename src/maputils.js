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
  },
  getCenter: function getCenter(geometry) {
      var type = geometry.getType();
      var center;
      switch (type) {
          case "Polygon":
              center = geometry.getInteriorPoint().getCoordinates();
              break;
          case "MultiPolygon":
              center = geometry.getInteriorPoints()[0].getCoordinates();
              break;
          case "Point":
              center = geometry.getCoordinates();
              break;
          case "MultiPoint":
              center = geometry[0].getCoordinates();
              break;
          case "LineString":
              center = geometry.getCoordinateAt(0.5);
              break;
          case "MultiLineString":
              center = geometry.getLineStrings()[0].getCoordinateAt(0.5);
              break;
          case "Circle":
              center = geometry.getCenter();
              break;
      }
      return center;
  },
  scaleToResolution: function scaleToResolution(scale, projection) {
    var dpi = 25.4 / 0.28;
    var mpu = projection.getMetersPerUnit();
    var resolution = scale / (mpu * 39.37 * dpi);
    return resolution;
  }
}
