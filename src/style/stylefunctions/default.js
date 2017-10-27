var ol = require('openlayers');
var getColor = require('../getcolor');

module.exports = function defaultStyle(params) {
  var fill = new ol.style.Fill({
    color: ''
  });
  var stroke = new ol.style.Stroke({
    color: '',
    width: 0.1,
    lineCap: 'square',
    lineJoin: 'round'
  });
  var noStroke = new ol.style.Stroke({
    color: '',
    width: 0.0
  });
  var overlayedStroke = new ol.style.Stroke({
    color: '',
    width: 0.1,
    lineCap: 'square',
    lineJoin: 'round'
  });
  var dashedStroke = new ol.style.Stroke({
    color: '',
    width: 1,
    lineDash: [1, 2]
  });
  var polygon = new ol.style.Style({
    fill: fill,
    zIndex: 1
  });
  var strokedPolygon = new ol.style.Style({
    fill: fill,
    stroke: stroke,
    zIndex: 2
  });
  var dashedPolygon = new ol.style.Style({
    fill: fill,
    stroke: dashedStroke,
    zIndex: 2
  });
  var line = new ol.style.Style({
    stroke: stroke,
    zIndex: 10
  });
  var overlayedLine = new ol.style.Style({
    stroke: overlayedStroke,
    zIndex: 11
  });
  var dashedLine = new ol.style.Style({
    stroke: dashedStroke,
    zIndex: 12
  });
  var point = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      fill: fill,
      stroke: stroke
    }),
    zIndex: 50
  });
  var styles = [];

  return function(feature, resolution) {
    polygon.setZIndex(1);
    line.setZIndex(10);
    var length = 0;
    var geom = feature.getGeometry().getType();
    switch (geom) {
      case 'Polygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length++] = strokedPolygon;
        break;
      case 'MultiPolygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length++] = strokedPolygon;
        break;
      case 'LineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(1);
        styles[length++] = line;
        break;
      case 'MultiLineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(1);
        styles[length++] = line;
        break;
      case 'Point':
        stroke.setColor(getColor('yellow'));
        stroke.setWidth(1);
        fill.setColor(getColor('yellow', 0.8));
        styles[length++] = point;
        break;
      case 'MultiPoint':
        stroke.setColor(getColor('yellow'));
        stroke.setWidth(1);
        fill.setColor(getColor('yellow', 0.8));
        styles[length++] = point;
        break;
      default:
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length++] = strokedPolygon;
        break;
    }
    styles.length = length;
    return styles;
  };
};
