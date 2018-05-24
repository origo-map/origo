const templateHelpers = {
  if: (condition, thenTemplate, elseTemplate = '') => (condition ? thenTemplate : elseTemplate),
  each: (obj) => {
    const props = Object.keys(obj);
    return props.map(prop => ({
      prop,
      value: obj[prop]
    }));
  }
};

export default templateHelpers;
