import Draw from 'ol/interaction/draw';

export default (drawType) => {
  const types = {
    box: {
      type: 'Circle',
      geometryFunction: Draw.createBox()
    }
  };

  if (Object.prototype.hasOwnProperty.call(types, drawType)) {
    return types[drawType];
  }
  return {};
};
