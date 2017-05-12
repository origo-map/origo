"use strict";

var ol = require('openlayers');
var $ = require('jquery');

var group = function group(layerOptions) {
  var groupDefault = {
    layerType: 'group',
    styleName: 'default'
  };
  var groupOptions = $.extend(groupDefault, layerOptions);
  return new ol.layer.Group(groupOptions);
}

module.exports = group;
