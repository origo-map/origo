import OlMap from 'ol/Map';
import OlView from 'ol/View';
import mapInteractions from './mapinteractions';

const Map = (options = {}) => {
  const interactions = mapInteractions({ target: options.target, mapInteractions: options.pageSettings.mapInteractions });
  const mapOptions = Object.assign(options, { interactions });
  delete mapOptions.layers;
  mapOptions.controls = [];

  const view = new OlView(options);
  const map = new OlMap(Object.assign(mapOptions, { view }));

  return map;
};

export default Map;
