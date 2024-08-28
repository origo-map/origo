import MousePosition from 'ol/control/MousePosition';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { createStringXY, toStringHDMS } from 'ol/coordinate';
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

  /** Current Map projection code */
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
  let currentConfig;
  let currentConfigIndex = 0;
  let configArray = [];
  let currentCaretPos;
  let inputEl;

  /**
   * Converts origo spec configuration for placeholder to that of OL MousePosition. Originally they were the same, but since OL ver 7.0
   * only undefined is treated as "use last known coordinate".
   * @returns String with placeholder or undefined if last known position should be used.
   */
  function placeholder() {
    return noPositionText.length === 0 ? undefined : noPositionText;
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

  /**
   *  Returns a function that formats a coordinate to HDMS format
   * @param {any} fractionDigits
   */
  function createStringHDMS(fractionDigits) {
    return (
      (coord) => toStringHDMS(coord, fractionDigits)
    );
  }

  /**
   * Returns a funtion that formats a coordinate to a string depending on configuration
   * */
  function getStringifyFunction() {
    return currentConfig.dms ? createStringHDMS(precision) : createStringXY(precision);
  }

  function addMousePosition() {
    const currentProjectionCode = currentConfig.projectionCode;
    mousePositionControl = new MousePosition({
      coordinateFormat: getStringifyFunction(),
      projection: currentProjectionCode,
      target: document.getElementById(`${coordsElement.getId()}`),
      placeholder: placeholder()
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

  /**
   * Write coords to input field.
   * @param {any} coords
   */
  function writeCoords(coords) {
    inputEl.value = coords;
  }

  function transformCoords(coords, source, destination) {
    const geometry = new Feature({
      geometry: new Point(coords)
    }).getGeometry();
    return geometry.transform(source, destination).getCoordinates();
  }

  /**
   * Update coords in input, transforming if necessary.
   * @param {any} sourceCoords
   */
  function updateCoords(sourceCoords) {
    let coords = sourceCoords;
    const currentProjectionCode = currentConfig.projectionCode;
    if (currentProjectionCode !== mapProjection) {
      coords = transformCoords(coords, mapProjection, currentProjectionCode);
    }
    const formattedCoords = getStringifyFunction()(coords);
    writeCoords(formattedCoords);
  }
  /**
   * Eventhandler that is called when map pans.
   * */
  function onChangeCenter() {
    updateCoords(view.getCenter());
  }

  /**
   * Parses a coordinate string and transforms it to map projection if necessary and returns a valid coordinate
   * @param {any} strCoords
   */
  function validateCoordinate(strCoords) {
    const extent = viewer.getExtent() || view.getProjection().getExtent();
    let inExtent;
    let coords;
    if (currentConfig.dms) {
      // Assume that input logic enforces a correct format
      const coordArray = strCoords.match(/\d*\.?\d+/g);
      const lat = parseInt(coordArray[0], 10) + parseInt(coordArray[1], 10) / 60 + parseFloat(coordArray[2]) / 3600;
      const lon = parseInt(coordArray[3], 10) + parseInt(coordArray[4], 10) / 60 + parseFloat(coordArray[5]) / 3600;
      coords = [lon, lat];
    } else {
      // validate numbers
      coords = strCoords.split(',').map(coord => parseFloat(coord))
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
    }

    // transform
    if (currentConfig.projectionCode !== mapProjection) {
      coords = transformCoords(coords, currentConfig.projectionCode, mapProjection);
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

  /** Centers the map on the coordinates provided by user i textbox */
  function findCoordinate() {
    const coords = inputEl.value;
    const validated = validateCoordinate(coords);
    if (validated.length === 2) {
      map.getView().animate({
        center: validated,
        zoom: (viewer.getResolutions().length - 3)
      });
    }
  }

  /** Eventhandler that is called when input field gets focus */
  function onFindFocus() {
    if (currentConfig.dms) {
      // Always mark first digit to keep user out of trouble
      inputEl.setSelectionRange(0, 1);
      currentCaretPos = 0;
    }
  }

  /**
   * Move the selection in input field in indicated direction to next position where there is a digit
   * @param {any} left True if move left, otherwise move right
   */
  function moveCaret(left) {
    const step = left ? -1 : 1;
    if (currentCaretPos + step < 0 || currentCaretPos + step > inputEl.value.length - 4) {
      return;
    }
    // Stop on next digit. As we already tested if we're on first or last digit, there must be at least one more digit in this direction
    currentCaretPos += step;
    while (!/\d/.test(inputEl.value[currentCaretPos])) {
      currentCaretPos += step;
    }
    inputEl.setSelectionRange(currentCaretPos, currentCaretPos + 1);
  }
  /**
   * Eventhandler called when user enters something in the coordinate textbox
   * @param {any} e
   */
  function onFind(e) {
    if (currentConfig.dms) {
      if (e.key === 'ArrowLeft') {
        moveCaret(true);
      } else if (e.key === 'ArrowRight') {
        moveCaret(false);
      } else if (e.key >= 0 && e.key <= 9) {
        inputEl.value = inputEl.value.substring(0, currentCaretPos) + (e.key) + inputEl.value.substring(currentCaretPos + 1);
        moveCaret(false);
      } else if (e.key === 'Enter') {
        findCoordinate();
      }
      // For DMS, we handle everything ourselves. Ignore all keypresses (including current key) in order to keep browser from interfering
      e.preventDefault();
    } else if (e.key === 'Enter') {
      findCoordinate();
    }
  }

  /**
   * Eventhandler that is called when users clicks input field. Is only called if input already has focus.
   * @param {any} e
   */
  function onFindClick() {
    if (currentConfig.dms) {
      // Select first digit in order to keep user out of trouble by accidently clicking a non-digit and mess up the string
      currentCaretPos = 0;
      inputEl.setSelectionRange(currentCaretPos, currentCaretPos + 1);
    }
  }

  function addCenterPosition() {
    renderMarker();

    document.getElementById(`${centerButton.getId()}`).classList.add('o-active');
    document.getElementById(`${coordsFindElement.getId()}`).classList.add('o-active');

    updateCoords(view.getCenter());
    view.on('change:center', onChangeCenter);

    inputEl.addEventListener('keydown', onFind);
    inputEl.addEventListener('focus', onFindFocus);
    inputEl.addEventListener('click', onFindClick);
  }

  function clear() {
    writeCoords('');
  }

  function removeCenterPosition() {
    view.un('change:center', onChangeCenter);
    clear();
    inputEl.removeEventListener('keydown', onFind);
    inputEl.removeEventListener('focus', onFindFocus);
    inputEl.removeEventListener('click', onFindClick);

    const markerIconElement = document.getElementById(`${markerIcon.getId()}`);
    markerIconElement.parentNode.removeChild(markerIconElement);
    document.getElementById(`${centerButton.getId()}`).classList.remove('o-active');
    inputEl.classList.remove('o-active');
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

  function toggleProjectionVal() {
    currentConfigIndex += 1;
    if (currentConfigIndex === configArray.length) {
      currentConfigIndex = 0;
    }
    currentConfig = configArray[currentConfigIndex];
  }

  function setPrecision() {
    if (currentConfig.precision) {
      precision = currentConfig.precision;
    } else if (currentConfig.projectionCode === 'EPSG:4326' && !currentConfig.dms) {
      precision = 5;
    } else {
      precision = 0;
    }
    const exampleCoord = getStringifyFunction()(view.getCenter());
    inputEl.setAttribute('size', exampleCoord.length);
  }

  function writeProjection() {
    document.getElementById(`${projButton.getId()}`).value = currentConfig.projectionCode;
    document.getElementById(`${projButton.getId()}`).textContent = currentConfig.projectionLabel;
  }

  /** Eventhandler that is called when user clicks toggle button */
  function onToggleProjection() {
    removeNoCoordsEl();
    toggleProjectionVal();
    setPrecision();
    writeProjection();
    if (mousePositionActive) {
      removeMousePosition();
      addMousePosition();
    } else {
      updateCoords(view.getCenter());
    }
  }

  return Component({
    name: 'position',
    onTogglePosition,
    isMousePositionActive() { return mousePositionActive; },
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      view = map.getView();
      mapProjection = viewer.getProjectionCode();
      // For backwards compatibility, we also accept an object with epsg codes as keys
      // New config format must be an array, as same epsg code can be used several times
      if (options.projections instanceof Array) {
        configArray = options.projections;
      } else {
        Object.keys(options.projections).forEach(currKey => configArray.push({ projectionCode: currKey, projectionLabel: options.projections[currKey] }));
      }

      // If title is set, add the map projection as first and active setting.
      if (title) {
        configArray.unshift({ projectionCode: mapProjection, projectionLabel: title });
      }

      if (configArray.length === 0) {
        alert('No title or projection is set for position');
      }
      currentConfig = configArray[0];
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
        ariaLabel: 'Position ikon',
        iconCls: 'o-icon-position'
      });
      projButton = Button({
        cls: 'o-position-button',
        ariaLabel: 'Projektion',
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
    hide() {
      document.getElementById(containerElement.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(containerElement.getId()).classList.remove('hidden');
    },
    render() {
      const el = dom.html(containerElement.render());
      document.getElementById(viewer.getFooter().getId()).firstElementChild.appendChild(el);
      inputEl = document.getElementById(`${coordsFindElement.getId()}`);

      writeProjection();

      setPrecision();
      addMousePosition();

      this.dispatch('render');
    }
  });
};

export default Position;
