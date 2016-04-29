/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var defaultTemplate = require("./default.handlebars");

module.exports = function(attributes) {
  return defaultTemplate(attributes);
}
