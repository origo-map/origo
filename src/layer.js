import mapUtils from './maputils';
import group from './layer/group';
import type from './layer/layertype';

function onChangeVisible(e) {
  const layer = e.target;
  setTimeout(() => {
    if (layer.get('css')) {
      Object.assign(document.getElementsByClassName(layer.getClassName())[0].style, layer.get('css'));
    }
  });
}

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
    removable: undefined,
    type: undefined,
    extent: undefined,
    attributes: undefined,
    tileSize: viewer.getTileSize(),
    attachments: undefined
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

  if (layerOptions.css) {
    layerOptions.className = layerOptions.cls || `o-layer-${layerOptions.name}`;
  }

  // changePointerOnHover requires that non queryable layers are not drawn on the same canvas as queryable layers.
  // OL will merge layers to the same canvas if they have the same class and some other reconcilable properties.
  // Note that the merge preserves layer ordering, so if a layer can not use same canvas as previous layer, a new
  // canvas will be created, so keep layers with same properties together.
  // Make sure that queryable layers get a class name to avoid merging with non queryable layers.
  // A unique class would be best, but produces a new canvas for each layer, which could affect the
  // performance.
  // If user has configured a className then keep it and let the user take the consequences if they mix queryable and non queryable layers.
  if (viewer.getViewerOptions().featureinfoOptions.changePointerOnHover && layerOptions.queryable && !layerOptions.className) {
    layerOptions.className = 'o-layer-queryable';
  }

  if (layerOptions.type) {
    const layer = type[layerOptions.type](layerOptions, viewer);
    layer.once('postrender', onChangeVisible);
    return layer;
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
