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
