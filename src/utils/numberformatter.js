"use strict";

module.exports = function numberFormatter(numberToFormat) {
  var nr = numberToFormat;
  var length = nr.toString().length;
  if (length > 3) {
    var delimiter = ' '; //white space as delimiter

    //Round by factor
    if (nr >= 1000) {
      var factor = Math.pow(10, length) / 10000;
      nr = Math.round(nr / factor) * factor;
    }

    var nrStr = nr.toString();
    var a = [];
    while (nrStr.length > 3) {
      var n = nrStr.substr(nrStr.length - 3);
      a.unshift(n);
      nrStr = nrStr.substr(0, nrStr.length - 3);
    }
    if (nrStr.length > 0) {
      a.unshift(nrStr);
    }
    nrStr = a.join(delimiter);
    return nrStr;
  } else {
    return nr.toString();
  }
}
