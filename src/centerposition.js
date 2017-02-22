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
var resultId = 'o-centerposition-result';
var toggleId = 'o-centerposition-toggle';
var coordsId = 'o-centerposition-coords';
var map;
var view;
var consoleId;
var prefix;
var suffix;
var overlay;

function Init(opt_options) {
  var options = opt_options || {};
  suffix = options.suffix || '';
  prefix = options.prefix || '';
  map = Viewer.getMap();
  view = map.getView();
  consoleId = Viewer.getConsoleId();

  addListener();
  render();
  // bindUIActions();
}

function render() {
  var buttonStyle = [
    'background-color: #000;',
    'color: #fff;',
    'font-size: 10px;',
    'padding: 5px 8px;',
    'border-radius: 10px;',
    'display: inline-block;',
    '"Helvetica Neue",sans-serif'
  ].join(' ');
  var toggleButton = utils.createElement('button', prefix, {
    id: toggleId,
    style: buttonStyle,
    value: prefix
  });
  var coordsDiv = utils.createElement('div', '', {
    id: coordsId,
    style: 'display: inline-block; padding-left: 5px;'
  });
  var resultContainer = utils.createElement('div', toggleButton + coordsDiv, {
    id: resultId,
    style: 'display: inline-block'
  });
  $('#' + consoleId).append(resultContainer);
}

function renderMarker() {
  var markerStyle = [
    'background-color: rgba(255,255,255,0.4);',
    'border-radius: 50%;',
    'font-size: 1rem;',
    'line-height: 2rem;',
    'width: 2rem;',
    'height: 2rem;',
    'text-align: center;'
  ].join(' ');
  var marker = utils.createElement('div', '+', {
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
  renderMarker();
  overlay = createOverlay(getCenter(), document.getElementById(markerId));
  map.addOverlay(overlay);
}

function onMoveEnd() {
  isPanning = false;
  map.removeOverlay(overlay);
  $('#' + markerId).remove();
}

function onMoving() {
  var coord = getCenter();
  var center = coord.join(', ') + suffix;
  $('#' + coordsId).html(center);
  overlay.setPosition(coord);
}

function createOverlay(coord, el) {
  return new ol.Overlay({
    position: coord,
    element: el,
    positioning: 'center-center'
  });
}

function getCenter() {
  return view.getCenter().map(function(coord) {
    return Math.round(coord);
  });
}

module.exports.init = Init;
