import EsriJSONFormat from 'ol/format/esrijson';
import GeoJSONFormat from 'ol/format/geojson';
import $ from 'jquery';
import viewer from './viewer';

let projectionCode;
const sourceType = {};

export default function (id, layer) {
  projectionCode = viewer.getProjectionCode();
  const source = viewer.getMapSource();
  const serverUrl = source[layer.get('sourceName')].url;
  const type = layer.get('type');
  // returns a promise with features as result
  return sourceType[type](id, layer, serverUrl);
}

function fail(response) {
  if (response.error) {
    console.log(`${response.error.message}
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
        featureProjection: viewer.getProjection()
      });
      return features;
    }, fail);
};

sourceType.WFS = function wfsSourceType(id, layer, serverUrl) {
  const geometryName = layer.get('geometryName');
  const format = new GeoJSONFormat({
    geometryName
  });
  const url = `${serverUrl}?`;
  const data = ['service=WFS',
    '&version=1.0.0',
    `&request=GetFeature&typeName=${layer.get('name')}`,
    '&outputFormat=json',
    `&featureId=${id}`
  ].join('');

  return $.ajax({
    url,
    data,
    type: 'POST',
    dataType: 'json'
  })
    .then(response => format.readFeatures(response));
};
