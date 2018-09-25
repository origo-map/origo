import MousePosition from 'ol/control/mouseposition';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import coordinate from 'ol/coordinate';
import $ from 'jquery';
import viewer from '../viewer';
import utils from '../utils';

const controlId = 'o-position';
const markerId = 'o-position-marker';
const toggleProjId = 'o-position-toggle-proj';
const coordsId = 'o-position-coords';
const coordsFindId = 'o-position-find';
const togglePositionId = 'o-toggle-position';
const characterError = 'Ogiltigt tecken för koordinat, vänligen försök igen.';
const extentError = 'Angivna koordinater ligger inte inom kartans utsträckning, vänligen försök igen.';
let map;
let view;
let consoleId;
let suffix;
let currentProjection;
let projections;
let projectionCodes;
let projection;
let mapProjection;
let precision;
let mousePositionActive;
let mousePositionControl;

function render() {
  const icon = utils.createSvg({
    href: '#o_centerposition_24px',
    cls: 'o-icon-position'
  });
  let toggleButtons = utils.createElement('button', icon, {
    cls: 'o-position-center-button',
    id: togglePositionId
  });
  toggleButtons += utils.createElement('button', projections[currentProjection], {
    id: toggleProjId,
    cls: 'o-position-button',
    value: currentProjection
  });
  const coordsDiv = utils.createElement('div', '', {
    id: coordsId,
    cls: coordsId,
    style: 'padding-left: 5px;'
  });
  const coordsFind = utils.createElement('input', '', {
    id: coordsFindId,
    cls: coordsFindId,
    type: 'text',
    name: coordsFindId,
    style: 'padding-left: 5px;'
  });
  const controlContainer = utils.createElement('div', toggleButtons + coordsDiv + coordsFind, {
    id: controlId,
    cls: controlId,
    style: 'display: inline-block;'
  });
  $(`#${consoleId}`).append(controlContainer);
}

function addMousePosition() {
  mousePositionControl = new MousePosition({
    coordinateFormat: coordinate.createStringXY(precision),
    projection: currentProjection,
    target: document.getElementById(coordsId),
    undefinedHTML: '&nbsp;'
  });
  map.addControl(mousePositionControl);
  mousePositionActive = true;
  $(`#${coordsId}`).addClass('o-active');
}

function removeMousePosition() {
  map.removeControl(mousePositionControl);
  $(`#${coordsId}`).removeClass('o-active');
  mousePositionActive = false;
}

function renderMarker() {
  const icon = utils.createSvg({
    href: '#o_centerposition_24px',
    cls: 'o-icon-position-marker'
  });
  const marker = utils.createElement('div', icon, {
    id: markerId,
    cls: markerId
  });
  $('#o-map').append(marker);
}

function writeCoords(coords) {
  $(`#${coordsFindId}`).val(coords);
}

function transformCoords(coords, source, destination) {
  const geometry = new Feature({
    geometry: new Point(coords)
  }).getGeometry();
  return geometry.transform(source, destination).getCoordinates();
}

function round(coords) {
  if (precision) {
    return coords.map(coord => coord.toFixed(precision));
  }
  return coords.map(coord => Math.round(coord));
}

function updateCoords(sourceCoords) {
  let coords = sourceCoords;
  if (currentProjection !== mapProjection) {
    coords = transformCoords(coords, projection, currentProjection);
  }
  coords = round(coords);
  const center = coords.join(', ') + suffix;
  writeCoords(center);
}

function onChangeCenter() {
  updateCoords(view.getCenter());
}

function validateCoordinate(strCoords) {
  const extent = viewer.getExtent() || view.getProjection().getExtent();
  let inExtent;

  // validate numbers
  let coords = strCoords.split(',').map(coord => parseFloat(coord))
    .filter((coord) => {
      if (Number.isNaN(coord)) {
        return coord;
      }
      return null;
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
  }
  alert(extentError);
  return [];
}

function findCoordinate() {
  const coords = $(`#${coordsFindId}`).val();
  const validated = validateCoordinate(coords);
  if (validated.length === 2) {
    map.getView().animate({
      center: validated,
      zoom: (viewer.getResolutions().length - 3)
    });
  }
}

function onFind(e) {
  if (e.which === 13) {
    findCoordinate();
  }
}
function addCenterPosition() {
  renderMarker();
  $(`#${togglePositionId}`).addClass('o-active');
  $(`#${coordsFindId}`).addClass('o-active');
  updateCoords(view.getCenter());
  view.on('change:center', onChangeCenter);
  $(`#${coordsFindId}`).on('keypress', onFind);
}


function clear() {
  writeCoords('');
}

function removeCenterPosition() {
  view.un('change:center', onChangeCenter);
  clear();
  $(`#${coordsFindId}`).off('keypress', onFind);
  $(`#${markerId}`).remove();
  $(`#${togglePositionId}`).removeClass('o-active');
  $(`#${coordsFindId}`).removeClass('o-active');
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

function toggleProjectionVal(val) {
  let proj;
  const index = projectionCodes.indexOf(val);
  if (index === projectionCodes.length - 1) {
    proj = projectionCodes[0];
  } else if (index < projectionCodes.length - 1) {
    proj = projectionCodes[index + 1];
  }
  return proj;
}

function setPrecision() {
  if (currentProjection === 'EPSG:4326') {
    precision = 5;
  } else {
    precision = 0;
  }
}

function writeProjection() {
  $(`#${toggleProjId}`).val(currentProjection);
  $(`#${toggleProjId}`).text(projections[currentProjection]);
}

function onToggleProjection(e) {
  return function toggleProjection(event) {
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

function bindUIActions() {
  $(`#${toggleProjId}`).on('click', onToggleProjection);
  $(`#${togglePositionId}`).on('click', onTogglePosition);
}

function init(optOptions) {
  const options = optOptions || {};
  const title = options.title || undefined;
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

export default { init };
