"use strict";

var viewer = require('../viewer');
var wfsTransaction = require('./wfstransaction');
var agsTransaction = require('./agstransaction');
var indexedDb = require('./indexeddb');
var transactions = {
  WFS: wfsTransaction,
  AGS_FEATURE: agsTransaction,
  OFFLINE: indexedDb
};

module.exports = function(transaction, layerName) {
  var type = viewer.getLayer(layerName).get('type');
  if (transactions.hasOwnProperty(type)) {
    transactions[type](transaction, layerName);
  }
}
