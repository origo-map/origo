/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var defaultTemplate = require("./default.handlebars");

module.exports = function(attributes) {
  return defaultTemplate(attributes);
}
