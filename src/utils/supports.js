/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var renderError = require('./rendererror');

module.exports = function supports(type, el) {
  var canvas = document.createElement('canvas').getContext;
  var requestAnimationFrame = window.requestAnimationFrame;
  if (!!canvas && !!requestAnimationFrame) {
    return true;
  } else {
    renderError('browser', el);
    return false;
  }
}
