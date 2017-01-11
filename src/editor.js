/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
 "use strict";

var $ = require('jquery');
var utils = require('./utils');
var editortoolbar = require('./editortoolbar');

var $editorButton;

module.exports = function() {

  return {
    init: Init
  };
}();

function Init(options) {
  render();
  $editorButton = $('#o-editor-button');
  bindUIActions();
  editortoolbar.init(options);
}

function bindUIActions() {
  $editorButton.on('click', function(e) {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'editor'
    });
    this.blur();
    e.stopPropagation();
    e.preventDefault();
  });
}

function render() {
  var el = utils.createListButton({
    id: 'o-editor',
    iconCls: 'o-icon-fa-pencil',
    src: 'css/svg/fa-icons.svg#fa-pencil',
    text: 'Redigera'
  });
  $('#o-menutools').append(el);
}
