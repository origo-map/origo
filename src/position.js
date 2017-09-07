"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var controlId = 'o-position';
var markerId = 'o-position-marker';
var toggleProjId = 'o-position-toggle-proj';
var coordsId = 'o-position-coords';
var coordsFindId = 'o-position-find';
var togglePositionId = 'o-toggle-position';
var characterError = 'Ogiltigt tecken för koordinat, vänligen försök igen.';
var extentError = 'Angivna koordinater ligger inte inom kartans utsträckning, vänligen försök igen.';
var map = undefined;
var view = undefined;
var consoleId = undefined;
var suffix = undefined;
var currentProjection = undefined;
var projections = undefined;
var projectionCodes = undefined;
var projection = undefined;
var mapProjection = undefined;
var precision = undefined;
var mousePositionActive = false;
var mousePositionControl;

function Init(opt_options) {
  var options = opt_options || {};
  var title = options.title || undefined;
  suffix = options.suffix || '';
  map = viewer.getMap();
  view = map.getView();
  projection = view.getProjection();
  mapProjection = viewer.getProjectionCode();
  consoleId = viewer.getConsoleId();
  projections = options.projections || {};
  projectionCodes = Object.getOwnPropertyNames(projections);
  if (title) {
    currentProjection = mapProjection;
    projections[currentProjection] = title;
    projectionCodes.unshift(mapProjection);
  } else if (projectionCodes.length) {
    currentProjection = projectionCodes[0];
  } else {
    alert('No title or projection is set for position');
  }
  setPrecision();

  render();
  bindUIActions();

  addMousePosition();
}

function render() {
  var icon = utils.createSvg({
    href: '#o_centerposition_24px',
    cls: 'o-icon-position'
  });
  var toggleButtons = utils.createElement('button', icon, {
    cls: 'o-position-center-button',
    id: togglePositionId
  });
  toggleButtons += utils.createElement('button', projections[currentProjection], {
    id: toggleProjId,
    cls: 'o-position-button',
    value: currentProjection
  });
  var coordsDiv = utils.createElement('div', '', {
    id: coordsId,
    cls: coordsId,
    style: 'padding-left: 5px;'
  });
  var coordsFind = utils.createElement('input', '', {
    id: coordsFindId,
    cls: coordsFindId,
    type: 'text',
    name: coordsFindId,
    style: 'padding-left: 5px;'
  });
  var controlContainer = utils.createElement('div', toggleButtons + coordsDiv + coordsFind, {
    id: controlId,
    cls: controlId,
    style: 'display: inline-block;'
  });
  $('#' + consoleId).append(controlContainer);
}

function bindUIActions() {
  $('#' + toggleProjId).on('click', onToggleProjection);
  $('#' + togglePositionId).on('click', onTogglePosition);
}

function addMousePosition() {
  mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(precision),
    projection: currentProjection,
    target: document.getElementById(coordsId),
    undefinedHTML: '&nbsp;'
  });
  map.addControl(mousePositionControl);
  mousePositionActive = true;
  $('#' + coordsId).addClass('o-active');
}

function removeMousePosition() {
  map.removeControl(mousePositionControl);
  $('#' + coordsId).removeClass('o-active');
  mousePositionActive = false;
}

function addCenterPosition() {
  renderMarker();
  $('#' + togglePositionId).addClass('o-active');
  $('#' + coordsFindId).addClass('o-active');
  updateCoords(view.getCenter());
  view.on('change:center', onChangeCenter);
  $('#' + coordsFindId).on('keypress', onFind);
}

function removeCenterPosition() {
  view.un('change:center', onChangeCenter);
  clear();
  $('#' + coordsFindId).off('keypress', onFind);
  $('#' + markerId).remove();
  $('#' + togglePositionId).removeClass('o-active');
  $('#' + coordsFindId).removeClass('o-active');
}

function renderMarker() {
  var icon = utils.createSvg({
    href: '#o_centerposition_24px',
    cls: 'o-icon-position-marker'
  });
  var marker = utils.createElement('div', icon, {
    id: markerId,
    cls: markerId
  });
  $('#o-map').append(marker);
}

function findCoordinate() {
  var coords = $('#' + coordsFindId).val();
  var validated = validateCoordinate(coords);
  if (validated.length === 2) {
    map.getView().animate({
      center: validated,
      zoom: (viewer.getResolutions().length - 3)
    });
  }
}

function validateCoordinate(strCoords) {
  var extent = viewer.getExtent() || view.getProjection().getExtent();
  var inExtent;

  //validate numbers
  var coords = strCoords.split(',').map(function(coord) {
      return parseFloat(coord);
    })
    .filter(function(coord) {
      if (coord !== NaN) {
        return coord;
      }
    });
  if (coords.length !== 2) {
    alert(characterError);
    return [];
  }

  // transform
  if (currentProjection !== mapProjection) {
    coords = transformCoords(coords, currentProjection, mapProjection);
  }

  // validate coords within extent
  inExtent = coords[0] >= extent[0] && coords[1] >= extent[1];
  inExtent = inExtent && (coords[0] <= extent[2]) && (coords[1] <= extent[3]);
  if (inExtent) {
    return coords;
  } else {
    alert(extentError);
    return [];
  }
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

function clear() {
  writeCoords('');
}

function onTogglePosition() {
  if (mousePositionActive) {
    removeMousePosition();
    addCenterPosition();
  } else {
    addMousePosition();    
    removeCenterPosition();
  }
}

function onToggleProjection(e) {
  return function(event) {
    currentProjection = toggleProjectionVal(this.value);
    setPrecision();
    writeProjection(currentProjection);
    if (mousePositionActive) {
      removeMousePosition();
      addMousePosition();
    } else {
      updateCoords(view.getCenter());
    }
    this.blur();
    event.preventDefault();
  }.bind(this)(e);
}

function onChangeCenter() {
  updateCoords(view.getCenter());
}

function onFind(e) {
  if (e.which === 13) {
    findCoordinate();
  }
}

function round(coords) {
  if (precision) {
    return coords.map(function(coord) {
      return coord.toFixed(precision);
    });
  } else {
    return coords.map(function(coord) {
      return Math.round(coord);
    });
  }
}

function setPrecision() {
  if (currentProjection === 'EPSG:4326') {
    precision = 5;
  } else {
    precision = 0;
  }
}

function writeProjection() {
  $('#' + toggleProjId).val(currentProjection);
  $('#' + toggleProjId).text(projections[currentProjection]);
}

function transformCoords(coords, source, destination) {
  var geometry = new ol.Feature({
    geometry: new ol.geom.Point(coords)
  }).getGeometry();
  return geometry.transform(source, destination).getCoordinates();
}

function updateCoords(sourceCoords) {
  var coords = sourceCoords;
  var center;
  if (currentProjection !== mapProjection) {
    coords = transformCoords(coords, projection, currentProjection);
  }
  coords = round(coords);
  center = coords.join(', ') + suffix;
  writeCoords(center);
}

function writeCoords(coords) {
  $('#' + coordsFindId).val(coords);
}

module.exports.init = Init;
