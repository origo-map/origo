"use strict";

var viewer = require('../viewer');
var wfsTransaction = require('./wfstransaction');
var indexedDb = require('./indexeddb');
var transactions = {
  WFS: wfsTransaction,
  OFFLINE: indexedDb
};

module.exports = function(transaction, layerName) {
  var type = viewer.getLayer(layerName).get('type');
  if (transactions.hasOwnProperty(type)) {
    transactions[type](transaction, layerName);
  }
}
