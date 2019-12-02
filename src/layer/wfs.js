import * as LoadingStrategy from 'ol/loadingstrategy';
import { createXYZ } from 'ol/tilegrid';
import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';
import vector from './vector';

function createSource(options) {
  const serverUrl = options.url;
  let queryFilter = '';

  // If cql filter then bbox must be used in the filter.
  if (options.strategy === 'all') {
    queryFilter = options.filter ? `&CQL_FILTER=${options.filter}` : '';
  } else {
    queryFilter = options.filter ? `&CQL_FILTER=${options.filter} AND BBOX(${options.geometryName},` : '&BBOX=';
  }
  const bboxProjectionCode = options.filter ? `'${options.dataProjection}')` : options.dataProjection;
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    format: new GeoJSONFormat({
      geometryName: options.geometryName,
      dataProjection: options.dataProjection,
      featureProjection: options.projectionCode
    }),
    loader(extent) {
      let requestExtent;
      if (options.dataProjection !== options.projectionCode) {
        requestExtent = transformExtent(extent, options.projectionCode, options.dataProjection);
      } else {
        requestExtent = extent;
      }
      let url = [`${serverUrl}?service=WFS`,
        `&version=1.1.0&request=GetFeature&typeName=${options.featureType}&outputFormat=application/json`,
        `&srsname=${options.dataProjection}`].join('');
      url += options.strategy === 'all' ? queryFilter : `${queryFilter + requestExtent.join(',')},${bboxProjectionCode}`;
      url = encodeURI(url);

      fetch(url).then(response => response.json({
        cache: false
      })).then((data) => {
        vectorSource.addFeatures(vectorSource.getFormat().readFeatures(data));
      });
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
  if (wfsOptions.projection) {
    sourceOptions.dataProjection = wfsOptions.projection;
  } else if (sourceOptions.projection) {
    sourceOptions.dataProjection = sourceOptions.projection;
  } else {
    sourceOptions.dataProjection = viewer.getProjectionCode();
  }

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
