/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = function isEmbedded(target) {
  if (window.top !== window.self || $(target).parent().is('BODY') === false) {
    return true;
  } else {
    return false;
  }
}
