"use strict";

var $ = require('jquery');

module.exports = {
  emitChangeEdit: emitChangeEdit,
  emitChangeFeature: emitChangeFeature,
  emitToggleEdit: emitToggleEdit,
  emitEnableInteraction: emitEnableInteraction,
  emitEditsChange: emitEditsChange,
  emitChangeEditorShapes: emitChangeEditorShapes,
  emitChangeOfflineEdits: emitChangeOfflineEdits
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

function emitChangeEditorShapes(shape) {
  $.event.trigger({
    type: 'editorShapes',
    shape: shape
  });
}

function emitChangeOfflineEdits(edits, layerName) {
  $.event.trigger({
    type: 'changeOfflineEdits',
    edits: edits,
    layerName: layerName
  });
}
