import OlMap from 'ol/Map';
import OlView from 'ol/View';

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
      enableRotation: options.enableRotation
    })
  });
  return map;
};

export default Map;
