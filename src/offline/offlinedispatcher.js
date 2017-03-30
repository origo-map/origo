/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
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
