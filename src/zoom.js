"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  var zoomControl;
  var target = options.target || 'o-toolbar-navigation';
  map = Viewer.getMap();

  zoomControl = new ol.control.Zoom({
    zoomInTipLabel: ' ',
    zoomOutTipLabel: ' ',
    zoomInLabel: $.parseHTML('<svg class="o-icon-fa-plus"><use xlink:href="#fa-plus"></use></svg>')[0],
    zoomOutLabel: $.parseHTML('<svg class="o-icon-fa-minus"><use xlink:href="#fa-minus"></use></svg>')[0],
    target: target
  });
  map.addControl(zoomControl);
}

module.exports.init = Init;
