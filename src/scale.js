/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('./viewer');
var numberFormatter = require('./utils/numberformatter');

var map;
var $console;
var isActive;
var scaleText;

function Init(opt_options) {
  var options = opt_options || {};
  map = Viewer.getMap();
  $console = $('#' + Viewer.getConsoleId());
  scaleText = options.scaleText || '1:';
  var initialState = options.hasOwnProperty('isActive') ? options.isActive : true;

  setActive(initialState);

  return {
    setActive: setActive
  }
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
  $console.text(scaleText + numberFormatter(scale));
}

module.exports.init = Init;
