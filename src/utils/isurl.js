/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

module.exports = function isUrl(s) {
   var regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
   return regexp.test(s);
}
