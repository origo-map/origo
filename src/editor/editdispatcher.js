import $ from 'jquery';

function emitChangeEdit(tool, state) {
  $.event.trigger({
    type: 'changeEdit',
    tool,
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

function emitToggleEdit(tool, optOptions) {
  const options = optOptions || {};
  const e = {
    type: 'toggleEdit',
    tool
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
    edits
  });
}

function emitChangeEditorShapes(shape) {
  $.event.trigger({
    type: 'editorShapes',
    shape
  });
}

function emitChangeOfflineEdits(edits, layerName) {
  $.event.trigger({
    type: 'changeOfflineEdits',
    edits,
    layerName
  });
}


export default {
  emitChangeEdit,
  emitChangeFeature,
  emitToggleEdit,
  emitEnableInteraction,
  emitEditsChange,
  emitChangeEditorShapes,
  emitChangeOfflineEdits
};
