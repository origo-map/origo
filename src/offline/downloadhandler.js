"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var layerCreator = require('../layercreator');
var offlineLayer = require('./offlinelayer')();
var downloadSources = require('./downloadsources');
var dispatcher = require('./offlinedispatcher');
var offlineStore = require('./offlinestore')();

var downloadErrorMsg = 'Det inträffade ett fel när lagret skulle hämtas. Är du ansluten till internet?'
var saveErrorMsg = 'Det inträffade ett fel när förändringarna skulle sparas. Försök igen senare.';
var invalidFormatMsg = 'Invalid format: ';

var downloadHandler = function downloadHandler() {
  $(document).on('changeDownload', onChangeDownload);
  offlineStore.init();

  function onChangeDownload(e) {
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
    var layer = viewer.getLayer(layerName);
    var props = layer.getProperties();
    var source;
    dispatcher.emitChangeOfflineStart(layerName);
    props.style = props.styleName;
    props.source = props.sourceName;
    props.type = props.onlineType;
    source = layerCreator(props).getSource();
    layer.setSource(source);
    dispatcher.emitChangeOffline(layer.get('name'), 'remove');
  }

  function sync(layerName) {
    var offlineEdits = offlineStore.getOfflineEdits(layerName);
    dispatcher.emitChangeOfflineStart(layerName);
    if (offlineEdits) {
      offlineEdits
        .then(function(editItems) {
          saveToRemote(editItems, layerName)
            .then(function() {
              download(layerName);
            })
            .fail(function(err) {
              abort(layerName, saveErrorMsg, 'alert');
            });
        });
    } else {
      download(layerName);
    }
  }

  function saveToRemote(editItems, layerName) {
    var layer = viewer.getLayer(layerName);
    var transObj = {
      delete: [],
      insert: [],
      update: []
    };
    var ids = [];
    editItems.forEach(function(item) {
      var id = Object.getOwnPropertyNames(item)[0];
      var feature = layer.getSource().getFeatureById(id);
      var dummy;
      if (feature) {
        transObj[item[id]].push(feature);
        ids.push(id);
      } else if (item[id] === 'delete') {
        dummy = new ol.Feature();
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
    var layer = viewer.getLayer(layerName);
    var type = layer.get('onlineType');
    dispatcher.emitChangeOfflineStart(layerName);
    if (downloadSources.hasOwnProperty(type)) {
      downloadSources[type].request(layer)
        .then(function(result) {
          offlineLayer.setOfflineSource(layerName, result);
          dispatcher.emitChangeOffline(layer.get('name'), 'download');
        })
        .fail(function(error) {
          abort(layerName, downloadErrorMsg, 'alert');
        });
    } else {
      error = 'Sorry, ' + type + ' is not available as on offline format';
      abort(layerName, invalidFormatMsg + type);
    }
  }

  function abort(layerName, error, isAlert) {
    var action;
    if (offlineStore.getOfflineLayer(layerName).downloaded) {
      action = 'offline';
    } else {
      action = 'download';
    }

    if (isAlert) {
      alert(error);
    } else {
      console.log(error);
    }

    dispatcher.emitChangeOfflineEnd(layerName, action);
  }
}

module.exports = downloadHandler;
