import $ from 'jquery';
import viewer from '../viewer';
import utils from '../utils';
import numberFormatter from '../utils/numberformatter';

const controlId = 'o-scale';
let consoleId;
let map;
let scaleText;

function render() {
  const container = utils.createElement('div', '', {
    id: controlId,
    style: 'display: inline-block;'
  });
  $(`#${consoleId}`).append(container);
}

function onZoomChange(evt) {
  map.once('moveend', () => {
    const view = map.getView();
    const resolution = evt ? evt.frameState.viewState.resolution : view.getResolution();
    const mapZoom = view.getZoomForResolution(resolution);
    const currentZoom = parseInt(view.getZoom(), 10);
    const currentResolution = view.getResolution();
    if (currentZoom !== mapZoom) {
      const scale = viewer.getScale(currentResolution);
      $(`#${controlId}`).text(scaleText + numberFormatter(scale));
    }
  });
}

function setActive(state) {
  if (state === true) {
    map.on('movestart', onZoomChange);
    onZoomChange();
  } else if (state === false) {
    map.un('movestart', onZoomChange);
  }
}

function init(opt) {
  const options = opt || {};
  map = viewer.getMap();
  consoleId = viewer.getConsoleId();
  scaleText = options.scaleText || 'Skala 1:';
  const initialState = Object.prototype.hasOwnProperty.call(options, 'isActive') ? options.isActive : true;

  setActive(initialState);
  render();

  return {
    setActive
  };
}

export default { init };
