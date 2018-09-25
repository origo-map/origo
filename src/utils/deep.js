/**
 * Helper for making deep copies of objects.
 * @param {*} object 
 */
const deep = function deep(object) {
  return JSON.parse(JSON.stringify(object));
};

export default deep;
