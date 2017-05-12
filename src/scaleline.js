"use strict";

var ol = require('openlayers');
var Viewer = require('./viewer');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  var target = options.target || 'o-tools-bottom';
  map = Viewer.getMap();

  var scaleLine = new ol.control.ScaleLine({
    target: target
  });
  map.addControl(scaleLine);
}

module.exports.init = Init;
