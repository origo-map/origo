"use strict";

var $ = require('jquery');

module.exports = function isEmbedded(target) {
  if (window.top !== window.self || $(target).parent().is('BODY') === false) {
    return true;
  } else {
    return false;
  }
}
