"use strict";

var round = require('../utils/round');

var getArea = function getArea(geometry_in, decimals) {
  var area = geometry_in.getArea ? geometry_in.getArea() : 0;
  if (decimals) {
    area = round(area, decimals);
  } else {
    area = round(area, '2');
  }
  return area;
}

module.exports = getArea;
