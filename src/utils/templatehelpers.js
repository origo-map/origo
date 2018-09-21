function nested(object) {
  if (typeof object === 'object' && object !== null && object !== 'undefined') {
    if (object.length === 0) {
      return '[ ]';
    }
    const res = object.map((item) => {
      let template;
      Object.keys(item).map((key) => {
        template += `<li>&ensp;<b>${key}</b>: ${item[key]}</li>`;
      });
      return `${template.split('undefined').join().substring(1)}`;
    });
    return `[ ${res} ]`;
  }
  return object;
}
const templateHelpers = {
  if: (condition, thenTemplate, elseTemplate = '') => (condition ? thenTemplate : elseTemplate),
  each: (obj, templateFn) => {
    const props = Object.keys(obj);
    const items = props.map(prop => ({
      prop,
      value: nested(obj[prop])
    }));
    return items.map(item => templateFn(item)).join('');
  }
};

export default templateHelpers;
