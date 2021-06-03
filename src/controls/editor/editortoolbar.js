import editortemplate from './editortemplate';
import dispatcher from './editdispatcher';
import editHandler from './edithandler';
import editorLayers from './editorlayers';
import drawTools from './drawtools';

const activeClass = 'o-control-active';
const disableClass = 'o-disabled';
let currentLayer;
let editableLayers;
let $editAttribute;
let $editDraw;
let $editDelete;
let $editLayers;
let $editSave;
let viewer;

function render() {
  const { body: editortemplateHTML } = new DOMParser().parseFromString(editortemplate, 'text/html');
  document.getElementById('o-tools-bottom').appendChild(editortemplateHTML);
  $editAttribute = document.getElementById('o-editor-attribute');
  $editDraw = document.getElementById('o-editor-draw');
  $editDelete = document.getElementById('o-editor-delete');
  $editLayers = document.getElementById('o-editor-layers');
  $editSave = document.getElementById('o-editor-save');
}

function toggleToolbar(state) {
  if (state) {
    const enableInteraction = new CustomEvent('enableInteraction', {
      bubbles: true,
      detail: {
        interaction: 'editor'
      }
    });
    document.querySelectorAll('.o-map')[0].dispatchEvent(enableInteraction);
  } else {
    const enableInteraction = new CustomEvent('enableInteraction', {
      bubbles: true,
      detail: {
        interaction: 'featureInfo'
      }
    });
    document.querySelectorAll('.o-map')[0].dispatchEvent(enableInteraction);
  }
}

function bindUIActions() {
  $editDraw.addEventListener('click', (e) => {
    dispatcher.emitToggleEdit('draw');
    $editDraw.blur();
    e.preventDefault();
    return false;
  });
  $editAttribute.addEventListener('click', (e) => {
    dispatcher.emitToggleEdit('attribute');
    $editAttribute.blur();
    e.preventDefault();
  });
  $editDelete.addEventListener('click', (e) => {
    dispatcher.emitToggleEdit('delete');
    $editDelete.blur();
    e.preventDefault();
  });
  $editLayers.addEventListener('click', (e) => {
    dispatcher.emitToggleEdit('layers');
    $editLayers.blur();
    e.preventDefault();
  });
  $editSave.addEventListener('click', (e) => {
    dispatcher.emitToggleEdit('save');
    $editSave.blur();
    e.preventDefault();
  });
}

/**
 * Sets visibility of the tools in the toolbar according to the current layer's configuration.
 * Note that it only sets the visibility of the the tools in the toolbar, it does not enforce anything.
 * */
function setAllowedTools() {
  const layer = viewer.getLayer(currentLayer);
  const allowedOperations = layer.get('allowedEditOperations');
  if (allowedOperations && !allowedOperations.includes('updateAttributes')) {
    $editAttribute.classList.add('o-hidden');
  } else {
    $editAttribute.classList.remove('o-hidden');
  }
  if (allowedOperations && !allowedOperations.includes('create')) {
    $editDraw.classList.add('o-hidden');
  } else {
    $editDraw.classList.remove('o-hidden');
  }
  if (allowedOperations && !allowedOperations.includes('delete')) {
    $editDelete.classList.add('o-hidden');
  } else {
    $editDelete.classList.remove('o-hidden');
  }
}

function setActive(state) {
  if (state === true) {
    setAllowedTools();
    document.getElementById('o-editor-toolbar').classList.remove('o-hidden');
  } else {
    document.getElementById('o-editor-toolbar').classList.add('o-hidden');
  }
}

function onEnableInteraction(e) {
  const { detail: { interaction } } = e;
  e.stopPropagation();
  if (interaction === 'editor') {
    setActive(true);
    dispatcher.emitToggleEdit('edit', {
      currentLayer
    });
  } else {
    setActive(false);
    dispatcher.emitToggleEdit('cancel');
  }
}

function onChangeEdit(e) {
  const { detail: { tool, active } } = e;
  if (tool === 'draw') {
    if (active === false) {
      $editDraw.classList.remove(activeClass);
    } else {
      $editDraw.classList.add(activeClass);
    }
  }
  if (tool === 'layers') {
    if (active === false) {
      $editLayers.classList.remove(activeClass);
    } else {
      $editLayers.classList.add(activeClass);
    }
  } else if (active) {
    $editLayers.classList.remove(activeClass);
  }
}

function toggleSave(e) {
  const { detail: { edits } } = e;
  if (edits) {
    if ($editSave.classList.contains(disableClass)) {
      $editSave.classList.remove(disableClass);
    }
  } else {
    $editSave.classList.add(disableClass);
  }
}

/**
 * Called when toggleEdit event is raised
 * @param {any} e Custom event
 */
function onToggleEdit(e) {
  const { detail: { tool } } = e;
  // If the event contains a currentLayer, the currentLayer has either changed
  // or the editor toolbar is activated and should display the last edited layer or default if first time
  if (tool === 'edit' && e.detail.currentLayer) {
    currentLayer = e.detail.currentLayer;
    setAllowedTools();
  }
  e.stopPropagation();
}

function init(options, v) {
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;
  // Keep a reference to viewer. Used later.
  viewer = v;
  editHandler(options, v);
  render();
  editorLayers(editableLayers, {
    activeLayer: currentLayer
  }, v);
  drawTools(options.drawTools, currentLayer, v);

  document.addEventListener('enableInteraction', onEnableInteraction);
  document.addEventListener('changeEdit', onChangeEdit);
  document.addEventListener('editsChange', toggleSave);
  document.addEventListener('toggleEdit', onToggleEdit);

  bindUIActions();

  if (options.isActive) {
    setActive(true);
  }
}

export default (function exportInit() {
  return {
    init,
    toggleToolbar
  };
}());
