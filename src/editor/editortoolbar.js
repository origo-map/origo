/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var editortemplate = require("../templates/editortoolbar.template.handlebars");
var dispatcher = require('./editdispatcher');
var editHandler = require('./edithandler');

var activeClass = 'o-control-active';
var disableClass = 'o-disabled';
var currentLayer = undefined;
var editableLayers = undefined;
var $editAttribute = undefined;
var $editDraw = undefined;
var $editDelete = undefined;
var $editSave = undefined;
var $editClose = undefined;

module.exports = function() {

  return {
    init: Init
  };
}()

function Init(options) {
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;

  editHandler(options);
  render(selectionModel(editableLayers));

  $(document).on('enableInteraction', onEnableInteraction);
  $(document).on('changeEdit', toggleState);
  $(document).on('editsChange', toggleSave);

  bindUIActions();

  if (options.isActive) {
    setActive(true);
  }
}

function render(selectOptions) {
  $("#o-map").append(editortemplate(selectOptions));
  $editAttribute = $('#o-editor-attribute');
  $editDraw = $('#o-editor-draw');
  $editDelete = $('#o-editor-delete');
  $editSave = $('#o-editor-save');
  $editClose = $('#o-editor-close');
}

function bindUIActions() {
  var self = this;
  $editDraw.on('click', function(e) {
    dispatcher.emitToggleEdit('draw');
    $editDraw.blur();
    e.preventDefault();
    return false;
  });
  $editAttribute.on('click', function(e) {
    dispatcher.emitToggleEdit('attribute');
    $editAttribute.blur();
    e.preventDefault();
  });
  $editDelete.on('click', function(e) {
    dispatcher.emitToggleEdit('delete');
    $editDelete.blur();
    e.preventDefault();
  });
  $editSave.on('click', function(e) {
    dispatcher.emitToggleEdit('save');
    $editSave.blur();
    e.preventDefault();
  });
  $editClose.on('click', function(e) {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'featureInfo'
    });
    $editClose.blur();
    e.stopPropagation();
    e.preventDefault();
  });
  $('select[name="layer-dropdown"]').change(function() {
    currentLayer = $(this).val();
    dispatcher.emitToggleEdit('edit', {
      currentLayer: currentLayer
    });
  });
}

function onEnableInteraction(e) {
  e.stopPropagation();
  if (e.interaction === 'editor') {
    setActive(true);
    dispatcher.emitToggleEdit('edit', {
      currentLayer: currentLayer
    });
  } else {
    setActive(false);
    dispatcher.emitToggleEdit('cancel');
  }
}

function setActive(state) {
  if (state === true) {
    $('#o-editor-toolbar').removeClass('o-hidden');
  } else {
    $('#o-editor-toolbar').addClass('o-hidden');
  }
}

function selectionModel(layerNames) {
  var selectOptions = layerNames.map(function(layerName) {
    var obj = {};
    obj.name = viewer.getLayer(layerName).get('title');
    obj.value = layerName;
    return obj;
  });
  return selectOptions;
}

function toggleState(e) {
  if (e.tool === 'draw') {
    if (e.active === false) {
      $editDraw.removeClass(activeClass);
    } else {
      $editDraw.addClass(activeClass);
    }
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
