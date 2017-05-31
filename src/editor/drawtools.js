"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function drawTools(tools, defaultLayer) {
  var toolNames = {
    Polygon: 'Polygon',
    Point: 'Punkt',
    Line: 'Linje',
    box: 'Rektangel'
  };
  var defaultTools = tools || {};
  var drawTools = undefined;
  var currentLayer = defaultLayer;
  var map = viewer.getMap();
  var active = false;
  var activeCls = 'o-active';
  var target = 'editor-toolbar-draw-dropdown';
  render();
  addListener();

  function render() {
    var popover = createElement('div', '', {
      id: target,
      cls: 'o-popover'
    });
    $('#' + 'o-editor-draw').after(popover);
    setActive(false);
  }

  function addDropDown(options) {
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    $('#' + target).on('changeDropdown', function(e) {
      e.stopImmediatePropagation(e);
      dispatcher.emitChangeEditorShapes(e.dataAttribute);
      close();
    });
  }

  function addListener() {
    $(document).on('changeEdit', onChangeEdit);
    $(document).on('toggleEdit', onToggleEdit);
  }

  function setActive(state) {
    if (state) {
      if (drawTools.length > 1) {
        active = true;
        $('#' + target + ' ul').remove();
        addDropDown(createDropDownOptions());
        $('#' + target).addClass(activeCls);
        map.once('click', close);
      }
    } else {
      active = false;
      $('#' + target).removeClass(activeCls);
      map.un('click', close);
    }
  }

  function close() {
    if (active) {
      setActive(false);
    }
  }

  function onChangeEdit(e) {
    if (e.tool === 'draw' && e.active === true) {
      setDrawTools(currentLayer);
      setActive(true);
    } else if (e.tool === 'draw' && e.active === false) {
      setActive(false);
    }
    e.stopPropagation();
  }

  function onToggleEdit(e) {
    if (e.tool === 'edit' && e.currentLayer) {
      currentLayer = e.currentLayer;
    }
    e.stopPropagation();
  }

  function setDrawTools(layerName) {
    var layer = viewer.getLayer(layerName);
    var geometryType;
    drawTools = layer.get('drawTools') || [];
    if (layer.get('drawTools')) {
      drawTools = layer.get('drawTools');
    } else {
      geometryType = layer.get('geometryType');
      drawTools = defaultTools[geometryType] ? defaultTools[geometryType].slice(0) : [];
      drawTools.unshift(geometryType);
    }
  }

  function createDropDownOptions() {
    return {
      target: target,
      selectOptions: selectionModel(drawTools),
      activeTool: drawTools[0]
    };
  }

  function selectionModel(drawTools) {
    var selectOptions = drawTools.map(function(drawTool) {
      var obj = {};
      obj.name = toolNames[drawTool];
      obj.value = drawTool;
      return obj;
    });
    return selectOptions;
  }
}
