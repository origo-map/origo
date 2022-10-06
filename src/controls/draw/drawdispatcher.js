import drawHandler from './drawhandler';

function emitToggleDraw(tool, optOptions) {
  const options = optOptions || {};
  const defaults = {
    tool
  };
  const toggleDraw = new CustomEvent('toggleDraw', {
    detail: Object.assign(defaults, options)
  });
  document.dispatchEvent(toggleDraw);
}

function emitChangeDraw(tool, state) {
  const changeDraw = new CustomEvent('changeDraw', {
    detail: {
      tool,
      active: state
    }
  });
  document.dispatchEvent(changeDraw);
}

function emitEnableDrawInteraction() {
  if (!drawHandler.isActive()) {
    const enableInteraction = new CustomEvent('enableInteraction', {
      detail: {
        interaction: 'draw'
      }
    });
    document.dispatchEvent(enableInteraction);
  }
}

function emitDisableDrawInteraction() {
  drawHandler.getSelection().clear();
  const enableInteraction = new CustomEvent('enableInteraction', {
    detail: {
      interaction: 'featureInfo'
    }
  });
  document.dispatchEvent(enableInteraction);
}

function emitChangeEditorDrawType(tool, drawType) {
  const changeEdit = new CustomEvent('editorDrawTypes', {
    detail: {
      tool,
      drawType
    }
  });
  document.dispatchEvent(changeEdit);
}

export default {
  emitToggleDraw,
  emitChangeDraw,
  emitEnableDrawInteraction,
  emitDisableDrawInteraction,
  emitChangeEditorDrawType
};
