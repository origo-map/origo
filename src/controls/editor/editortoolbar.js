
import $ from 'jquery';
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
let $editClose;

function render() {
  $('#o-tools-bottom').append(editortemplate);
  $editAttribute = $('#o-editor-attribute');
  $editDraw = $('#o-editor-draw');
  $editDelete = $('#o-editor-delete');
  $editLayers = $('#o-editor-layers');
  $editSave = $('#o-editor-save');
  $editClose = $('#o-editor-close');
}

function bindUIActions() {
  $editDraw.on('click', (e) => {
    dispatcher.emitToggleEdit('draw');
    $editDraw.blur();
    e.preventDefault();
    return false;
  });
  $editAttribute.on('click', (e) => {
    dispatcher.emitToggleEdit('attribute');
    $editAttribute.blur();
    e.preventDefault();
  });
  $editDelete.on('click', (e) => {
    dispatcher.emitToggleEdit('delete');
    $editDelete.blur();
    e.preventDefault();
  });
  $editLayers.on('click', (e) => {
    dispatcher.emitToggleEdit('layers');
    $editLayers.blur();
    e.preventDefault();
  });
  $editSave.on('click', (e) => {
    dispatcher.emitToggleEdit('save');
    $editSave.blur();
    e.preventDefault();
  });
  $editClose.on('click', (e) => {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'featureInfo'
    });
    $editClose.blur();
    e.stopPropagation();
    e.preventDefault();
  });
}

function setActive(state) {
  if (state === true) {
    $('#o-editor-toolbar').removeClass('o-hidden');
  } else {
    $('#o-editor-toolbar').addClass('o-hidden');
  }
}

function onEnableInteraction(e) {
  e.stopPropagation();
  if (e.interaction === 'editor') {
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
  if (e.tool === 'draw') {
    if (e.active === false) {
      $editDraw.removeClass(activeClass);
    } else {
      $editDraw.addClass(activeClass);
    }
  }
  if (e.tool === 'layers') {
    if (e.active === false) {
      $editLayers.removeClass(activeClass);
    } else {
      $editLayers.addClass(activeClass);
    }
  } else if (e.active) {
    $editLayers.removeClass(activeClass);
  }
}

function toggleSave(e) {
  if (e.edits) {
    if ($editSave.hasClass(disableClass)) {
      $editSave.removeClass(disableClass);
    }
  } else {
    $editSave.addClass(disableClass);
  }
}

function init(options) {
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;

  editHandler(options);
  render();
  editorLayers(editableLayers, {
    activeLayer: currentLayer
  });
  drawTools(options.drawTools, currentLayer);

  $(document).on('enableInteraction', onEnableInteraction);
  $(document).on('changeEdit', onChangeEdit);
  $(document).on('editsChange', toggleSave);

  bindUIActions();

  if (options.isActive) {
    setActive(true);
  }
}

export default (function exportInit() {
  return {
    init
  };
}());
