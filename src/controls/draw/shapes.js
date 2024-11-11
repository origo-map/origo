import { createBox, createRegularPolygon } from 'ol/interaction/Draw';

export default (drawType) => {
  const types = {
    box: {
      type: 'Circle',
      geometryFunction: createBox()
    },
    square: {
      type: 'Circle',
      geometryFunction: createRegularPolygon(4)
    },
    circle: {
      type: 'Circle'
    },
    freehand: {
      freehand: true
    }
  };

  if (Object.prototype.hasOwnProperty.call(types, drawType)) {
    return types[drawType];
  }
  return {};
};
