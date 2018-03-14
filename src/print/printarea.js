"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('../viewer');
var wgs84Sphere = new ol.Sphere(6378137);
var map;
var vector;
var interaction;
var target = '.o-map';
var polygonFeature = new ol.Feature(
    new ol.geom.Polygon([[[1499876.032897,  8295720.234419], [1498891.906158, 8295720.234419],
      [1498844.133015, 8296981.445385], [1500363.318953, 8296952.781500]]]));    
    

function printA1(){
    
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
                width: 3,
                color: [255, 0, 0, 1]
              }),
              fill: new ol.style.Fill({
                color: [0, 0, 255, 0.6]
              })
          })
    });   

 
    var translate = new ol.interaction.Translate({
        features: new ol.Collection([polygonFeature])
    });
    map.addLayer(vector);
    map.addInteraction(translate);
    return vector;
};

function getVector() {
  return vector;
}

module.exports.printA1 = printA1;
module.exports.getVector = getVector;



