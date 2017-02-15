/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var drawtemplate = require("./drawtoolbar.template.handlebars");
var dispatcher = require('./drawdispatcher');
var drawHandler = require('./drawhandler');

var activeClass = 'o-control-active';
var disableClass = 'o-disabled';
var $drawPolygon = undefined;
var $drawLineString = undefined;
var $drawPoint = undefined;
var $drawText = undefined;
var $drawDelete = undefined;
var $drawClose = undefined;
var drawTools = undefined;

module.exports = function() {

  return {
    init: Init
  };
}()

function Init(opt_options) {
  var options = opt_options || {};

  drawHandler(options);
  render();

  $(document).on('enableInteraction', onEnableInteraction);
  $(document).on('changeDraw', changeDrawState);

  bindUIActions();

  if (options.isActive) {
    setActive(true);
    dispatcher.emitEnableInteraction();
  }
}

function render() {
  $("#o-map").append(drawtemplate());
  $drawPolygon = $('#o-draw-polygon');
  $drawLineString = $('#o-draw-polyline');
  $drawPoint = $('#o-draw-point');
  $drawText = $('#o-draw-text');
  $drawDelete = $('#o-draw-delete');
  $drawClose = $('#o-draw-close');
  drawTools = {
    Point: $drawPoint,
    LineString: $drawLineString,
    Polygon: $drawPolygon,
    Text: $drawText
  };
}

function bindUIActions() {
  $drawDelete.on('click', function(e) {
    dispatcher.emitToggleDraw('delete');
    $drawDelete.blur();
    e.preventDefault();
  });
  $drawPolygon.on('click', function(e) {
    dispatcher.emitToggleDraw('Polygon');
    $drawPolygon.blur();
    e.preventDefault();
  });
  $drawLineString.on('click', function(e) {
    dispatcher.emitToggleDraw('LineString');
    $drawLineString.blur();
    e.preventDefault();
  });
  $drawPoint.on('click', function(e) {
    dispatcher.emitToggleDraw('Point');
    $drawPoint.blur();
    e.preventDefault();
  });
  $drawText.on('click', function(e) {
    dispatcher.emitToggleDraw('Text');
    $drawText.blur();
    e.preventDefault();
  });
  $drawClose.on('click', function(e) {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'featureInfo'
    });
    $drawClose.blur();
    e.stopPropagation();
    e.preventDefault();
  });
}

function onEnableInteraction(e) {
  e.stopPropagation();
  if (e.interaction === 'draw') {
    setActive(true);
  } else {
    setActive(false);
    dispatcher.emitToggleDraw('cancel');
  }
}

function setActive(state) {
  if (state === true) {
    $('#o-draw-toolbar').removeClass('o-hidden');
  } else {
    $('#o-draw-toolbar').addClass('o-hidden');
  }
}

function changeDrawState(e) {
  var tools = Object.getOwnPropertyNames(drawTools);
  tools.forEach(function(tool) {
    if (tool === e.tool) {
      toggleState(drawTools[tool], e.active);
    } else {
      toggleState(drawTools[tool], false);
    }
  });

  function toggleState(tool, state) {
    if (state === false) {
      tool.removeClass(activeClass);
    } else {
      tool.addClass(activeClass);
    }
  }
}
