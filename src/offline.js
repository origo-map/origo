/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');
var downloader = require('./offline/downloader');
var downloadHandler = require('./offline/downloadhandler');
var offlineStore = require('./offline/offlinestore')();

var map = undefined;
var baseUrl = undefined;
var $offlineButton = undefined;

function Init(opt_options) {
  var options = opt_options || {};
  map = Viewer.getMap();
  baseUrl = Viewer.getBaseUrl();

  downloadHandler();

  render();
  bindUIActions();
}

function render() {
  var el = utils.createListButton({
    id: 'o-offline',
    iconCls: 'o-icon-fa-download',
    src: '#fa-download',
    text: 'Nedladdningar'
  });
  $('#o-menutools').append(el);
  $offlineButton = $('#o-offline-button');
}

function bindUIActions() {
  $offlineButton.on('click', function(e) {
    downloader(offlineStore.getOfflineLayers());
    e.preventDefault();
  });
}

module.exports.init = Init;
