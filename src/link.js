/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var url;
var title;

function init(opt_options) {
  var options = opt_options || {};
  url = options.url;
  title = options.title;
  render();
}

function render() {
  var el = utils.createListButton({
    id: 'o-link',
    iconCls: 'o-icon-fa-external-link',
    src: 'css/svg/fa-icons.svg#fa-external-link',
    text: '<a href="' + url + '"class="o-link" target="_blank">' + title + '</a>'
  });
  $('#o-menutools').append(el);
}

module.exports.init = init;

