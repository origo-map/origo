import LoadingStrategy from 'ol/loadingstrategy';
import TileGrid from 'ol/tilegrid';
import VectorSource from 'ol/source/vector';
import GeoJSONFormat from 'ol/format/geojson';
import $ from 'jquery';
import viewer from '../viewer';
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
  const bboxProjectionCode = options.filter ? `'${options.projectionCode}')` : options.projectionCode;
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    format: new GeoJSONFormat({
      geometryName: options.geometryName
    }),
    loader(extent) {
      let url = [`${serverUrl}?service=WFS`,
        `&version=1.1.0&request=GetFeature&typeName=${options.featureType}&outputFormat=application/json`,
        `&srsname=${options.projectionCode}`].join('');
      url += options.strategy === 'all' ? queryFilter : `${queryFilter + extent.join(',')},${bboxProjectionCode}`;
      url = encodeURI(url);
      $.ajax({
        url,
        cache: false
      })
        .done((response) => {
          vectorSource.addFeatures(vectorSource.getFormat().readFeatures(response));
        });
    },
    strategy: options.loadingstrategy
  });
  return vectorSource;
}

export default function wfs(layerOptions) {
  const wfsDefault = {
    layerType: 'vector'
  };
  const sourceDefault = {};
  const wfsOptions = $.extend(wfsDefault, layerOptions);
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
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
      sourceOptions.loadingstrategy = LoadingStrategy.tile(TileGrid.createXYZ({
        maxZoom: sourceOptions.resolutions.length
      }));
      break;
    default:
      sourceOptions.loadingstrategy = LoadingStrategy.bbox;
      break;
  }
  const wfsSource = createSource(sourceOptions);
  return vector(wfsOptions, wfsSource);
}
