import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import tile from './tile';
import image from './image';
import maputils from '../maputils';

function createSource(options) {
  return new ImageArcGISRest(options);
}

const agsMap = function agsMap(layerOptions, viewer) {
  const layerDefault = {
    renderMode: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {
    crossOrigin: 'anonymous',
    projection: viewer.getProjection(),
    ratio: 1
  };
  const layerSettings = { ...layerDefault, ...layerOptions };
  const sourceSettings = { ...sourceDefault, ...viewer.getSource(layerOptions.source) };
  sourceSettings.params = layerSettings.params || {};
  sourceSettings.params.layers = `show:${layerSettings.id}`;

  if (layerSettings.attribution) {
    sourceSettings.attribution = layerSettings.attribution;
  }

  if (layerSettings.tileGrid) {
    sourceSettings.tileGrid = maputils.tileGrid(layerSettings.tileGrid);
  } else if (sourceSettings.tileGrid) {
    sourceSettings.tileGrid = maputils.tileGrid(sourceSettings.tileGrid);
  } else {
    sourceSettings.tileGrid = viewer.getTileGrid();

    if (layerSettings.extent) {
      sourceSettings.tileGrid.extent = layerSettings.extent;
    }
  }

  const agsSource = createSource(sourceSettings);

  if (layerSettings.renderMode === 'image') {
    return image(layerSettings, agsSource);
  }
  return tile(layerSettings, agsSource);
};

export default agsMap;
