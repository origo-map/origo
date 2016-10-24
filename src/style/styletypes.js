/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var pin = require('./pin');
var measure = require('./measure');

module.exports = function() {

  var styleTypes = {};

  styleTypes.pin = pin;
  styleTypes.measure = measure;

  return {
    getStyle: function getStyle(type) {
      if(type) {
        return styleTypes[type];
      } else {
        console.log(type + ' is not a default style');
      }
    }
  }
}();
