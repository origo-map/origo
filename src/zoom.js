/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  var zoomControl;
  map = Viewer.getMap();

  zoomControl = new ol.control.Zoom({
    zoomInTipLabel: ' ',
    zoomOutTipLabel: ' ',
    zoomInLabel: $.parseHTML('<svg class="o-icon-fa-plus"><use xlink:href="#fa-plus"></use></svg>')[0],
    zoomOutLabel: $.parseHTML('<svg class="o-icon-fa-minus"><use xlink:href="#fa-minus"></use></svg>')[0]
  });
  map.addControl(zoomControl);
}

module.exports.init = Init;
