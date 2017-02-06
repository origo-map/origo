/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

module.exports = function trimUrl(url) {
  var trimmed;
  if (url.substring(url.lastIndexOf('/')).indexOf('.htm') !== -1) {
    trimmed = url.substring(0, url.lastIndexOf('/') + 1);
  } else if (url.substr(url.length - 1) !== '/') {
    trimmed = url + '/';
  } else {
    trimmed = url;
  }
  return trimmed;
}
