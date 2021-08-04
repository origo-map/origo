import VectorSource from 'ol/source/Vector';
import KML from 'ol/format/KML';
import vector from './vector';
import isurl from '../utils/isurl';

function createSource(options) {
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    url: options.url,
    format: new KML()
  });
  return vectorSource;
}

const kml = function kml(layerOptions, viewer) {
  const kmlDefault = {
    layerType: 'vector'
  };
  const kmlOptions = Object.assign(kmlDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = kmlOptions.attribution;
  sourceOptions.sourceName = layerOptions.source;
  if (isurl(kmlOptions.source)) {
    sourceOptions.url = kmlOptions.source;
  } else {
    kmlOptions.sourceName = kmlOptions.source;
    sourceOptions.url = kmlOptions.source;
  }
  sourceOptions.headers = layerOptions.headers;

  const kmlSource = createSource(sourceOptions);
  return vector(kmlOptions, kmlSource, viewer);
};

export default kml;
