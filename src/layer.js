import mapUtils from './maputils';
import group from './layer/group';
import type from './layer/layertype';

const Layer = function Layer(optOptions, viewer) {
  const defaultOptions = {
    name: undefined,
    id: undefined,
    title: undefined,
    group: 'none',
    opacity: 1,
    geometryName: 'geom',
    geometryType: undefined,
    filter: undefined,
    legend: false,
    sourceName: undefined,
    attribution: undefined,
    style: 'default',
    styleName: undefined,
    queryable: true,
    minResolution: undefined,
    maxResolution: undefined,
    visible: false,
    type: undefined,
    extent: undefined,
    attributes: undefined,
    tileSize: viewer.getTileSize()
  };
  const projection = viewer.getProjection();
  const options = optOptions || {};
  const layerOptions = Object.assign({}, defaultOptions, options);
  const name = layerOptions.name;
  layerOptions.minResolution = 'minScale' in layerOptions ? mapUtils.scaleToResolution(layerOptions.minScale, projection) : undefined;
  layerOptions.maxResolution = 'maxScale' in layerOptions ? mapUtils.scaleToResolution(layerOptions.maxScale, projection) : undefined;
  layerOptions.extent = layerOptions.extent || viewer.getExtent();
  layerOptions.sourceName = layerOptions.source;
  layerOptions.styleName = layerOptions.style;
  if (layerOptions.id === undefined) {
    layerOptions.id = name.split('__').shift();
  }
  if (!layerOptions.type) {
    layerOptions.type = viewer.getSource(layerOptions.sourceName).type || null;
  }

  layerOptions.name = name.split(':').pop();

  if (layerOptions.type) {
    return type[layerOptions.type](layerOptions, viewer);
  }

  throw new Error(`Layer type is missing or layer type is not correct. Check your layer definition: ${layerOptions}`);
};

function groupLayer(options, viewer) {
  if ('layers' in options) {
    const layers = options.layers.map(layer => Layer(layer, viewer));

    const layerOptions = {};
    layerOptions.layers = layers;
    return group(Object.assign({}, options, layerOptions));
  }

  throw new Error('Group layer has no layers');
}

type.GROUP = groupLayer;

export default Layer;
