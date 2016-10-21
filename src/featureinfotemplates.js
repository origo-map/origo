/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var templates = {};
templates.default = require("./templates/featureinfotemplates/default");

function featureinfotemplates(template, attributes) {
    return templates[template](attributes);
}
module.exports = featureinfotemplates;
