import $ from 'jquery';
import GeoJSONFormat from 'ol/format/GeoJSON';
import viewer from '../../viewer';
import wfsTransaction from '../editor/wfstransaction';

const wfs = {};
wfs.request = function request(layer) {
  // Note that if there is a GeoJSON layer enabled om the map the following line will throw an error. because a GeoJSON layer does not have a seperate source defined and
  // the address to the GeoJSON file is given directly in the source property of the layer options.
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
