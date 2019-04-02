import $ from 'jquery';
import GeoJSONFormat from 'ol/format/GeoJSON';
import viewer from '../../viewer';
import wfsTransaction from '../editor/wfstransaction';

const wfs = {};
wfs.request = function request(layer, extent) {
  const sourceOptions = viewer.getMapSource()[layer.get('sourceName')];
  sourceOptions.featureType = layer.get('name').split('__').shift();
  sourceOptions.geometryName = layer.get('geometryName');
  sourceOptions.filter = layer.get('filter');
  sourceOptions.projectionCode = viewer.getProjectionCode();

  // if extent is sent explicitly then use it, otherwise get the layers's extent. this is needed for multiselection module. 
  if (extent) {
    sourceOptions.extent = extent;
  } else {
    sourceOptions.extent = layer.get('extent');
  }

  const req = createRequest(sourceOptions);
  return req;

  function createRequest(options) {
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

    return $.ajax({
      url,
      cache: false
    })
      .then(response => format.readFeatures(response));
  }
};

wfs.transaction = function transaction(transObj, layerName) {
  return wfsTransaction(transObj, layerName);
};

export default wfs;
