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
    saveLayer.o = Number(layer.get('opacity')) * 100;
    if (saveLayer.s || saveLayer.v) {
      saveLayer.name = layer.get('name');
      if (saveLayer.name !== 'measure') {
        saveLayers.push(urlparser.stringify(saveLayer, {
          topmost: 'name'
        }));
      }
    }
  });
  return saveLayers;
}

permalinkStore.getState = function getState(viewer, isExtended) {
  const state = {};
  const view = viewer.getMap().getView();
  const layers = viewer.getLayers();
  const featureinfo = viewer.getFeatureinfo();
  const type = featureinfo.getSelection().type;
  getPin = featureinfo.getPin;
  state.layers = getSaveLayers(layers);
  state.center = view.getCenter().map(coord => Math.round(coord)).join();
  state.zoom = view.getZoom().toString();

  const legend = viewer.getControlByName('legend');
  if (legend) {
    const legendState = [];
    if (legend.getState().expanded) legendState.push('expanded');
    if (legend.getState().visibleLayersViewActive) legendState.push('visibleLayersViewActive');
    state.legend = legendState.join(',');
  }

  if (isExtended) {
    state.controls = {};
    const draw = viewer.getControlByName('draw');
    const measure = viewer.getControlByName('measure');
    state.controls = {};
    if (draw) {
      state.controls.draw = draw.getState();
    }
    if (measure) {
      state.controls.measure = measure.getState();
    }
  }

  if (featureinfo.getSelection().id && (type === 'AGS_FEATURE' || type === 'WFS' || type === 'GEOJSON' || type === 'TOPOJSON')) {
    state.feature = featureinfo.getSelection().id;
  } else {
    const selectedItems = viewer.getSelectionManager().getSelectedItems().getArray();
    if (selectedItems.length > 0) {
      const layer = selectedItems[0].getLayer();
      const layerType = layer.get('type');
      const layerName = layer.get('name');
      if (layerType === 'AGS_FEATURE' || layerType === 'WFS' || layerType === 'GEOJSON' || layerType === 'TOPOJSON') {
        const id = selectedItems[0].getId() || selectedItems[0].ol_uid;
        if (layerType === 'WFS') {
          const idSuffix = id.substring(id.lastIndexOf('.') + 1, id.length);
          state.feature = `${layerName}.${idSuffix}`;
        } else if (layerType !== 'WFS') {
          state.feature = `${layerName}.${id}`;
        } else {
          state.feature = id;
        }
      }
    }
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
