import helpers from '../utils/templatehelpers';

export default (properties) => {
  const els = `${helpers.each(properties, obj => `<li><b>${obj.prop}</b>: ${obj.value}</li>`)}`;
  return els;
};
