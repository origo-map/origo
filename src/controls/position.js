import MousePosition from 'ol/control/MousePosition';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { createStringXY } from 'ol/coordinate';
import { Component, Icon, Button, Element as El, dom } from '../ui';

const Position = function Position(options = {}) {
  let {
    title,
    suffix
  } = options;
  const {
    noPositionText = '&nbsp;'
  } = options;


  let viewer;
  let map;
  let view;
  const characterError = 'Ogiltigt tecken för koordinat, vänligen försök igen.';
  const extentError = 'Angivna koordinater ligger inte inom kartans utsträckning, vänligen försök igen.';
  let currentProjection;
  let projections;
  let projectionCodes;
  let projection;
  let mapProjection;
  let precision;
  let mousePositionActive;
  let mousePositionControl;
  let markerIcon;
  let markerElement;
  let centerButton;
  let projButton;
  let coordsElement;
  let coordsFindElement;
  let containerElement;


  function undefinedhtml() {
    return noPositionText.length === 0 ? noPositionText === false : noPositionText;
  }

  function removeNoCoordsEl() {
    map.on('movestart', () => {
      const noCoords = document.getElementsByClassName('o-no-coords')[0];
      if (noCoords) {
        noCoords.parentNode.removeChild(noCoords);
      }
    });
  }

  function noCoordsOnPan() {
    const coordsEl = document.getElementById(`${coordsElement.getId()}`);
    const olMousePosEl = document.getElementsByClassName('ol-mouse-position')[0];

    map.on('movestart', () => {
      // eslint-disable-next-line no-underscore-dangle
      const text = mousePositionControl.renderedHTML_;
      const noCoordsEl = document.createElement('div');

      olMousePosEl.classList.add('o-hidden');
      noCoordsEl.classList.add('o-no-coords');
      noCoordsEl.innerHTML = text;
      coordsEl.appendChild(noCoordsEl);
    });

    map.on('moveend', () => {
      olMousePosEl.classList.remove('o-hidden');
      const noCoords = document.getElementsByClassName('o-no-coords')[0];
      if (noCoords) {
        noCoords.parentNode.removeChild(noCoords);
      }
    });
  }

  function addMousePosition() {
    mousePositionControl = new MousePosition({
      coordinateFormat: createStringXY(precision),
      projection: currentProjection,
      target: document.getElementById(`${coordsElement.getId()}`),
      undefinedHTML: undefinedhtml()
    });

    map.addControl(mousePositionControl);
    mousePositionActive = true;
    document.getElementById(`${coordsElement.getId()}`).classList.add('o-active');
    noCoordsOnPan();
  }

  function removeMousePosition() {
    map.removeControl(mousePositionControl);
    document.getElementById(`${coordsElement.getId()}`).classList.remove('o-active');
    mousePositionActive = false;
  }

  function renderMarker() {
    markerIcon = Icon({
      icon: '#o_centerposition_24px',
      cls: 'o-position-marker'
    });

    markerElement = dom.html(markerIcon.render());
    document.getElementById(`${viewer.getId()}`).appendChild(markerElement);
  }

  function writeCoords(coords) {
    document.getElementById(`${coordsFindElement.getId()}`).value = coords;
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
        if (!Number.isNaN(coord)) {
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
    const coords = document.getElementById(`${coordsFindElement.getId()}`).value;
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

    document.getElementById(`${centerButton.getId()}`).classList.add('o-active');
    document.getElementById(`${coordsFindElement.getId()}`).classList.add('o-active');

    updateCoords(view.getCenter());
    view.on('change:center', onChangeCenter);

    document.getElementById(`${coordsFindElement.getId()}`).addEventListener('keypress', onFind);
  }


  function clear() {
    writeCoords('');
  }

  function removeCenterPosition() {
    view.un('change:center', onChangeCenter);
    clear();
    document.getElementById(`${coordsFindElement.getId()}`).removeEventListener('keypress', onFind);

    const markerIconElement = document.getElementById(`${markerIcon.getId()}`);
    markerIconElement.parentNode.removeChild(markerIconElement);
    document.getElementById(`${centerButton.getId()}`).classList.remove('o-active');
    document.getElementById(`${coordsFindElement.getId()}`).classList.remove('o-active');
  }

  function onTogglePosition() {
    removeNoCoordsEl();
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
    document.getElementById(`${projButton.getId()}`).value = currentProjection;
    document.getElementById(`${projButton.getId()}`).textContent = projections[currentProjection];
  }

  function onToggleProjection() {
    removeNoCoordsEl();
    currentProjection = toggleProjectionVal(document.getElementById(`${projButton.getId()}`).value);
    setPrecision();
    writeProjection(currentProjection);
    if (mousePositionActive) {
      removeMousePosition();
      addMousePosition();
    } else {
      updateCoords(view.getCenter());
    }
  }

  return Component({
    name: 'position',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      view = map.getView();
      projection = view.getProjection();
      mapProjection = viewer.getProjectionCode();
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

      if (!suffix) suffix = '';
      if (!title) title = undefined;

      this.addComponents([containerElement]);
      this.render();
    },
    onInit() {
      centerButton = Button({
        cls: 'o-position-center-button',
        click() {
          onTogglePosition();
        },
        icon: '#ic_gps_not_fixed_24px',
        iconCls: 'o-icon-position'
      });
      projButton = Button({
        cls: 'o-position-button',
        click() {
          onToggleProjection();
        }
      });
      coordsElement = El({
        cls: 'o-position-coords',
        style: 'padding-left: 5px;'
      });
      coordsFindElement = El({
        cls: 'o-position-find',
        tagName: 'input',
        style: 'padding-left: 5px;'
      });
      containerElement = El({
        cls: 'o-position',
        style: 'display: inline-block;',
        components: [centerButton, projButton, coordsElement, coordsFindElement]
      });
    },
    render() {
      const el = dom.html(containerElement.render());
      document.getElementById(viewer.getFooter().getId()).firstElementChild.appendChild(el);

      document.getElementById(`${projButton.getId()}`).value = currentProjection;
      document.getElementById(`${projButton.getId()}`).textContent = projections[currentProjection];

      setPrecision();
      addMousePosition();

      this.dispatch('render');
    }
  });
};

export default Position;
