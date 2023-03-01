import XYZSource from 'ol/source/XYZ';
import tile from './tile';
import maputils from '../maputils';

function createSource(options) {
  return new XYZSource(options);
}

const xyz = function xyz(layerOptions, viewer) {
  const xyzDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {
    crossOrigin: 'anonymous',
    url: ''
  };
  const xyzOptions = Object.assign(xyzDefault, layerOptions);
  xyzOptions.sourceName = xyzOptions.id;
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = xyzOptions.attribution;
  sourceOptions.crossOrigin = xyzOptions.crossOrigin ? xyzOptions.crossOrigin : sourceOptions.crossOrigin;
  sourceOptions.projection = viewer.getProjectionCode() || 'EPSG:3857';

  if (xyzOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(xyzOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (xyzOptions.extent) {
      sourceOptions.tileGrid.extent = xyzOptions.extent;
    }
  }

  if (xyzOptions.layerURL) {
    sourceOptions.url += xyzOptions.layerURL;
  }

  const xyzSource = createSource(sourceOptions);
  return tile(xyzOptions, xyzSource, viewer);
};

export default xyz;
