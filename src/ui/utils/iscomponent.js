const isComponent = (target) => {
  if (typeof target === 'object' && target !== null) {
    if (target.on && target.getId) {
      return true;
    }
  }
  return false;
};

export default isComponent;
