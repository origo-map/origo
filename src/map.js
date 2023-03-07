import OlMap from 'ol/Map';
import OlView from 'ol/View';
import mapInteractions from './mapinteractions';

const Map = (options = {}) => {
  const interactions = mapInteractions({ target: options.target, mapInteractions: options.pageSettings && options.pageSettings.mapInteractions ? options.pageSettings.mapInteractions : {} });
  const mapConfig = {};
  const keys = Object.keys(options);
  keys.forEach((key) => {
    switch (key) {
      case 'controls':
      case 'defaultControls':
      case 'groups':
      case 'layers':
      case 'source':
      case 'styles':
        break;
      default:
        mapConfig[key] = options[key];
    }
  });

  const mapOptions = Object.assign(options, { interactions });
  delete mapOptions.layers;
  mapOptions.controls = [];

  const view = new OlView(options);
  const map = new OlMap(Object.assign(mapOptions, { view }));
  map.set('mapConfig', mapConfig);
  return map;
};

export default Map;
