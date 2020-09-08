import GeoJSON from 'ol/format/GeoJSON';
import urlparser from '../utils/urlparser';

const layerModel = {
  v: {
    name: 'visible',
    dataType: 'boolean'
  },
  s: {
    name: 'legend',
    dataType: 'boolean'
  },
  o: {
    name: 'opacity',
    dataType: 'number'
  }
};

const parseFunctions = {};

const layers = function layers(layersStr) {
  let lyrs = layersStr;
  if (!Array.isArray(layersStr)) {
    lyrs = layersStr.split(',');
  }
  const layerObjects = {};
  lyrs.forEach((layer) => {
    const obj = {};
    const layerObject = urlparser.objectify(layer, {
      topmost: 'name'
    });
    Object.getOwnPropertyNames(layerObject).forEach((prop) => {
      const val = layerObject[prop];
      if (Object.prototype.hasOwnProperty.call(layerModel, prop) && prop !== 'o') {
        const attribute = layerModel[prop];
        obj[attribute.name] = urlparser.strBoolean(val);
      } else if (prop === 'o') {
        const attribute = layerModel[prop];
        obj[attribute.name] = Number(val) / 100;
      } else {
        obj[prop] = val;
      }
    });
    layerObjects[obj.name] = obj;
  });
  return layerObjects;
};

const zoom = function zoom(zoomStr) {
  return parseInt(zoomStr, 10);
};

const center = function center(centerStr) {
  const c = centerStr.split(',').map(coord => parseInt(coord, 10));
  return c;
};

const selection = function selection(selectionStr) {
  return urlparser.strArrayify(selectionStr, {
    topmostName: 'geometryType',
    arrName: 'coordinates'
  });
};

const feature = function feature(featureId) {
  return featureId;
};

const pin = function pin(pinStr) {
  return urlparser.strIntify(pinStr);
};

const map = function map(mapStr) {
  return mapStr;
};

const controls = function controls(controlsStr) {
  const ctrls = {};
  Object.keys(controlsStr).forEach(key => {
    ctrls[key] = parseFunctions[key](controlsStr[key]);
  });
  return ctrls;
};

const controlDraw = function controlDraw(drawState) {
  const features = new GeoJSON().readFeatures(drawState.features);
  return { features };
};

parseFunctions.draw = controlDraw;

export default {
  layers,
  zoom,
  center,
  selection,
  feature,
  pin,
  map,
  controls,
  controlDraw
};
