import vector from './vector';
import RealtimeSource from './realtimesource';

export default function realtime(options, viewer) {
  const layerDefaults = {
    layerType: 'vector'
  };
  const sourceDefaults = {
  };
  const layerOptions = Object.assign({}, layerDefaults, options);
  const sourceOptions = Object.assign({}, sourceDefaults, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.featureType = layerOptions.id;
  sourceOptions.title = layerOptions.title;
  layerOptions.featureType = layerOptions.id;
  sourceOptions.geometryName = layerOptions.geometryName;
  // TODO: clear out options that are not relevant for RealtimeSource
  sourceOptions.filter = layerOptions.filter;
  sourceOptions.attribution = layerOptions.attribution;
  sourceOptions.customExtent = layerOptions.extent;
  layerOptions.extent = undefined;
  sourceOptions.resolutions = viewer.getResolutions();
  sourceOptions.projectionCode = viewer.getProjectionCode();
  if (layerOptions.projection) {
    sourceOptions.dataProjection = layerOptions.projection;
  } else if (sourceOptions.projection) {
    sourceOptions.dataProjection = sourceOptions.projection;
  } else {
    sourceOptions.dataProjection = viewer.getProjectionCode();
  }

  const realtimeSource = new RealtimeSource(sourceOptions, viewer);

  function onVisibilityChange(evt) {
    realtimeSource.setActive(evt.target.getVisible());
    console.log('Realtime layer visibility changed', evt);
  }
  const vectorLayer = vector(layerOptions, realtimeSource, viewer);
  vectorLayer.on('change:visible', onVisibilityChange);
  return vectorLayer;
}
