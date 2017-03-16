/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('../viewer');
var template = require("./downloader.template.handlebars");
var offlineStore = require("./offlinestore");
var utils = require('../utils');
var download = require('./download');

var Downloader = function Downloader() {
  var map = Viewer.getMap();
  offlineStore().init();

  return {
    render: render
  }

  function render() {
    $('#o-map').prepend(template);

    var layers = offlineStore().getLayerStore();
    renderLayers(layers);
    bindUIActions();
  }

  function bindUIActions() {
    $('.o-downloader .o-close-button').on('click', function(evt) {
        closeDownloader();
        evt.preventDefault();
    });
  }

  function renderLayers(layers) {
    var layerNames = Object.getOwnPropertyNames(layers);
    layerNames.forEach(function(layerName) {
      var layer = Viewer.getLayer(layerName);
      var td = utils.createElement('td', layer.get('title'),{})
      var cls = 'o-downloader-tr-' + layerName;
      var tr = utils.createElement('tr', td, {
        cls: cls
      });
      $('.o-downloader .o-table').append(tr);
      bindLayerAction(cls);
    });
  }

  function closeDownloader() {
    $('.o-downloader').remove();
  }

  function bindLayerAction(cls) {
    $('.' + cls).on('click', function(evt) {
      download(Viewer.getLayer(cls.split('o-downloader-tr-')[1]));
      evt.preventDefault();
      evt.stopPropagation();
    });
  }
}

module.exports = Downloader;
