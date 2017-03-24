/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var utils = require('./utils');

var url;
var title;
var $linkButton;

function init(opt_options) {
  var options = opt_options || {};
  url = options.url;
  title = options.title;

  render();
  bindUIActions();
}

function render() {
  var el = utils.createListButton({
    id: 'o-link',
    iconCls: 'o-icon-fa-external-link',
    src: '#fa-external-link',
    text: title

  });
  $('#o-menutools').append(el);
  $linkButton = $('#o-link-button');
}

function bindUIActions() {
  $linkButton.on('click', function() {
    window.open(url);
  });
}

module.exports.init = init;

