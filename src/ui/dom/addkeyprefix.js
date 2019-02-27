export default (prefix, obj) => Object.keys(obj).reduce((prev, curr) => {
  prev[prefix + curr] = obj[curr]
  return prev;
}, {});
