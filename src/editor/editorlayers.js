/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function editorLayers(editableLayers, activeLayer) {
  var target = 'editor-toolbar-layers-dropup';
  var selectOptions = selectionModel(editableLayers);

  render(target, selectOptions, activeLayer);
  addListener(target);

  dispatcher.emitChangeEdit('layers', true);
}

function render(target, selectOptions, activeLayer) {
  var popover = createElement('div', '', {
    id: target,
    cls: 'o-popover'
  });
  $('#' + 'o-editor-layers').after(popover);
  dropDown(target, selectOptions, {
    dataAttribute: 'layer',
    active: activeLayer
  });
}

function addListener(target) {
  $('#' + target).on('changeDropdown', function(e) {
    e.stopImmediatePropagation(e);
    dispatcher.emitToggleEdit('edit', {
      currentLayer: e.dataAttribute
    });
  });
  $(document).on('toggleEdit', toggleEdit);
}

function toggleEdit(e) {
  if (e.tool === 'layers') {
    dispatcher.emitChangeEdit('layers', false);
    e.stopImmediatePropagation();
    $('#editor-toolbar-layers-dropup').remove();
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
