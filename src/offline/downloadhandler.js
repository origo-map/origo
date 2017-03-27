/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('../viewer');
var utils = require('../utils');
var layerCreator = require('../layercreator');
var offlineLayer = require('./offlinelayer');
var downloadSources = require('./downloadsources');
var dispatcher = require('./offlinedispatcher');

var downloadHandler = function downloadHandler() {
  $(document).on('changeDownload', changeDownload);

  function changeDownload(e) {
    e.stopImmediatePropagation();
    if (e.action === 'download') {
      download(e.layerName);
    } else if (e.action === 'sync') {
      download(e.layerName);
    } else if (e.action === 'remove') {
      removeDownloaded(e.layerName);
    }
  }

  function removeDownloaded(layerName) {
    var layer = Viewer.getLayer(layerName);
    var props = layer.getProperties();
    props.style = props.styleName;
    props.source = props.sourceName;
    var source = layerCreator(props).getSource();
    layer.setSource(source);
    dispatcher.emitChangeOffline(layer.get('name'), 'remove');
  }

  function download(layerName) {
    var layer = Viewer.getLayer(layerName);
    var type = layer.get('type');
    if (downloadSources.hasOwnProperty(type)) {
      downloadSources[type](layer)
        .done(function(result) {
          offlineLayer(layer, result);
          dispatcher.emitChangeOffline(layer.get('name'), 'download');
        });
    }
  }
}

module.exports = downloadHandler;
