/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('../viewer');
var utils = require('../utils');
var layerCreator = require('../layercreator');
var offlineLayer = require('./offlinelayer');
var downloadSources = require('./downloadsources');
var dispatcher = require('./offlinedispatcher');
var offlineStore = require('./offlinestore')();

var downloadHandler = function downloadHandler() {
  $(document).on('changeDownload', changeDownload);
  offlineStore.init();

  function changeDownload(e) {
    e.stopImmediatePropagation();
    if (e.action === 'download') {
      download(e.layerName);
    } else if (e.action === 'sync') {
      sync(e.layerName);
    } else if (e.action === 'remove') {
      removeDownloaded(e.layerName);
    }
  }

  function removeDownloaded(layerName) {
    var layer = Viewer.getLayer(layerName);
    var props = layer.getProperties();
    var source;
    props.style = props.styleName;
    props.source = props.sourceName;
    props.type = props.onlineType;
    source = layerCreator(props).getSource();
    layer.setSource(source);
    dispatcher.emitChangeOffline(layer.get('name'), 'remove');
  }

  function sync(layerName) {
    var offlineEdits = offlineStore.getOfflineEdits(layerName);
    if (offlineEdits) {
        offlineEdits
        .then(function(editItems) {
          saveToRemote(editItems, layerName)
            .then(function() {
              download(layerName);
            });
        });
    } else {
      download(layerName);
    }
  }

  function saveToRemote(editItems, layerName) {
    var layer = Viewer.getLayer(layerName);
    var transObj = {
      delete: [],
      insert: [],
      update: []
    };
    var ids = [];
    editItems.forEach(function(item) {
      var id = Object.getOwnPropertyNames(item)[0];
      var feature = layer.getSource().getFeatureById(id);
      if (feature) {
        transObj[item[id]].push(feature);
        ids.push(id);
      } else if (item[id] === 'delete') {
        var dummy = new ol.Feature();
        dummy.setId(id);
        transObj[item[id]].push(dummy);
        ids.push(id);
      }
    });
    return downloadSources[layer.get('onlineType')].transaction(transObj, layerName)
      .then(function(result) {
        if (result > 0) {
          dispatcher.emitChangeOffline(layer.get('name'), 'edits', ids);
        }
      });
  }

  function download(layerName) {
    var layer = Viewer.getLayer(layerName);
    var type = layer.get('onlineType');
    if (downloadSources.hasOwnProperty(type)) {
      downloadSources[type].request(layer)
        .done(function(result) {
          // offlineLayer(layer, result);
          dispatcher.emitChangeOffline(layer.get('name'), 'download');
        });
    }
  }
}

module.exports = downloadHandler;
