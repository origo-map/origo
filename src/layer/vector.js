"use strict";

var ol = require('openlayers');
var style = require('../style')();
var viewer = require('../viewer');

module.exports = function vector(options, source) {
  var vectorLayer;
  switch (options.layerType) {
    case 'vector':
      options.source = source;
      options.style = style.createStyle(options.style);
      vectorLayer = new ol.layer.Vector(options);
      break;
    case 'cluster':
      options.clusterOptions = options.clusterOptions || {};
      if(options.type === 'WFS' || options.type === 'AGS_FEATURE'){
        source.clusterOptions = viewer.getMapSource()[options.sourceName].clusterOptions || {};
      } else {
        source.clusterOptions = {};
      }
      var distance = 60;
      var clusterDistance = options.clusterOptions.clusterDistance || source.clusterOptions.clusterDistance || viewer.getClusterOptions().clusterDistance || distance;
      var clusterMaxZoom = options.clusterOptions.clusterMaxZoom || source.clusterOptions.clusterMaxZoom || viewer.getClusterOptions().clusterMaxZoom || viewer.getResolutions().length-1;
      var clusterInitialDistance = viewer.getSettings().zoom > clusterMaxZoom ? 0 : clusterDistance;
      var map = viewer.getMap();
      var view = map.getView();
      var maxZoom = view.getResolutions().length-1;
      options.source = new ol.source.Cluster({
        attributions: options.attribution,
        source: source,
        distance: clusterInitialDistance
      });
      options.source.setProperties({
        clusterDistance : clusterDistance,
        clusterMaxZoom : clusterMaxZoom
      });
      options.style = style.createStyle(options.style, options.clusterStyle);
      vectorLayer = new ol.layer.Vector(options);
      map.on('movestart', onMoveStart);

      function onMoveStart(evt) {
        var mapZoom = view.getZoomForResolution(evt.frameState.viewState.resolution);
        var clusterDistance = options.source.getProperties().clusterDistance || distance;
        var clusterMaxZoom = options.source.getProperties().clusterMaxZoom || maxZoom;
        map.once('moveend', function(evt) {
          var currentZoom = parseInt(view.getZoom(), 10);
          if (currentZoom !== mapZoom) {
            if (currentZoom >= clusterMaxZoom) {
              options.source.setDistance(0);
            } else if (currentZoom < clusterMaxZoom) {
              options.source.setDistance(clusterDistance);
            }
          }
        })
      }
      break;
    case 'image':
      options.source = new ol.source.ImageVector({
        source: source,
        style: style.createStyle(options.style)
      });
      vectorLayer = new ol.layer.Image(options);
      break;
    case 'vectortile':
      options.source = source;
      options.style = style.createStyle(options.style);
      vectorLayer = new ol.layer.VectorTile(options);
      break;
  }
  return vectorLayer;
}
