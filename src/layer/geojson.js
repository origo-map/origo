import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import $ from 'jquery';
import viewer from '../viewer';
import vector from './vector';
import isUrl from '../utils/isurl';

function createSource(options) {
  return VectorSource({
    attributions: options.attribution,
    url: options.url,
    format: GeoJSON()
  });
}

const geojson = function geojson(layerOptions) {
  const baseUrl = viewer.getBaseUrl();
  const geojsonDefault = {
    layerType: 'vector'
  };
  const geojsonOptions = $.extend(geojsonDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isUrl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = baseUrl + geojsonOptions.source;
  }

  const geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource);
};

export default geojson;
