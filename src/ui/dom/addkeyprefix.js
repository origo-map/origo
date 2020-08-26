export default (prefix, obj) => Object.keys(obj).reduce((prev, curr) => {
  // eslint-disable-next-line no-param-reassign
  prev[prefix + curr] = obj[curr];
  return prev;
}, {});
