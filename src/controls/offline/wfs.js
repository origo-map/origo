import GeoJSONFormat from 'ol/format/GeoJSON';
import viewer from '../../viewer';
import wfsTransaction from '../editor/wfstransaction';

const wfs = {};
wfs.request = function request(layer) {
  const sourceOptions = viewer.getMapSource()[layer.get('sourceName')];
  sourceOptions.featureType = layer.get('name').split('__').shift();
  sourceOptions.geometryName = layer.get('geometryName');
  sourceOptions.filter = layer.get('filter');
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.extent = layer.get('extent');
  sourceOptions.projectionCode = viewer.getProjectionCode();

  const req = createRequest(sourceOptions);
  return req;

  function createRequest(options) {
    console.log('createRequest')
    const format = new GeoJSONFormat({
      geometryName: options.geometryName
    });

    const serverUrl = options.url;
    let queryFilter;

    // If cql filter then bbox must be used in the filter.
    if (options.filter) {
      queryFilter = `&CQL_FILTER=${options.filter} AND BBOX(${options.geometryName},${options.extent.join(',')},'${options.projectionCode}')`;
    } else {
      queryFilter = `&BBOX=${options.extent.join(',')},${options.projectionCode}`;
    }

    const url = [
      `${serverUrl}`,
      '?service=WFS&',
      `version=1.1.0&request=GetFeature&typeName=${options.featureType}`,
      '&outputFormat=application/json',
      `&srsname=${options.projectionCode}`,
      `${queryFilter}`
    ].join('');

    return fetch(url,{
      cache: false
    })
      .then(res => res.json())
      .then(data => format.readFeatures(data));
  }
};

wfs.transaction = function transaction(transObj, layerName) {
  return wfsTransaction(transObj, layerName);
};

export default wfs;
