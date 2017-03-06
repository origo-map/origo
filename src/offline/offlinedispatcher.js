/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = {
  emitChangeOffline: emitChangeOffline
}

function emitChangeOffline(layerName, state) {
  $.event.trigger({
    type: 'changeOffline',
    layerName: layerName,
    status: state
  });
}
