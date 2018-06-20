import $ from 'jquery';

function emitChangeOffline(layerName, action, ids) {
  $.event.trigger({
    type: 'changeOffline',
    layerName,
    action,
    ids: ids || undefined
  });
}

function emitChangeDownload(layerName, action) {
  $.event.trigger({
    type: 'changeDownload',
    layerName,
    action
  });
}

function emitChangeOfflineStart(layerName) {
  $.event.trigger({
    type: 'changeOfflineStart',
    layerName
  });
}

function emitChangeOfflineEnd(layerName, state) {
  $.event.trigger({
    type: 'changeOfflineEnd',
    layerName,
    state
  });
}

export default {
  emitChangeOffline,
  emitChangeDownload,
  emitChangeOfflineStart,
  emitChangeOfflineEnd
};
