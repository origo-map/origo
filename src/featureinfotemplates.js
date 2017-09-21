"use strict";
var templates = {};
templates.default = require("./templates/featureinfotemplates/default");

function featureinfotemplates(template, attributes) {
    return templates[template](attributes);
}
module.exports = featureinfotemplates;
