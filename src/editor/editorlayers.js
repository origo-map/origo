"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function editorLayers(editableLayers, opt_options) {
  var map = viewer.getMap();
  var active = false;
  var activeCls = 'o-active';
  var target = 'editor-toolbar-layers-dropdown';
  var defaultOptions = {
    target: target,
    selectOptions: selectionModel(editableLayers),
    activeLayer: editableLayers[0]
  };
  var renderOptions = $.extend(defaultOptions, opt_options);

  render(renderOptions);
  addListener(target);

  function render(options) {
    var popover = createElement('div', '', {
      id: options.target,
      cls: 'o-popover'
    });
    $('#' + 'o-editor-layers').after(popover);
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'layer',
      active: options.activeLayer
    });
  }

  function addListener() {
    $('#' + target).on('changeDropdown', function(e) {
      e.stopImmediatePropagation(e);
      dispatcher.emitToggleEdit('edit', {
        currentLayer: e.dataAttribute
      });
    });
    $(document).on('toggleEdit', toggleEdit);
    map.getView().on('change:center', close);
    map.on('click', close);
  }

  function toggleEdit(e) {
    if (e.tool === 'layers') {
      if (active) {
        active = false;
        $('#' + target).removeClass(activeCls);
      } else {
        active = true;
        $('#' + target).addClass(activeCls);
      }
    }
    dispatcher.emitChangeEdit('layers', active);
    e.stopImmediatePropagation();
  }

  function close() {
    if (active) {
      active = false;
      $('#' + target).removeClass(activeCls);
      dispatcher.emitChangeEdit('layers', false);
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
}
