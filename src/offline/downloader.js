"use strict";

var $ = require('jquery');
var Viewer = require('../viewer');
var template = require("./downloader.template.handlebars");
var spinner = require("../components/spinner.handlebars");
var utils = require('../utils');
var dispatcher = require('./offlinedispatcher');

var toolbarPrefix = 'o-downloader-td-toolbar-';

var Downloader = function Downloader(layersObj) {
  render(layersObj);
  addListeners();

  function render(layersObj) {
    $('#o-map').prepend(template);
    renderRows(layersObj);

    bindUIActions();
  }

  function addListeners() {
    $(document).on('changeOfflineStart', onChangeOfflineStart);
    $(document).on('changeOfflineEnd', onChangeOfflineEnd);
  }

  function onChangeOfflineStart(e) {
    renderButtons('#' + toolbarPrefix + e.layerName, 'pending', e.layerName);
  }

  function onChangeOfflineEnd(e) {
    renderButtons('#' + toolbarPrefix + e.layerName, e.state, e.layerName);
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
    var toolbarId = toolbarPrefix + layerName;
    var toolbar = utils.createElement('div', '', {
      cls: 'o-toolbar-horizontal',
      style: 'text-align: right; float: right;',
      id: toolbarId
    });
    var tdToolbar = utils.createElement('td', toolbar, {});
    var row = tdTitle + tdToolbar;
    var cls = 'o-downloader-tr-' + layerName;
    var tr = utils.createElement('tr', row, {
      cls: cls
    });
    var state;
    $('.o-downloader .o-table').append(tr);
    state =  layersObj[layerName].downloaded === true ? 'offline' : 'download';
    renderButtons('#' + toolbarId, state, layerName);
  }

  function renderButtons(target, state, layerName) {
    $(target).empty();
    if (state === 'offline') {
      renderSync(target, layerName);
      renderRemove(target, layerName);
    } else if (state === 'download') {
      renderDownload(target, layerName);
    } else if (state === 'pending') {
      renderPending(target);
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

  function renderPending(target) {
    var spinnerButton = utils.createElement('button', '', {
      cls: 'o-spinner'
    });
    $(target).append(spinnerButton);
    $('.o-spinner').append(spinner);
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
