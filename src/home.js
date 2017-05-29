"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');

var map;
var tooltip;
var extent;

function Init(opt_options) {
  var options = opt_options || {};
  var target = options.target || '#o-toolbar-navigation';
  map = Viewer.getMap();
  tooltip = options.tooltipText || 'Zooma till hela kartan';
  extent = options.extent || map.getView().calculateExtent(map.getSize());
  render(target);
  bindUIActions();
}

function render(target) {
  var el = utils.createButton({
    id: 'o-home-button',
    iconCls: 'o-icon-fa-home',
    src: '#fa-home',
    tooltipText: tooltip
  });
  $(target).append(el);
}

function bindUIActions() {
  $('#o-home-button').on('click', function(e) {
    map.getView().fit(extent);
    $('#o-home-button button').blur();
    e.preventDefault();
  });
}

module.exports.init = Init;
