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
  var attribution;
  map = Viewer.getMap();

  attribution = new ol.control.Attribution({
    collapsible: false
  });

  map.addControl(attribution);

  $(window).on('resize', checkSize);
  checkSize();

  function checkSize() {
    var small = map.getSize()[0] < 768;
    attribution.setCollapsible(small);
    attribution.setCollapsed(small);
  }
}

module.exports.init = Init;
