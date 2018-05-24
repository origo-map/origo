import helpers from '../utils/templatehelpers';

export default (properties) => {
  const items = helpers.each(properties);
  return `${items.map(obj => `<li><b>${obj.prop}</b> : ${obj.value}</li>`).join('')}`;
};
