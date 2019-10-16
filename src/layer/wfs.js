import * as LoadingStrategy from 'ol/loadingstrategy';
import { createXYZ } from 'ol/tilegrid';
import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import vector from './vector';
import wfsErrorHelper from '../helpers/alert/wfs';

function createSource(options) {
  const serverUrl = options.url;
  let queryFilter = '';

  // If cql filter then bbox must be used in the filter.
  if (options.strategy === 'all') {
    queryFilter = options.filter ? `&CQL_FILTER=${options.filter}` : '';
  } else {
    queryFilter = options.filter ? `&CQL_FILTER=${options.filter} AND BBOX(${options.geometryName},` : '&BBOX=';
  }
  const bboxProjectionCode = options.filter ? `'${options.projectionCode}')` : options.projectionCode;
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    format: new GeoJSONFormat({
      geometryName: options.geometryName
    }),
    loader(extent) {
      let url = [`${serverUrl}?service=WFS`,
        `&version=1.1.0&request=GetFeature&typeName=${options.featureType}&outputFormat=application/json`,
        `&srsname=${options.projectionCode}`
      ].join('');
      url += options.strategy === 'all' ? queryFilter : `${queryFilter + extent.join(',')},${bboxProjectionCode}`;
      url = encodeURI(url);
      fetch(url)
        .then(response => wfsErrorHelper.checkJSON(response, { cache: false }))
        .then(response => wfsErrorHelper.checkResponse(response, vectorSource));
    },
    strategy: options.loadingstrategy
  });
  return vectorSource;
}

export default function wfs(layerOptions, viewer) {
  const wfsDefault = {
    layerType: 'vector'
  };
  const sourceDefault = {};
  const wfsOptions = Object.assign({}, wfsDefault, layerOptions);
  const sourceOptions = Object.assign({}, sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.featureType = wfsOptions.id;
  wfsOptions.featureType = wfsOptions.id;
  sourceOptions.geometryName = wfsOptions.geometryName;
  sourceOptions.filter = wfsOptions.filter;
  sourceOptions.attribution = wfsOptions.attribution;
  sourceOptions.resolutions = viewer.getResolutions();
  sourceOptions.projectionCode = viewer.getProjectionCode();

  sourceOptions.strategy = layerOptions.strategy ? layerOptions.strategy : sourceOptions.strategy;
  switch (sourceOptions.strategy) {
    case 'all':
      sourceOptions.loadingstrategy = LoadingStrategy.all;
      break;
    case 'tile':
      sourceOptions.loadingstrategy = LoadingStrategy.tile(createXYZ({
        maxZoom: sourceOptions.resolutions.length
      }));
      break;
    default:
      sourceOptions.loadingstrategy = LoadingStrategy.bbox;
      break;
  }
  const wfsSource = createSource(sourceOptions);
  return vector(wfsOptions, wfsSource, viewer);
}
