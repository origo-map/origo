import OlMap from 'ol/Map';
import OlView from 'ol/View';
import {defaults as defaultInteractions} from 'ol/interaction';

const Map = (options = {}) => {
  const map = new OlMap({
    target: options.target,
    controls: [],
    view: new OlView({
      extent: options.extent || undefined,
      projection: options.projection || undefined,
      center: options.center,
      resolutions: options.resolutions || undefined,
      zoom: options.zoom,
      enableRotation: options.enableRotation,
      constrainResolution: options.constrainResolution
    }),
    interactions: defaultInteractions({
      keyboard: false
    })
  });
  return map;
};

export default Map;
