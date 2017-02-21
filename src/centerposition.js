/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');

var isPanning = false;
var markerId = 'o-centerposition-marker';
var map;
var view;
var consoleId;
var prefix;
var suffix;
var o;

function Init(opt_options) {
  var options = opt_options || {};
  suffix = options.suffix || '';
  prefix = options.prefix || '';
  map = Viewer.getMap();
  view = map.getView();
  consoleId = Viewer.getConsoleId();

  addListener();
  // render();
  // bindUIActions();
}

function renderMarker() {
  var pointStyle = [
    'border: 3px solid rgba(0,0,0,0.8);',
    'border-radius: 50%;'
  ].join(' ');
  var point = utils.createElement('div','', {
    style: pointStyle
  });
  var markerStyle = [
    'background-color: rgba(255,255,255,0.6);',
    'border-radius: 50%;',
    'padding: 10px;'
  ].join(' ');
  var marker = utils.createElement('div', point, {
    id: markerId,
    style: markerStyle
  });
  $('#o-map').append(marker);
}

function bindUIActions() {

}

function addListener() {
  view.on('change:center', onChangeCenter);
  map.on('movestart', onMoveStart);
  map.on('moveend', onMoveEnd);
}

function onChangeCenter() {
  if (isPanning === false) {
    map.dispatchEvent('movestart');
  } else {
    onMoving();
  }
}

function onMoveStart() {
  isPanning = true;
  var center = view.getCenter().map(function(coord) {
    return Math.round(coord);
  });
  renderMarker();
  o = createOverlay(center, document.getElementById(markerId));
  map.addOverlay(o);
}

function onMoveEnd() {
  isPanning = false;
  map.removeOverlay(o);
  $('#' + markerId).remove();
}

function onMoving() {
  var center = view.getCenter().map(function(coord) {
    return Math.round(coord);
  });
  center = prefix + center.join(', ') + suffix;
  $('#' + consoleId).html(center);
  o.setPosition(center);
}

function createOverlay(coord, el) {
  return new ol.Overlay({
    position: coord,
    element: el,
    positioning: 'center-center'
  });
}

module.exports.init = Init;
