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

var Downloader = function Downloader() {
  var map = Viewer.getMap();

  return {
    render: render
  }

  function render() {
    $('#o-wrapper').html(template);

    var layers = getOfflineLayers();
    if (layers) {
      renderLayers(layers);
    } else {
      console.log('Det finns inga offline-lager');
    }
  }

  function renderLayers(layers) {
    layers.forEach(function(layer) {
      var td = utils.createElement('td', layer.get('title'),{})
      var cls = 'o-downloader-tr-' + layer.get('name');
      var tr = utils.createElement('tr', td, {
        cls: cls
      });
      $('.o-downloader-table').append(tr);
      bindLayerAction(cls);
    });
  }

  function getOfflineLayers() {
    return map.getLayers().getArray().filter(function(layer) {
      if (layer.get('offline')) {
        return layer;
      }
    });
  }

  function bindLayerAction(cls) {
    $('.' + cls).on('click', function(e) {
      alert('downloading');
    });
  }
}

module.exports = Downloader;
