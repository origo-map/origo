import VectorSource from 'ol/source/vector';
import vector from './vector';

function createSource(options) {
  return new VectorSource({
    attributions: options.attribution,
    features: options.features
  });
}

const featureLayer = function featureLayer(layerOptions) {
  const options = layerOptions;
  const sourceOptions = {};
  sourceOptions.attribution = layerOptions.attribution;
  sourceOptions.features = layerOptions.features;

  const vectorSource = createSource(sourceOptions);
  return vector(options, vectorSource);
};

export default featureLayer;
