export default function numberFormatter(numberToFormat, localization) {
  let nr = numberToFormat;
  const length = nr.toString().length;

  // Round (by factor)
  if (length > 3) {
    const factor = 10 ** (length - 3);
    nr = Math.round(nr / factor) * factor;
  }

  // Format acc to locale if localization object was provided
  if (localization) {
    const formatter = new Intl.NumberFormat(localization.getCurrentLocaleId());
    nr = formatter.format(nr);
  }
  return nr;
}
