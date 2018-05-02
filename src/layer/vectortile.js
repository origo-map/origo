import $ from 'jquery';
import TopoJSONFormat from 'ol/format/TopoJSON';
import GeoJSONFormat from 'ol/format/GeoJSON';
import MVTFormat from 'ol/format/MVT';
import VectorTileSource from 'ol/source/VectorTile';
import viewer from '../viewer';
import vector from './vector';
import maputils from '../maputils';

function createSource(opt, vectortileOptions) {
  const options = opt;
  let format;
  switch (vectortileOptions.format) {
    case 'topojson':
      format = new TopoJSONFormat();
      break;
    case 'geojson':
      format = new GeoJSONFormat();
      break;
    case 'pbf':
      format = new MVTFormat();
      break;
    default:
      break;
  }
  if (vectortileOptions.layerURL) {
    options.url += vectortileOptions.layerURL;
  } else {
    options.url += `${vectortileOptions.layerName}@${vectortileOptions.gridset}@${vectortileOptions.format}/{z}/{x}/{-y}.${vectortileOptions.format}`;
  }
  options.format = format;
  return new VectorTileSource(options);
}

const vectortile = function vectortile(layerOptions) {
  const vectortileDefault = {
    layerType: 'vectortile',
    featureinfoLayer: undefined
  };
  const sourceDefault = {};
  const vectortileOptions = $.extend(vectortileDefault, layerOptions);
  vectortileOptions.sourceName = vectortileOptions.name;
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attributions = vectortileOptions.attribution;
  sourceOptions.projection = viewer.getProjectionCode() || 'EPSG:3857';

  if (vectortileOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(vectortileOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (vectortileOptions.extent) {
      sourceOptions.tileGrid.extent = vectortileOptions.extent;
    }
  }

  const vectortileSource = createSource(sourceOptions, vectortileOptions);
  return vector(vectortileOptions, vectortileSource);
};

export default vectortile;
