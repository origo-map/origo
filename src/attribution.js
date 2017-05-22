"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  var breakPoint = options.breakPoint || [768, 500];
  var attribution;
  map = Viewer.getMap();

  attribution = new ol.control.Attribution({
    collapsible: false
  });

  map.addControl(attribution);

  $(window).on('resize', checkSize);
  checkSize();

  function checkSize() {
    var mapSize = map.getSize();
    var collapsed = (mapSize[0] <= breakPoint[0] || mapSize[1] <= breakPoint[1]);
    attribution.setCollapsible(collapsed);
    attribution.setCollapsed(collapsed);
  }
}

module.exports.init = Init;
