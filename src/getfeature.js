import EsriJSONFormat from 'ol/format/EsriJSON';
import WfsSource from './layer/wfssource';

let projectionCode;
let projection;
const sourceType = {};

/**
 * Fetches features from a layer's source but does not add them to the layer. Supports WFS and AGS_FEATURE altough functionality differs. Mainly used by search, but
 * is also exposed as an api function that MultiSelect uses. As q quirky bonus it also support fetching features from WMS layers if there is a WFS service at the same endpoint.
 *
 * @param {any} id Comma separated list of ids. If specified layer's filter and parameter extent is ignored (even configured map and layer extent is ignored).
 * @param {any} layer Layer instance to fetch from
 * @param {any} source Array of know sources. Probably the configuration section source.
 * @param {any} projCode Projection code for the returned features. Ignored by WFS as map projection is used
 * @param {any} proj projection like object for the returned features. Ignored by WFS as map projection is used
 * @param {any} extent Extent to fetch inside. Layer configuration extent is honored.
 * @returns {Promise<any[]>}
 */
export default function getfeature(id, layer, source, projCode, proj, extent) {
  projectionCode = projCode;
  projection = proj;
  const serverUrl = source[layer.get('sourceName')].url;
  const type = layer.get('type');
  // returns a promise with features as result
  if (type === 'AGS_FEATURE') {
    return sourceType.AGS_FEATURE(id, layer, serverUrl);
  }
  // Note that this includes WMS which MultiSelect utilizes to make an WFS request to an unknown WFS layer assumed to reside on same place as WMS layer!
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

  return fetch(url, { type: 'GET', dataType: 'jsonp' }).then((res) => {
    if (res.error) {
      fail(res);
      return [];
    }
    return res.json();
  }).then(json => esrijsonFormat.readFeatures(json, {
    featureProjection: projection
  })).catch(error => console.error(error));
};

sourceType.WFS = function wfsSourceType(id, layer, serverUrl, extent) {
  let wfsSource;
  const layerType = layer.get('type');
  // Create a temporary WFS source if layer is WMS.
  // This is a special case for multiselect which utlizes the fact that Geoserver usually has an WFS endpoint
  // at the same place as an WMS endpoint
  if (layerType !== 'WFS') {
    // Create the necessary configuration to create a request to WFS endpoint from a WMS layer
    const sourceOpts = {
      geometryName: layer.get('geometryName'),
      dataProjection: projectionCode,
      projectionCode,
      loadingstrategy: 'all',
      requestMethod: 'GET',
      url: serverUrl,
      customExtent: layer.get('extent'),
      featureType: layer.get('id')
    };
    wfsSource = new WfsSource(sourceOpts);
  } else {
    wfsSource = layer.getSource();
  }

  if (id || id === 0) {
    return wfsSource.getFeatureFromSourceByIds(id);
  }
  // Have to pick up filter from layer as MultiSelect changes filter on layer instead of source
  const filter = layer.get('filter');
  return wfsSource.getFeaturesFromSource(extent, filter, true);
};
