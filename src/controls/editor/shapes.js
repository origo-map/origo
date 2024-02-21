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
    MultiLine: {
      type: 'MultiLineString'
    },
    Polygon: {
      type: 'Polygon'
    },
    MultiPolygon: {
      type: 'MultiPolygon'
    },
    Point: {
      type: 'Point'
    },
    MultiPoint: {
      type: 'MultiPoint'
    }
  };

  if (Object.prototype.hasOwnProperty.call(types, drawType)) {
    return types[drawType];
  }
  return {};
};
