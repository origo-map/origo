var ol = require('openlayers');

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
  var text = new ol.style.Style({
    text: new ol.style.Text({
      text: '',
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
    var layer = feature.get('layer');
    var geom = feature.getGeometry().getType();
    switch (layer) {
      case 'Layer1':
        stroke.setColor('rgba(0,0,0,1)');
        stroke.setWidth(1);
        fill.setColor('rgba(0,0,0,1)');
        styles[length++] = strokedPolygon;
        break;
      case 'Layer2':
        stroke.setColor('rgba(255,0,0,1)');
        stroke.setWidth(1);
        styles[length++] = line;
        break;
      default:
        text.getText().setText(layer);
        text.getText().setFont('10px sans-serif');
        styles[length++] = text;
        break;
    }
    styles.length = length;
    return styles;
  };
};
