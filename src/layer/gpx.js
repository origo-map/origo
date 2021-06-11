import VectorSource from 'ol/source/Vector';
import GPX from 'ol/format/GPX';
import vector from './vector';
import isurl from '../utils/isurl';

function createSource(options) {
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    url: options.url,
    format: new GPX()
  });
  return vectorSource;
}

const gpx = function gpx(layerOptions, viewer) {
  const gpxDefault = {
    layerType: 'vector'
  };
  const gpxOptions = Object.assign(gpxDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = gpxOptions.attribution;
  sourceOptions.sourceName = layerOptions.source;
  if (isurl(gpxOptions.source)) {
    sourceOptions.url = gpxOptions.source;
  } else {
    gpxOptions.sourceName = gpxOptions.source;
    sourceOptions.url = viewer.getMapSource()[gpxOptions.source].url;
  }
  sourceOptions.headers = layerOptions.headers;

  const gpxSource = createSource(sourceOptions);
  return vector(gpxOptions, gpxSource, viewer);
};

export default gpx;
