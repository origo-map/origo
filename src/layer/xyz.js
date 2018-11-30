import XYZSource from 'ol/source/XYZ';
import $ from 'jquery';
import viewer from '../viewer';
import tile from './tile';
import maputils from '../maputils';

function createSource(options) {
  return new XYZSource(options);
}

const xyz = function xyz(layerOptions) {
  const xyzDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {};
  const xyzOptions = $.extend(xyzDefault, layerOptions);
  xyzOptions.sourceName = xyzOptions.id;
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = xyzOptions.attribution;
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
  } else {
    const format = sourceOptions.sourceName.split('.')[1];
    let url = `${sourceOptions.sourceName.split('.')[0]}/{z}/{x}/{y}.`;
    url += format;
    sourceOptions.url = url;
  }
  sourceOptions.crossOrigin = 'anonymous';
  const xyzSource = createSource(sourceOptions);
  return tile(xyzOptions, xyzSource);
};

export default xyz;
