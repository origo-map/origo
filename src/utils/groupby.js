/**
 * Groups an array of objects into groups based on a grouping function.
 * @param {any[]} list An array of objects to group
 * @param {any} keyGetter Function that creates a key to group by. Commonly an arrow function returning a field e.g. item => item.myField
 * @returns {Map} A map with the result of keyGetter as key and an array of objects as value
 */
const groupBy = (list, keyGetter) => {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
};

export default groupBy;
