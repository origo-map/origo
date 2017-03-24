/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('../viewer');
var template = require("./downloader.template.handlebars");
var utils = require('../utils');
var dispatcher = require('./offlinedispatcher');

var Downloader = function Downloader(layersObj) {
  var map = Viewer.getMap();
  render(layersObj);

  function render(layersObj) {
    $('#o-map').prepend(template);
    renderRows(layersObj);

    bindUIActions();
  }

  function addListeners() {
    $(document).on('changeOfflineStart', onChangeOfflineStart);
    $(document).on('changeOfflineEnd', onChangeOfflineEnd);
  }

  function onChangeOfflineStart() {

  }

  function onChangeOfflineEnd() {

  }

  function bindUIActions() {
    $('.o-downloader .o-close-button').on('click', function(evt) {
        closeDownloader();
        evt.preventDefault();
    });
  }

  function renderRows(layersObj) {
    var layerNames = Object.getOwnPropertyNames(layersObj);
    layerNames.forEach(function(layerName) {
      renderRow(layerName, layersObj);
    });
  }

  function renderRow(layerName, layersObj) {
    var layer = Viewer.getLayer(layerName);
    var tdTitle = utils.createElement('td', layer.get('title'),{});
    var toolbarId = 'o-downloader-td-toolbar-' + layerName;
    var toolbar = utils.createElement('div', '', {
      cls: 'o-toolbar-horizontal',
      style: 'text-align: right;',
      id: toolbarId
    });
    var tdToolbar = utils.createElement('td', toolbar, {});
    var row = tdTitle + tdToolbar;
    var cls = 'o-downloader-tr-' + layerName;
    var tr = utils.createElement('tr', row, {
      cls: cls
    });
    $('.o-downloader .o-table').append(tr);
    addButtons('#' + toolbarId, layersObj[layerName], layerName);
    // addListeners(toolbarId, layerName);
  }

  function addButtons(target, layerObj, layerName) {
    if (layerObj.downloaded) {
      renderSync(target, layerName);
      renderRemove(target, layerName);
    } else {
      renderDownload(target, layerName);
    }
  }

  function renderSync(target, layerName) {
    var id = 'o-downloader-refresh-' + layerName;
    var refresh = createButton({
      href: '#fa-refresh',
      cls: 'o-icon-fa-refresh',
      id: id
    });
    $(target).append(refresh);
    bindAction('#' + id, layerName, 'sync');
  }

  function renderRemove(target, layerName) {
    var id = 'o-downloader-trash-' + layerName;
    var trash = createButton({
      href: '#fa-trash',
      cls: 'o-icon-fa-trash',
      id: id
    });
    $(target).append(trash);
    bindAction('#' + id, layerName, 'remove');
  }

  function renderDownload(target, layerName) {
    var id = 'o-downloader-download-' + layerName;
    var download = createButton({
      href: '#fa-download',
      cls: 'o-icon-fa-download',
      id: id
    });
    $(target).append(download);
    bindAction('#' + id, layerName, 'download');
  }

  function createButton(obj) {
    var icon = utils.createSvg({
      href: obj.href,
      cls: obj.cls
    });
    return utils.createElement('button', icon, {
      id: obj.id
    });
  }

  function closeDownloader() {
    $('.o-downloader').remove();
  }

  function bindAction(target, layerName, type) {
    $(target).on('click', function(evt) {
      dispatcher.emitChangeDownload(layerName, type);
      evt.preventDefault();
      evt.stopPropagation();
    });
  }

}

module.exports = Downloader;
