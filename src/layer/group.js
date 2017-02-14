/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
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
