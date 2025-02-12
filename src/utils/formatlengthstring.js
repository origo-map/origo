/**
 * Creates a pre-formatted string with a rounded value and unit depending on length
 * @param {any} length Length in meters
 * @param {any} opts
 */
function formatLengthString(length, opts = {}) {
  const {
    decimals,
    localization
  } = opts;
  const localeNumberFormat = new Intl.NumberFormat(localization.getCurrentLocaleId());
  let result = length;
  let unit = 'm';
  if (result > 1000) {
    result /= 1000;
    unit = 'km';
  }

  if (decimals !== undefined) {
    result = localeNumberFormat.format(result.toFixed(decimals));
  }
  const retstr = `${result} ${unit}`;
  return retstr;
}

export default formatLengthString;
