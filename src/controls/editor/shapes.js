import { createBox } from 'ol/interaction/Draw';

export default (drawType) => {
  const types = {
    box: {
      type: 'Circle',
      geometryFunction: createBox()
    },
    Line: {
      type: 'LineString'
    },
    Polygon: {
      type: 'Polygon'
    },
    Point: {
      type: 'Point'
    }
  };

  if (Object.prototype.hasOwnProperty.call(types, drawType)) {
    return types[drawType];
  }
  return {};
};
