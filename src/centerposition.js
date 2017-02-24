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
var map = undefined;
var view = undefined;
var consoleId = undefined;
var suffix = undefined;
var currentProjection = undefined;
var projections = undefined;
var projectionCodes = undefined;
var projection = undefined;
var mapProjection = undefined;

function Init(opt_options) {
  var options = opt_options || {};
  var title = options.title || undefined;
  suffix = options.suffix || '';
  map = Viewer.getMap();
  view = map.getView();
  projection = view.getProjection();
  mapProjection = Viewer.getProjectionCode();
  consoleId = Viewer.getConsoleId();
  projections = options.projections || {};
  projectionCodes = Object.getOwnPropertyNames(projections);
  if (title) {
    currentProjection = mapProjection;
    projections[currentProjection] = title;
    projectionCodes.unshift(mapProjection);
  } else if (projectionCodes.length) {
    currentProjection = projectionCodes[0];
  } else {
    alert('No title or projection is set for centerposition');
  }

  addListener();
  render();
  bindUIActions();
}

function render() {
  var buttonStyle = [
    'background-color: #000;',
    'color: #fff;',
    'font-size: 10px;',
    'line-height: 10px;',
    'min-width: 110px;',
    'padding: 5px;',
    'border-radius: 10px;',
    'display: inline-block;',
    'font-family: Arial, \'Helvetica Neue\', sans-serif;'
  ].join(' ');
  var toggleButton = utils.createElement('button', projections[currentProjection], {
    id: toggleId,
    style: buttonStyle,
    value: currentProjection
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

function bindUIActions() {
  $('#' + toggleId).on('click', function(e) {
    currentProjection = toggleProjectionVal(this.value);
    updateResult(currentProjection);
    onChangeCenter();
    this.blur();
    e.preventDefault();
  });
}

function renderMarker() {
  var markerStyle = [
    'background-color: rgba(255,255,255,0.4);',
    'border-radius: 50%;',
    'cursor: default;',
    'font-size: 1rem;',
    'line-height: 2rem;',
    'width: 2rem;',
    'height: 2rem;',
    'text-align: center;',
    'top: 50%;',
    'left: 50%;',
    'margin-top: -1rem;',
    'margin-left: -1rem;',
    'z-index: 10000;',
    'position: absolute;',
  ].join(' ');
  var marker = utils.createElement('div', '+', {
    id: markerId,
    style: markerStyle
  });
  $('#o-map').append(marker);
}

function addListener() {
  view.on('change:center', onChangeCenter);
  map.on('movestart', onMoveStart);
}

function toggleProjectionVal(val) {
  var index;
  var proj = undefined;
  index = projectionCodes.indexOf(val);
  if (index === projectionCodes.length - 1) {
    proj = projectionCodes[0];
  } else if (index < projectionCodes.length - 1) {
    proj = projectionCodes[index + 1];
  }
  return proj;
}

function onChangeCenter() {
  if (isPanning === false) {
    map.dispatchEvent('movestart');
    map.on('moveend', onMoveEnd);
  } else {
    onMoving();
  }
}

function onMoveStart() {
  isPanning = true;
  renderMarker();
}

function onMoveEnd() {
  isPanning = false;
  $('#' + markerId).remove();
  map.un('moveend', onMoveEnd);
}

function onMoving() {
  updateCoords(view.getCenter());
}

function round(coords, decimals) {
  if (decimals) {
    return coords.map(function(coord) {
      return coord.toFixed(decimals);
    });
  } else {
    return coords.map(function(coord) {
      return Math.round(coord);
    });
  }
}

function updateResult() {
  $('#' + toggleId).val(currentProjection);
  $('#' + toggleId).text(projections[currentProjection]);
  updateCoords(view.getCenter());
}

function updateCoords(sourceCoords) {
  var coords = sourceCoords;
  var geometry;
  var center;
  if (currentProjection !== mapProjection) {
    geometry = new ol.Feature({
      geometry: new ol.geom.Point(coords)
    }).getGeometry();
    coords = geometry.transform(projection, currentProjection).getCoordinates();
  }
  if (currentProjection === 'EPSG:4326') {
    coords = round(coords, 5);
  } else {
    coords = round(coords);
  }
  center = coords.join(', ') + suffix;
  $('#' + coordsId).html(center);
}

module.exports.init = Init;
