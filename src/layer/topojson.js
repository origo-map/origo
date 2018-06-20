import $ from 'jquery';
import VectorSource from 'ol/source/vector';
import TopoJSONFormat from 'ol/format/topojson';
import viewer from '../viewer';
import vector from './vector';
import isUrl from '../utils/isurl';

function createSource(options) {
  return new VectorSource({
    attributions: options.attribution,
    url: options.url,
    format: new TopoJSONFormat({
      defaultDataProjection: options.projectionCode
    })
  });
}

const topojson = function topojson(layerOptions) {
  const baseUrl = viewer.getBaseUrl();
  const topojsonDefault = {
    layerType: 'vector'
  };
  const topojsonOptions = $.extend(topojsonDefault, layerOptions);
  const sourceOptions = {};

  sourceOptions.attribution = topojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isUrl(topojsonOptions.source)) {
    sourceOptions.url = topojsonOptions.source;
  } else {
    topojsonOptions.sourceName = topojsonOptions.source;
    sourceOptions.url = baseUrl + topojsonOptions.source;
  }

  const topojsonSource = createSource(sourceOptions);
  return vector(topojsonOptions, topojsonSource);
};

export default topojson;
