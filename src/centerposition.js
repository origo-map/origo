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
var title = undefined;
var suffix = undefined;
var defaultProjection = undefined;
var projections = undefined;
var projectionCodes = undefined;
var projection = undefined;

function Init(opt_options) {
  var options = opt_options || {};
  suffix = options.suffix || '';
  title = options.title || '';
  map = Viewer.getMap();
  view = map.getView();
  projection = view.getProjection();
  consoleId = Viewer.getConsoleId();
  projections = options.projections || {};
  defaultProjection = Viewer.getProjectionCode();
  projectionCodes = Object.getOwnPropertyNames(projections);
  projections[defaultProjection] = title;

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
    'padding: 5px 15px;',
    'border-radius: 10px;',
    'display: inline-block;',
    'font-family: Arial, \'Helvetica Neue\', sans-serif;'
  ].join(' ');
  var toggleButton = utils.createElement('button', title, {
    id: toggleId,
    style: buttonStyle,
    value: defaultProjection
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
    var proj = toggleProjectionVal(this.value);
    updateResult(proj);
    onChangeCenter();
    this.blur();
    e.preventDefault();
  });
}

function renderMarker() {
  var markerStyle = [
    'background-color: rgba(255,255,255,0.4);',
    'border-radius: 50%;',
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
  if (projectionCodes.length) {
    index = projectionCodes.indexOf(val);
    if (index === -1) {
      proj = projectionCodes[0];
    } else if (index === projectionCodes.length -1) {
      proj = defaultProjection;
    } else if (index < projectionCodes.length -1) {
      proj = projectionCodes[index + 1];
    }
    return proj;
  } else {
    return val;
  }
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
  var proj = $('#' + toggleId).val();
  updateCoords(proj, view.getCenter());
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

function updateResult(proj) {
  $('#' + toggleId).val(proj);
  $('#' + toggleId).text(projections[proj]);
  updateCoords(proj, view.getCenter());
}

function updateCoords(proj, sourceCoords) {
  var coords = sourceCoords;
  var geometry;
  var center;
  if (proj !== defaultProjection) {
    geometry = new ol.Feature({
      geometry: new ol.geom.Point(coords)
    }).getGeometry();
    coords = geometry.transform(projection, proj).getCoordinates();
  }
  if (proj === 'EPSG:4326') {
    coords = round(coords, 5);
  } else {
    coords = round(coords);
  }
  center = coords.join(', ') + suffix;
  $('#' + coordsId).html(center);
}

module.exports.init = Init;
