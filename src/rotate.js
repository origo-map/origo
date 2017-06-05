"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');

var map;

function Init(opt_options) {
  var options = opt_options || {};
  var rotateControl;
  var icon = utils.createSvg({
    href: '#origo-compass',
    cls: 'o-icon-compass'
  });
  map = Viewer.getMap();

  rotateControl = new ol.control.Rotate({
    label: $.parseHTML('<span>' + icon + '</span>')[0],
    tipLabel: ' ',
    target: 'o-toolbar-misc'
  });
  map.addControl(rotateControl);
}

module.exports.init = Init;
