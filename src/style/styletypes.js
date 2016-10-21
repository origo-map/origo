/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var pin = require('./pin');

module.exports = function() {

  var styleTypes = {};

  styleTypes.pin = pin;

  return {
      getStyle: function getStyle(type) {
          if(type) {
              return styleTypes[type];
          }
          else {
              console.log(type + ' is not a default style');
          }
      }
  }
}();
