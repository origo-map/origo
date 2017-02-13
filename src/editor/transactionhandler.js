/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var viewer = require('../viewer');
var wfsTransaction = require('./wfstransaction');
var transactions = {
  WFS: wfsTransaction
};

module.exports = function(transaction, layerName) {
  var type = viewer.getLayer(layerName).get('type');
  if (transactions.hasOwnProperty(type)) {
    transactions[type](transaction, layerName);
  }
}
