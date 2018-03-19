"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('../viewer');
var wgs84Sphere = new ol.Sphere(6378137);
var map;
var vector;
var interaction;
var target = '.o-map';
var transform = require('./transformprint');
var polygonFeature = new ol.Feature(
  new ol.geom.Polygon([[[1499876.032897, 8295720.234419], [1498891.906158, 8295720.234419],
  [1498844.133015, 8296981.445385], [1500363.318953, 8296952.781500]]]));


function printA1() {

  map = Viewer.getMap();
  var style = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: [0, 153, 255, 1]
      }),
      stroke: new ol.style.Stroke({
        color: [255, 255, 255, 0.75],
        width: 1.5
      })
    }),
    zIndex: 100000
  });

  vector = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [polygonFeature],
      name: 'printarea',
      visible: false,
      zIndex: 7
    }),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.7)',
        width: 2
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255, 145, 20, 0.4)'
      })
    })
  });
 
  map.addLayer(vector);
  
  return vector;
};

function getVector() {
  return vector;
}

function addPreview(scale, paper) {
  vector = getVector();
  var extent = vector.getSource().getFeatures()[0].getGeometry().getExtent();
  var center =  ol.extent.getCenter(extent);
  var dpi = 300//25.4 / 0.28
    , ipu = 39.37
    , sf = 1
    , w = (paper.width / dpi / ipu * scale / 2) * sf
    , y = (paper.height / dpi / ipu * scale / 2) * sf
    , coords = [
      [
        [center[0] - w, center[1] - y],
        [center[0] - w, center[1] + y],
        [center[0] + w, center[1] + y],
        [center[0] + w, center[1] - y],
        [center[0] - w, center[1] - y]
      ]
    ]
    , feature = new ol.Feature({
      geometry: new ol.geom.Polygon(coords)
    })
    ;

  
  vector.getSource().clear();
  vector.set('polygonFeature', feature);
  vector.getSource().addFeature(feature);
  var translate = new ol.interaction.Translate({
    features: new ol.Collection([feature])
  });
  map.addInteraction(translate);

}

module.exports.printA1 = printA1;
module.exports.getVector = getVector;
module.exports.addPreview = addPreview;



