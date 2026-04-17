import vector from './vector';
import FeaturesApiSource from './featuresapisource';

/**
 * Creates a OGC Features Api layer with optional real time support.
 * @param {*} options Layer options accordning to documentation
 * @param {*} viewer The one and only viewer
 * @returns An OL vector layer
 */
export default function featuresapi(options, viewer) {
  const layerDefaults = {
    layerType: 'vector',
    realtime: false,
    realtimeReconnect: 'full', // one of 'none', 'full', 'stream'
    realtimeDisconnectOnHide: true,
    credentials: 'same-origin'
  };
  const sourceDefaults = {
  };
  const layerOptions = Object.assign({}, layerDefaults, options);
  const sourceOptions = Object.assign({}, sourceDefaults, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.featureType = layerOptions.id;
  sourceOptions.title = layerOptions.title;
  layerOptions.featureType = layerOptions.id;
  sourceOptions.realtime = layerOptions.realtime;
  sourceOptions.realtimeReconnect = layerOptions.realtimeReconnect;
  sourceOptions.realtimeDisconnectOnHide = layerOptions.realtimeDisconnectOnHide;
  sourceOptions.credentials = layerOptions.credentials;
  sourceOptions.attribution = layerOptions.attribution;
  layerOptions.extent = undefined;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  // Source is GeoJson. It only supports 4326 according to spec, but we let configuration override that
  if (layerOptions.projection) {
    sourceOptions.dataProjection = layerOptions.projection;
  } else if (sourceOptions.projection) {
    sourceOptions.dataProjection = sourceOptions.projection;
  } else {
    sourceOptions.dataProjection = 'EPSG:4326';
  }

  const featuresApiSource = new FeaturesApiSource(sourceOptions, viewer);

  // Set up a handler so source can disconnect when hidden
  function onVisibilityChange(evt) {
    featuresApiSource.setActive(evt.target.getVisible());
  }
  const vectorLayer = vector(layerOptions, featuresApiSource, viewer);
  // Set up a handler so source can disconnect when hidden
  vectorLayer.on('change:visible', onVisibilityChange);
  return vectorLayer;
}
