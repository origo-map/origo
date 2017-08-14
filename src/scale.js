"use strict";

var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');
var numberFormatter = require('./utils/numberformatter');

var controlId = 'o-scale';
var consoleId;
var map;
var $console;
var isActive;
var scaleText;

function Init(opt_options) {
  var options = opt_options || {};
  map = Viewer.getMap();
  consoleId = Viewer.getConsoleId();
  scaleText = options.scaleText || 'Skala 1:';
  var initialState = options.hasOwnProperty('isActive') ? options.isActive : true;

  setActive(initialState);
  render();

  return {
    setActive: setActive
  }
}

function render() {
  var container = utils.createElement('div', '', {
    id: controlId,
    style: 'display: inline-block;'
  });
  $('#' + consoleId).append(container);
}

function setActive(state) {
  if (state === true) {
    map.getView().on('change:resolution', onZoomChange);
    onZoomChange();
    isActive = true;
  } else if (state === false) {
    map.getView().un('change:resolution', onZoomChange);
    isActive = false;
  }
}

function onZoomChange(e) {
  var resolution = e ? e.target.get(e.key) : map.getView().getResolution();
  var scale = Viewer.getScale(resolution);
  $('#' + controlId).text(scaleText + numberFormatter(scale));
}

module.exports.init = Init;
