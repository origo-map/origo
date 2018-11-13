import WMTSSource from 'ol/source/WMTS';
import Tilegrid from 'ol/tilegrid/WMTS';
import { getTopLeft } from 'ol/extent';
import $ from 'jquery';
import viewer from '../viewer';
import tile from './tile';

function createSource(options) {
  return new WMTSSource({
    crossOrigin: 'anonymous',
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
    style: 'default'
  });
}

const wmts = function wmts(layerOptions) {
  const wmtsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {
    matrixSet: viewer.getProjectionCode(),
    matrixIdsPrefix: `${viewer.getProjectionCode()}:`,
    format: 'image/png',
    resolutions: viewer.getResolutions(),
    tileSize: [256, 256]
  };
  const wmtsOptions = $.extend(wmtsDefault, layerOptions);
  wmtsOptions.name.split(':').pop();
  wmtsOptions.sourceName = wmtsOptions.name;
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  if (Object.prototype.hasOwnProperty.call(wmtsOptions, 'format')) {
    sourceOptions.format = wmtsOptions.format;
  }
  sourceOptions.attribution = wmtsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.matrixIds = [];
  sourceOptions.resolutions.forEach((resolution, i) => {
    sourceOptions.matrixIds[i] = sourceOptions.matrixIdsPrefix + i;
  });
  sourceOptions.projectionExtent = viewer.getProjection().getExtent();
  sourceOptions.id = wmtsOptions.id;

  const wmtsSource = createSource(sourceOptions);
  return tile(wmtsOptions, wmtsSource);
};

export default wmts;
