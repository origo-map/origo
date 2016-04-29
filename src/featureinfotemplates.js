/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var templates = {};
templates.default = require("./templates/featureinfotemplates/default");

function featureinfotemplates(template, attributes) {
    return templates[template](attributes);
}
module.exports = featureinfotemplates;
