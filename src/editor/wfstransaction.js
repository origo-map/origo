"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var editsStore = require('./editsstore')();
var dispatcher = require('./editdispatcher');

var format = new ol.format.WFS();
var serializer = new XMLSerializer();

module.exports = function(transObj, layerName) {
  return wfsTransaction(transObj, layerName);
}

function writeWfsTransaction(transObj, options) {
  var node = format.writeTransaction(transObj.insert, transObj.update, transObj.delete, options);
  return node;
}

function wfsTransaction(transObj, layerName) {
  var srsName = viewer.getProjectionCode();
  var layer = viewer.getLayer(layerName);
  var featureType = layer.get('featureType');
  var source = viewer.getMapSource()[layer.get('sourceName')];
  var options = {
    gmlOptions: {
      srsName: srsName
    },
    featureNS: source.workspace,
    featurePrefix: source.prefix || source.workspace,
    featureType: featureType
  };
  var node = writeWfsTransaction(transObj, options);
  return $.ajax({
    type: "POST",
    url: source.url,
    data: serializer.serializeToString(node),
    contentType: 'text/xml',
    success: success,
    error: error,
    context: this
  })
    .then(function(data) {
      var result = readResponse(data);
      var nr = 0;
      if (result) {
        nr += result.transactionSummary.totalUpdated;
        nr += result.transactionSummary.totalDeleted;
        nr += result.transactionSummary.totalInserted;
      }
      return nr;
    });

  function success(data) {
    var result = readResponse(data);
    var feature;
    if (result) {
      if (result.transactionSummary.totalUpdated > 0) {
        dispatcher.emitChangeFeature({
          feature: transObj.update,
          layerName: layerName,
          status: 'finished',
          action: 'update'
        });
      }

      if (result.transactionSummary.totalDeleted > 0) {
        dispatcher.emitChangeFeature({
          feature: transObj.delete,
          layerName: layerName,
          status: 'finished',
          action: 'delete'
        });
      }

      if (result.transactionSummary.totalInserted > 0) {
        feature = transObj.insert;
        dispatcher.emitChangeFeature({
          feature: transObj.insert,
          layerName: layerName,
          status: 'finished',
          action: 'insert'
        });
        var insertIds = result.insertIds;
        insertIds.forEach(function(insertId, index) {
          feature[index].setId(insertId);
        });
      }
    } else {
      error();
    }
  }

  function error(e) {
    var errorMsg = e ? (e.status + ' ' + e.statusText) : "";
    alert('Det inträffade ett fel när ändringarna skulle sparas till servern...\n' +
      errorMsg);
  }
}

function readResponse(data) {
  var result;
  if (window.Document && data instanceof Document && data.documentElement &&
    data.documentElement.localName === 'ExceptionReport') {
    alert(data.getElementsByTagNameNS(
      'http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
  } else {
    result = format.readTransactionResponse(data);
  }

  return result;
}
