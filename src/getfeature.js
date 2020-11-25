import EsriJSONFormat from 'ol/format/EsriJSON';
import GeoJSONFormat from 'ol/format/GeoJSON';
import $ from 'jquery';
import replacer from './utils/replacer';

let projectionCode;
let projection;
const sourceType = {};

export default function (id, layer, source, projCode, proj, extent) {
  projectionCode = projCode;
  projection = proj;
  const serverUrl = source[layer.get('sourceName')].url;
  const type = layer.get('type');
  // returns a promise with features as result
  if (type === 'AGS_FEATURE') {
    return sourceType.AGS_FEATURE(id, layer, serverUrl);
  }
  return sourceType.WFS(id, layer, serverUrl, extent);
}

function fail(response) {
  if (response.error) {
    console.error(`${response.error.message}
      ${response.error.details.join('\n')}`);
  }
}

sourceType.AGS_FEATURE = function agsFeature(id, layer, serverUrl) {
  const esriSrs = projectionCode.split(':').pop();
  const layerId = layer.get('id');
  const esrijsonFormat = new EsriJSONFormat();

  const url = [`${serverUrl}/${layerId}/query?f=json`,
    '&returnGeometry=true',
    `&objectIds=${id}`,
    '&geometryType=esriGeometryEnvelope',
    `&inSR=${esriSrs}`,
    '&outFields=*',
    '&returnIdsOnly=false',
    '&returnCountOnly=false',
    '&geometryPrecision=2',
    `&outSR=${esriSrs}`
  ].join('');

  return $.ajax({
    url,
    dataType: 'jsonp'
  })
    .then((response) => {
      if (response.error) {
        fail(response);
        return [];
      }
      const features = esrijsonFormat.readFeatures(response, {
        featureProjection: projection
      });
      return features;
    }, fail);
};

sourceType.WFS = function wfsSourceType(id, layer, serverUrl, extent) {
  const geometryName = layer.get('geometryName');
  const format = new GeoJSONFormat({
    geometryName
  });
  let queryFilter = '';
  if (!id) {
    const filter = replacer.replace(layer.get('filter'), window);
    const layerExtent = layer.get('extent');
    let minExtent;
    if (extent && layerExtent) {
      minExtent = [Math.max(extent[0], layerExtent[0]),
        Math.max(extent[1], layerExtent[1]),
        Math.min(extent[2], layerExtent[2]),
        Math.min(extent[3], layerExtent[3])];
      if (!(minExtent[0] < minExtent[2] && minExtent[1] < minExtent[3])) {
        return [];
      }
    } else if (extent) {
      minExtent = extent;
    } else if (layerExtent) {
      minExtent = layerExtent;
    }
    if (filter) {
      if (minExtent) {
        queryFilter = layer.get('geometryName') ? `&CQL_FILTER=${filter} AND BBOX(${layer.get('geometryName')},${minExtent.toString()})` : `&CQL_FILTER=${filter}&BBOX=${minExtent.toString()}`;
      } else {
        queryFilter = `&CQL_FILTER=${filter}`;
      }
    } else if (minExtent) {
      queryFilter = layer.get('geometryName') ? `&CQL_FILTER=BBOX(${layer.get('geometryName')},${minExtent.toString()})` : `&BBOX=${minExtent.toString()}`;
    }
  } else {
    queryFilter = `&featureId=${id}`;
  }
  const url = `${serverUrl}?`;
  const data = ['service=WFS',
    '&version=1.0.0',
    `&request=GetFeature&typeName=${layer.get('name')}`,
    '&outputFormat=json',
    queryFilter
  ].join('');

  return $.ajax({
    url,
    data,
    type: 'GET',
    dataType: 'json'
  })
    .then(response => format.readFeatures(response));
};
