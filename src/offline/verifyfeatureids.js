"use strict";
var generateUUID = require('../utils/generateuuid');

module.exports = function verifyFeatureIds(features) {
  if (features[0]) {
    if (features[0].getId() === undefined) {
      features.forEach(function(feature) {
        feature.setId(generateUUID());
      })
    }
  }

  return features;
}
