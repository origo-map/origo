import urlparser from '../utils/urlparser';

let getPin;
const permalinkStore = {};
const additionalMapStateParams = {};

function getSaveLayers(layers) {
  const saveLayers = [];
  layers.forEach((layer) => {
    const saveLayer = {};
    saveLayer.v = layer.getVisible() === true ? 1 : 0;
    saveLayer.s = layer.get('legend') === true ? 1 : 0;
    if (saveLayer.s || saveLayer.v) {
      saveLayer.name = layer.get('name');
      saveLayers.push(urlparser.stringify(saveLayer, {
        topmost: 'name'
      }));
    }
  });
  return saveLayers;
}

function getAddedLayers(layers) {
  
  const addedLayers = [];
  layers.forEach((layer) => {
    const addedLayer = {
    name: layer.get('name'),
    abstract: layer.get('abstract'),
    visible: layer.getVisible(),
    removable: layer.get('removable'),
    legend: layer.get('legend'),
    legendGraphicSettings: {service: layer.get('legendGraphicSettings').service, transparent: layer.get('legendGraphicSettings').transparent },
    useLegendGraphics: layer.get('useLegendGraphics'),
    zIndex: layer.getProperties().zIndex,
    source: layer.get('sourceName'),
    style: layer.get('style'),
    title: layer.get('title'),
    type: layer.get('type'),
    infoFormat: layer.get('infoFormat'),
    format: layer.get('background'),
    group: layer.get('group')
    };
    addedLayers.push(addedLayer);
  });
  return addedLayers;
}

permalinkStore.getState = function getState(viewer, isExtended) {
  const state = {};
  const view = viewer.getMap().getView();
  const allLayers = viewer.getLayers();
  const addedLayers = new Array;
  const layers = new Array;
  allLayers.forEach(function (layer) {
    if (layer.get('group') === 'mylayers') {
      addedLayers.push(layer);
    }
    else {
      layers.push(layer);
    }
  })

  const featureinfo = viewer.getFeatureinfo();
  const type = featureinfo.getSelection().type;
  getPin = featureinfo.getPin;
  state.layers = getSaveLayers(layers);
  state.addedLayers = getAddedLayers(addedLayers);
  state.center = view.getCenter().map(coord => Math.round(coord)).join();
  state.zoom = view.getZoom().toString();

  if (isExtended) {
    const draw = viewer.getControlByName('draw');
    if (draw) {
      state.controls = {
        draw: draw.getState()
      };
    }
  }

  if (featureinfo.getSelection().id && (type === 'AGS_FEATURE' || type === 'WFS' || type === 'GEOJSON' || type === 'TOPOJSON')) {
    state.feature = featureinfo.getSelection().id;
  }

  if (getPin()) {
    state.pin = getPin().getGeometry().getCoordinates().map(coord => Math.round(coord))
      .join();
  }

  if (viewer.getMapName()) {
    state.map = viewer.getMapName().split('.')[0];
  }

  Object.keys(additionalMapStateParams).forEach((key) => additionalMapStateParams[key](state));

  return state;
};

permalinkStore.getUrl = function getUrl(viewer) {
  const url = viewer.getUrl();
  return url;
};

permalinkStore.AddExternalParams = function AddExternalParams(key, callback) {
  if (!additionalMapStateParams[key]) additionalMapStateParams[key] = callback;
};

export default permalinkStore;
