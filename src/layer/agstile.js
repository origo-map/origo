import TileArcGISRest from 'ol/source/TileArcGISRest';
import $ from 'jquery';
import viewer from '../viewer';
import tile from './tile';
import maputils from '../maputils';

function createSource(options) {
  return new TileArcGISRest({
    attributions: options.attribution,
    projection: options.projection,
    crossOrigin: 'anonymous',
    params: options.params,
    url: options.url,
    tileGrid: options.tileGrid
  });
}

const agsTile = function agsTile(layerOptions) {
  const agsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {};
  const agsOptions = $.extend(agsDefault, layerOptions);
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.params = agsOptions.params || {};
  sourceOptions.params.layers = `show:${agsOptions.id}`;

  if (agsOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(agsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (agsOptions.extent) {
      sourceOptions.tileGrid.extent = agsOptions.extent;
    }
  }

  const agsSource = createSource(sourceOptions);
  return tile(agsOptions, agsSource);
};

export default agsTile;
