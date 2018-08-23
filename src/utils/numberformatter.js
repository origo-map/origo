export default function numberFormatter(numberToFormat) {
  let nr = numberToFormat;
  const length = nr.toString().length;
  if (length > 3) {
    const delimiter = ' '; // white space as delimiter

    // Round by factor
    if (nr >= 1000) {
      const factor = (10 ** length) / 10000;
      nr = Math.round(nr / factor) * factor;
    }

    let nrStr = nr.toString();
    const a = [];
    while (nrStr.length > 3) {
      const n = nrStr.substr(nrStr.length - 3);
      a.unshift(n);
      nrStr = nrStr.substr(0, nrStr.length - 3);
    }
    if (nrStr.length > 0) {
      a.unshift(nrStr);
    }
    nrStr = a.join(delimiter);
    return nrStr;
  }
  return nr.toString();
}
