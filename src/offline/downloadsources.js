/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

var sources = {};
sources.WFS = require('./wfs');
sources.GEOJSON = require('./geojson');
sources.TOPOJSON = require('./topojson');

module.exports = sources;
