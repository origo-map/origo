"use strict";

var $ = require('jquery');

module.exports = {
  emitChangeOffline: emitChangeOffline,
  emitChangeDownload: emitChangeDownload,
  emitChangeOfflineStart: emitChangeOfflineStart,
  emitChangeOfflineEnd: emitChangeOfflineEnd
}

function emitChangeOffline(layerName, action, ids) {
  $.event.trigger({
    type: 'changeOffline',
    layerName: layerName,
    action: action,
    ids: ids || undefined
  });
}

function emitChangeDownload(layerName, action) {
  $.event.trigger({
    type: 'changeDownload',
    layerName: layerName,
    action: action
  });
}

function emitChangeOfflineStart(layerName) {
  $.event.trigger({
    type: 'changeOfflineStart',
    layerName: layerName
  });
}

function emitChangeOfflineEnd(layerName, state) {
  $.event.trigger({
    type: 'changeOfflineEnd',
    layerName: layerName,
    state: state
  });
}
