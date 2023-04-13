import WMTSSource from 'ol/source/WMTS';
import Tilegrid from 'ol/tilegrid/WMTS';
import { getTopLeft } from 'ol/extent';
import tile from './tile';

function createSource(options) {
  return new WMTSSource({
    crossOrigin: options.crossOrigin,
    attributions: options.attribution,
    url: options.url,
    projection: options.projectionCode,
    layer: options.id,
    matrixSet: options.matrixSet,
    format: options.format,
    tileGrid: new Tilegrid({
      origin: options.origin || getTopLeft(options.projectionExtent),
      resolutions: options.resolutions,
      matrixIds: options.matrixIds,
      tileSize: options.tileSize
    }),
    style: options.style || ''
  });
}

const wmts = function wmts(layerOptions, viewer) {
  const wmtsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {
    crossOrigin: 'anonymous',
    matrixSet: layerOptions.matrixSet || viewer.getProjectionCode(),
    matrixIdsPrefix: layerOptions.matrixIdsPrefix === false ? '' : `${viewer.getProjectionCode()}:`,
    format: 'image/png',
    resolutions: JSON.parse(JSON.stringify(viewer.getResolutions())),
    tileSize: [256, 256]
  };
  const wmtsOptions = Object.assign(wmtsDefault, layerOptions);
  wmtsOptions.name.split(':').pop();
  wmtsOptions.sourceName = wmtsOptions.name;
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  if (Object.prototype.hasOwnProperty.call(wmtsOptions, 'format')) {
    sourceOptions.format = wmtsOptions.format;
  }
  sourceOptions.attribution = wmtsOptions.attribution;
  sourceOptions.crossOrigin = wmtsOptions.crossOrigin ? wmtsOptions.crossOrigin : sourceOptions.crossOrigin;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.matrixIds = [];
  sourceOptions.resolutions.forEach((resolution, i) => {
    sourceOptions.matrixIds[i] = sourceOptions.matrixIdsPrefix + i;
  });
  sourceOptions.projectionExtent = viewer.getProjection().getExtent();
  sourceOptions.id = wmtsOptions.id;
  sourceOptions.style = wmtsOptions.wmtsStyle;

  const wmtsSource = createSource(sourceOptions);
  return tile(wmtsOptions, wmtsSource, viewer);
};

export default wmts;
