const templateHelpers = {
  if: (condition, thenTemplate, elseTemplate = '') => (condition ? thenTemplate : elseTemplate),
  each: (obj, templateFn) => {
    const props = Object.keys(obj);
    const items = props.map(prop => ({
      prop,
      value: obj[prop]
    }));
    return items.map(item => templateFn(item)).join('');
  }
};

export default templateHelpers;
