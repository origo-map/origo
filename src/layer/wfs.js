import * as LoadingStrategy from 'ol/loadingstrategy';
import { createXYZ } from 'ol/tilegrid';
import vector from './vector';
import WfsSource from './wfssource';

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

  // Override some settings if it is a table (ignoring geometry) so the user does not have to remember to set them
  if (wfsOptions.isTable) {
    sourceOptions.isTable = true;
    wfsOptions.visible = true;
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
  const wfsSource = new WfsSource(sourceOptions);
  return vector(wfsOptions, wfsSource, viewer);
}
