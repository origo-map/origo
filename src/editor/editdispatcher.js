/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = {
  emitChangeEdit: emitChangeEdit,
  emitChangeFeature: emitChangeFeature,
  emitToggleEdit: emitToggleEdit,
  emitEnableInteraction: emitEnableInteraction,
  emitEditsChange: emitEditsChange
}

function emitChangeEdit(tool, state) {
  $.event.trigger({
    type: 'changeEdit',
    tool: tool,
    active: state
  });
}

function emitChangeFeature(change) {
  $.event.trigger({
    type: 'changeFeature',
    feature: change.feature,
    layerName: change.layerName,
    action: change.action,
    status: change.status || 'pending'
  });
}

function emitToggleEdit(tool, opt_options) {
  var options = opt_options || {};
  var e = {
    type: 'toggleEdit',
    tool: tool
  };
  $.extend(e, options);
  $.event.trigger(e);
}

function emitEnableInteraction() {
  $.event.trigger({
    type: 'enableInteraction',
    interaction: 'editor'
  });
}

function emitEditsChange(edits) {
  $.event.trigger({
    type: 'editsChange',
    edits: edits
  });
}
