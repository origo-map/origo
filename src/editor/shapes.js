"use strict";

var ol = require('openlayers');

module.exports = function(drawType) {
  var types = {
    box: {
      type: 'Circle',
      geometryFunction: ol.interaction.Draw.createBox()
    }
  };

  if (types.hasOwnProperty(drawType)) {
    return types[drawType];
  } else {
    return {};
  }
}
