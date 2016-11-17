/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var isUrl = require('./isurl');

//Checks if str is a valid url. If not append str to baseUrl
module.exports = function validateUrl(str, baseUrl) {
   var url = isUrl(str) ? str : baseUrl + str;
   return url;
}
