/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = {
  // emitChangeEdit: emitChangeEdit,
  // emitChangeFeature: emitChangeFeature,
  // emitToggleEdit: emitToggleEdit,
  emitEnableInteraction: emitEnableInteraction,
  emitToggleDraw: emitToggleDraw,
  emitChangeDraw: emitChangeDraw
}

function emitToggleDraw(tool, opt_options) {
  var options = opt_options || {};
  var e = {
    type: 'toggleDraw',
    tool: tool
  };
  $.extend(e, options);
  $.event.trigger(e);
}

function emitChangeDraw(tool, state) {
  $.event.trigger({
    type: 'changeDraw',
    tool: tool,
    active: state
  });
}

function emitEnableInteraction() {
  $('.o-map').first().trigger({
    type: 'enableInteraction',
    interaction: 'draw'
  });
}
