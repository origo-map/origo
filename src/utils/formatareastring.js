/**
 *Creates a pre-formatted string with a rounded value and unit depending on size
 * @param {any} area The area in m2
 * @param {any} opts
 */
function formatAreaString(area, opts = {}) {
  const {
    useHectare = true,
    decimals
  } = opts;
  let result = area;
  let unit = 'm<sup>2</sup>';
  if (result > 10000000) {
    result /= 1000000;
    unit = 'km<sup>2</sup>';
  } else if (result > 10000 && useHectare) {
    result /= 10000;
    unit = 'ha';
  }
  if (decimals !== undefined) {
    result = result.toFixed(decimals);
  }
  const retstr = `${result} ${unit}`;
  return retstr;
}

export default formatAreaString;
