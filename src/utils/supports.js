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
