/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = function elQuery(targetObj, options) {
  var target = '.o-map';
  var prefix = options.breakPointsPrefix;
  var breakPoints = options.breakPoints;
  var breakNames = Object.getOwnPropertyNames(breakPoints);
  var breakCls = arrToObj(breakNames, prefix);
  var breakClsNames = breakNames.map(function(breakSize) {
    return breakCls[breakSize];
  });

  $(window).on('resize', onSizeChange);
  onSizeChange();

  function onSizeChange() {
    var mapSize = targetObj.getSize();
    var val = breakNames.reduce(function(prev, curr) {
      var height = breakPoints[curr][1];
      var width = breakPoints[curr][0];
      if (mapSize[0] <= width || mapSize[1] <= height) {
        if (!prev) {
          return curr;
        } else {
          return prev;
        }
      } else {
        return prev;
      }
    }, undefined);
    $(target).removeClass(breakClsNames.join(' '));
    if (val) {
      $(target).addClass(breakCls[val]);
    }
  }

  function arrToObj(arr, start) {
    var obj = {};
    var val = start;
    arr.slice().reverse().forEach(function(curr) {
      val += '-' + curr;
      obj[curr] = val;
    });
    return obj;
  }
}
