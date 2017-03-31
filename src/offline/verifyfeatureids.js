/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
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
