"use strict";

var sources = {};
sources.WFS = require('./wfs');
sources.GEOJSON = require('./geojson');
sources.TOPOJSON = require('./topojson');

module.exports = sources;
