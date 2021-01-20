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

function setActive(state) {
  if (state === true) {
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

function init(options, v) {
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;

  editHandler(options, v);
  render();
  editorLayers(editableLayers, {
    activeLayer: currentLayer
  }, v);
  drawTools(options.drawTools, currentLayer, v);

  document.addEventListener('enableInteraction', onEnableInteraction);
  document.addEventListener('changeEdit', onChangeEdit);
  document.addEventListener('editsChange', toggleSave);

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
