"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function editorLayers(editableLayers, opt_options) {
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
      setActive(false);
      dispatcher.emitToggleEdit('edit', {
        currentLayer: e.dataAttribute
      });
    });
    $(document).on('toggleEdit', onToggleEdit);
    $(document).on('changeEdit', onChangeEdit);
  }

  function onToggleEdit(e) {
    if (e.tool === 'layers') {
      if (active) {
        setActive(false);
      } else {
        setActive(true);
      }
    }
    e.stopPropagation();
  }

  function onChangeEdit(e) {
    if (e.tool !== 'layers' && e.active === true) {
      setActive(false);
    }
    e.stopPropagation();
  }

  function setActive(state) {
    if (state) {
      active = true;
      $('#' + target).addClass(activeCls);
    } else {
      active = false;
      $('#' + target).removeClass(activeCls);
    }
    dispatcher.emitChangeEdit('layers', active);
  }

  function close() {
    if (active) {
      setActive(false);
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
