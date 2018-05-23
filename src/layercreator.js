import $ from 'jquery';
import viewer from './viewer';
import mapUtils from './maputils';
import group from './layer/group';
import type from './layer/layertype';

const layerCreator = function layerCreator(optOptions) {
  const defaultOptions = {
    name: undefined,
    id: undefined,
    title: undefined,
    group: 'none',
    opacity: 1,
    geometryName: 'geom',
    geometryType: undefined,
    filter: undefined,
    layerType: undefined,
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
  const layerOptions = $.extend(defaultOptions, options);
  const name = layerOptions.name;
  layerOptions.minResolution = Object.prototype.hasOwnProperty.call(layerOptions, 'minScale') ? mapUtils.scaleToResolution(layerOptions.minScale, projection) : undefined;
  layerOptions.maxResolution = Object.prototype.hasOwnProperty.call(layerOptions, 'maxScale') ? mapUtils.scaleToResolution(layerOptions.maxScale, projection) : undefined;
  layerOptions.extent = layerOptions.extent || viewer.getExtent();
  layerOptions.sourceName = layerOptions.source;
  layerOptions.styleName = layerOptions.style;
  if (layerOptions.id === undefined) {
    layerOptions.id = name.split('__').shift();
  }

  layerOptions.name = name.split(':').pop();

  if (Object.prototype.hasOwnProperty.call(type, layerOptions.type)) {
    return type[layerOptions.type](layerOptions, layerCreator);
  }

  console.log('Layer type is missing or layer type is not correct. Check your layer definition: ');
  console.log(layerOptions);

  return false;
};

function groupLayer(options) {
  if (Object.prototype.hasOwnProperty.call(options, 'layers')) {
    const layers = options.layers.map(layer => layerCreator(layer));

    const layerOptions = {};
    layerOptions.layers = layers;
    return group($.extend(options, layerOptions));
  }

  console.log('Group layer has no layers');
  return false;
}

type.GROUP = groupLayer;

export default layerCreator;
