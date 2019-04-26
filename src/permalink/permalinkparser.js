import GeoJSON from 'ol/format/GeoJSON';
import urlparser from '../utils/urlparser';
import permalinkParser from './permalinkparser';

const layerModel = {
  v: {
    name: 'visible',
    dataType: 'boolean'
  },
  s: {
    name: 'legend',
    dataType: 'boolean'
  }
};

export default {
  layers(layersStr) {
    const layers = layersStr.split(',');
    const layerObjects = {};
    layers.forEach((layer) => {
      const obj = {};
      const layerObject = urlparser.objectify(layer, {
        topmost: 'name'
      });
      Object.getOwnPropertyNames(layerObject).forEach((prop) => {
        const val = layerObject[prop];
        if (Object.prototype.hasOwnProperty.call(layerModel, prop)) {
          const attribute = layerModel[prop];
          obj[attribute.name] = urlparser.strBoolean(val);
        } else {
          obj[prop] = val;
        }
      });
      layerObjects[obj.name] = obj;
    });
    return layerObjects;
  },
  zoom(zoomStr) {
    return parseInt(zoomStr, 10);
  },
  center(centerStr) {
    const center = centerStr.split(',').map(coord => parseInt(coord, 10));
    return center;
  },
  selection(selectionStr) {
    return urlparser.strArrayify(selectionStr, {
      topmostName: 'geometryType',
      arrName: 'coordinates'
    });
  },
  feature(featureId) {
    return featureId;
  },
  pin(pinStr) {
    return urlparser.strIntify(pinStr);
  },
  map(mapStr) {
    return mapStr;
  },
  controls(controlsStr) {
    var controls = {};
    for (var key in controlsStr) {
      controls[key] = parseFunctions[key](controlsStr[key]);
    }
    return controls;
  },
  controlDraw(drawState) {
    const features = new GeoJSON().readFeatures(drawState.features);
    return { "features": features };
  }
};

// We define the controls parse functions so they can be called from parseControlls funktion 
// (I don't want to rewrite the whole file so it first defines all
// functions and then export it as the file will then differ alot with OrigoMap and have to be merged every time.
// Lukas Bergliden Decerno
const parseFunctions = {};
parseFunctions.draw = permalinkParser.controlDraw;

