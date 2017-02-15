/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
 "use strict";

var $ = require('jquery');
var utils = require('./utils');
var drawToolbar = require('./draw/drawtoolbar');

var $drawButton;

module.exports = function() {

  return {
    init: Init
  };
}();

function Init(options) {
  render();
  $drawButton = $('#o-draw-button');
  bindUIActions();
  drawToolbar.init(options);
}

function bindUIActions() {
  $drawButton.on('click', function(e) {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'draw'
    });
    this.blur();
    e.stopPropagation();
    e.preventDefault();
  });
}

function render() {
  var el = utils.createListButton({
    id: 'o-draw',
    iconCls: 'o-icon-fa-pencil',
    src: 'css/svg/fa-icons.svg#fa-pencil',
    text: 'Rita'
  });
  $('#o-menutools').append(el);
}
