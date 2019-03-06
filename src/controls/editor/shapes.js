import { createBox } from 'ol/interaction/Draw';

export default (drawType) => {
  const types = {
    box: {
      type: 'Circle',
      geometryFunction: createBox()
    }
  };

  if (Object.prototype.hasOwnProperty.call(types, drawType)) {
    return types[drawType];
  }
  return {};
};
