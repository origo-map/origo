function emitChangeEdit(tool, state) {
  const changeEdit = new CustomEvent('', {
    detail: {
      tool,
      active: state
    }
  });
  document.dispatchEvent(changeEdit);
}

function emitChangeFeature(change) {
  const changeFeature = new CustomEvent('changeFeature', {
    detail: {
      feature: change.feature,
      layerName: change.layerName,
      action: change.action,
      status: change.status || 'pending'
    }
  });
  document.dispatchEvent(changeFeature);
}

function emitToggleEdit(tool, optOptions) {
  const options = optOptions || {};
  const defaults = {
    tool
  };
  const toggleEdit = new CustomEvent('toggleEdit', {
    detail: Object.assign(defaults, options)
  });
  document.dispatchEvent(toggleEdit);
}

function emitEnableInteraction() {
  const enableInteraction = new CustomEvent('enableInteraction', {
    detail: {
      interaction: 'editor'
    }
  });
  document.dispatchEvent(enableInteraction);
}

function emitEditsChange(edits) {
  const editsChange = new CustomEvent('editsChange', {
    detail: {
      edits
    }
  });
  document.dispatchEvent(editsChange);
}

function emitChangeEditorShapes(shape) {
  const editorShapes = new CustomEvent('editorShapes', {
    detail: {
      shape
    }
  });
  document.dispatchEvent(editorShapes);
}

function emitChangeOfflineEdits(edits, layerName) {
  const changeOfflineEdits = new CustomEvent('changeOfflineEdits', {
    detail: {
      edits,
      layerName
    }
  });
  document.dispatchEvent(changeOfflineEdits);
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
