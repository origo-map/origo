/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var modal = require('../modal');
var dispatcher = require('./drawdispatcher');
var featureLayer = require('../featureLayer');
var defaultDrawStyle = require('./drawstyle');
var textForm = require('./textform');
var style = require('../style')();

var map = undefined;
var drawLayer = undefined;
var draw = undefined;
var activeTool = undefined;
var select = undefined;
var modify = undefined;
var annotationField = undefined;
var promptTitle = undefined;
var placeholderText = undefined;

module.exports = function(opt_options) {
  var options = opt_options || {};
  var drawStyle = style.createStyleRule(defaultDrawStyle.draw);
  var selectStyle = style.createStyleRule(defaultDrawStyle.select);
  map = viewer.getMap();

  annotationField = options.annonation || 'annonation';
  promptTitle = options.promptTitle || 'Ange text';
  placeholderText = options.placeholderText || 'Text som visas i kartan';
  drawLayer = featureLayer(undefined, map).getFeatureLayer();
  drawLayer.setStyle(drawStyle);
  activeTool = undefined;
  select = new ol.interaction.Select({
    layers: [drawLayer],
    style: selectStyle
  });
  modify = new ol.interaction.Modify({
    features: select.getFeatures()
  });
  map.addInteraction(select);
  map.addInteraction(modify);
  select.getFeatures().on('add', onSelectAdd, this);
  setActive();
  $(document).on('toggleDraw', toggleDraw);
}

function setDraw(drawType) {
  var geometryType = drawType;
  activeTool = drawType;
  if (activeTool === 'Text') {
    geometryType = 'Point';
  }
  draw = new ol.interaction.Draw({
    source: drawLayer.getSource(),
    'type': geometryType
  });
  map.addInteraction(draw);
  dispatcher.emitChangeDraw(drawType, true);
  draw.on('drawend', onDrawEnd, this);
}

function isActive() {
  if (modify === undefined || select === undefined) {
    return false;
  } else {
    return true;
  }
}

function onDeleteSelected() {
  var features = select.getFeatures();
  var source;
  if (features.getLength()) {
    source = drawLayer.getSource();
    features.forEach(function(feature) {
      source.removeFeature(feature);
    });
    select.getFeatures().clear();
  }
}

function onSelectAdd(e) {
  var feature;
  if (e.target) {
    feature = e.target.item(0);
    if (feature.get(annotationField)) {
      promptText(feature);
    }
  }
}

function onDrawEnd(evt) {
  if (activeTool === 'Text') {
    promptText(evt.feature);
  } else {
    setActive();
    activeTool = undefined;
    dispatcher.emitChangeDraw(evt.feature.getGeometry().getType(), false);
  }
}

function promptText(feature) {
  var content = textForm({
    value: feature.get(annotationField) || '',
    placeHolder: placeholderText
  });
  modal.createModal('#o-map', {title: promptTitle, content: content});
  modal.showModal();
  $('#o-draw-save-text').on('click', function(e) {
    var textVal = $('#o-draw-input-text').val();
    modal.closeModal();
    $('#o-draw-save-text').blur();
    e.preventDefault();
    onTextEnd(feature, textVal);
  });
}

function onTextEnd(feature, textVal) {
  var text = defaultDrawStyle.text;
  text.text.text = textVal;
  var textStyle = style.createStyleRule([text]);
  feature.setStyle(textStyle);
  feature.set(annotationField, textVal);
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('Text', false);
}

function cancelDraw() {
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('cancel', false);
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    modify = undefined;
    select = undefined;
    draw = undefined;
  }
}

function toggleDraw(e) {
  e.stopPropagation();
  if (e.tool === 'delete') {
      onDeleteSelected();
  } else if (e.tool === 'cancel') {
      removeInteractions();
  } else if (e.tool === activeTool) {
    cancelDraw();
  } else if (e.tool === 'Polygon' || e.tool === 'LineString' || e.tool === 'Point' || e.tool === 'Text') {
    if (activeTool) {
      cancelDraw();
    }
    setActive('draw');
    setDraw(e.tool);
  }
}

function setActive(drawType) {
  switch (drawType) {
    case 'draw':
      select.getFeatures().clear();
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      activeTool = undefined;
      map.removeInteraction(draw);
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}
