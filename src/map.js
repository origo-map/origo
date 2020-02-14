import OlMap from 'ol/Map';
import OlView from 'ol/View';
import mapInteractions from './mapinteractions';

const Map = (options = {}) => {
  const interactions = mapInteractions({ target: options.target });
  const map = new OlMap({
    target: options.target,
    controls: [],
    interactions,
    view: new OlView({
      extent: options.extent || undefined,
      projection: options.projection || undefined,
      center: options.center,
      resolutions: options.resolutions || undefined,
      zoom: options.zoom,
      enableRotation: options.enableRotation,
      constrainResolution: options.constrainResolution
    })
  });
  return map;
};

export default Map;
