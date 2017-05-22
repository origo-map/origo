"use strict";

var $ = require('jquery');
var viewer = require('../viewer');
var dropDown = require('../dropdown');
var dispatcher = require('./editdispatcher');
var createElement = require('../utils').createElement;

module.exports = function drawTools(tools, opt_options) {
  var map = viewer.getMap();
  var active = false;
  var activeCls = 'o-active';
  var target = 'editor-toolbar-draw-dropdown';
  var drawTools = tools || ['box'];
  var defaultOptions = {
    target: target,
    selectOptions: selectionModel(drawTools),
    activeTool: drawTools[0]
  };
  var renderOptions = $.extend(defaultOptions, opt_options);

  render(renderOptions);
  addListener(target);

  function render(options) {
    var popover = createElement('div', '', {
      id: options.target,
      cls: 'o-popover'
    });
    $('#' + 'o-editor-draw').after(popover);
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'draw',
      active: options.activeTool
    });
  }

  function addListener() {
    $('#' + target).on('changeDropdown', function(e) {
      e.stopImmediatePropagation(e);
      dispatcher.emitToggleEdit('draw', {
        currentLayer: e.dataAttribute
      });
    });
    $(document).on('toggleEdit', toggleEdit);
    map.getView().on('change:center', close);
    map.on('click', close);
  }

  function toggleEdit(e) {
    if (e.tool === 'draw') {
      if (active) {
        setActive(false);
      } else {
        setActive(true);
      }
    } else if(e.tool !== 'edit'){
      setActive(false);
    }
    e.stopImmediatePropagation();
  }

  function setActive(state) {
    if (state && drawTools.length) {
      active = true;
      $('#' + target).addClass(activeCls);
    } else {
      active = false;
      $('#' + target).removeClass(activeCls);
    }
    dispatcher.emitChangeEdit('draw', active);
  }

  function close() {
    if (active) {
      setActive(false);
    }
  }

  function selectionModel(tools) {
    var selectOptions = tools.map(function(tool) {
      var obj = {};
      obj.name = tool;
      obj.value = tool;
      return obj;
    });
    return selectOptions;
  }
}
