/**
 * Finds and returns a value from a JSON string using simple dot-notation.
 *
 * @param {string} jsonstring A string containing JSON
 * @param {string} key A key to the target value using simple dot-notation, e g "myobject.firstchild[1].targetvalue"
 * @returns {string} The value found
 */
export default function searchjson(jsonstring, key) {
  const keys = key.split(/[.[\]]/).filter((k) => k !== '');
  let result = JSON.parse(jsonstring) || jsonstring;

  while (keys.length && result != null) {
    result = result[keys.shift()];
  }
  return result;
}
