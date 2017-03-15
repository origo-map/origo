/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var Viewer = require('./viewer');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  map = Viewer.getMap();

  var scaleLine = new ol.control.ScaleLine({
    target: 'o-bottom-tools'
  });
  map.addControl(scaleLine);
}

module.exports.init = Init;
