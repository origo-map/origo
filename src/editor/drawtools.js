"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function drawTools(tools, geometryType) {
  var shapeNames = {
    Polygon: 'Polygon',
    box: 'Rektangel'
  };
  var map = viewer.getMap();
  var active = false;
  var activeCls = 'o-active';
  var target = 'editor-toolbar-draw-dropdown';
  var drawTools = tools;
  if (geometryType === 'Polygon') {
    drawTools.unshift('Polygon');
  }
  var renderOptions = {
    target: target,
    selectOptions: selectionModel(drawTools),
    activeTool: drawTools[0]
  };

  if (drawTools.length > 1) {
    render(renderOptions);
    addListener(target);
  }

  function render(options) {
    var popover = createElement('div', '', {
      id: options.target,
      cls: 'o-popover'
    });
    $('#' + 'o-editor-draw').after(popover);
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    setActive(true);
  }

  function addListener() {
    $('#' + target).on('changeDropdown', function(e) {
      e.stopImmediatePropagation(e);
      dispatcher.emitChangeEditorShapes(e.dataAttribute);
      close();
    });
    $(document).on('changeEdit', onChangeEdit);
    map.once('click', close);
    // $(document).on('toggleEdit', toggleDraw);
  }

  function setActive(state) {
    if (state) {
      active = true;
      $('#' + target).addClass(activeCls);
    } else {
      active = false;
      $('#' + target).removeClass(activeCls);
    }
  }

  function close() {
    if (active) {
      setActive(false);
    }
  }

  function onChangeEdit(e) {
    if (e.tool === 'draw' && e.active === true) {
      setActive(true);
    } else if (e.tool === 'draw' && e.active === false) {
      setActive(false);
    } else if (e.tool !== 'draw' && e.active === true) {
      setActive(false);
      dispatcher.emitToggleEdit('draw', {
        active: false
      });
    }
    e.stopImmediatePropagation();
  }

  function toggleDraw(e) {
    if (e.tool === 'draw') {
      if (active) {
        setActive(false);
      }
    } else {
      setActive(false);
    }
    e.stopImmediatePropagation();
  }

  function selectionModel(toolNames) {
    var selectOptions = toolNames.map(function(toolName) {
      var obj = {};
      obj.name = shapeNames[toolName];
      obj.value = toolName;
      return obj;
    });
    return selectOptions;
  }
}
