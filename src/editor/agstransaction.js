/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var editsStore = require('./editsstore')();
var dispatcher = require('./editDispatcher');

var format = new ol.format.EsriJSON();
var urlSuffix = {
  update: 'updateFeatures',
  insert: 'addFeatures',
  delete: ''
}

module.exports = function(transObj, layerName) {
  agsTransaction(transObj, layerName);
}

function writeAgsTransaction(features, options) {
  var data = {};

  var agsFeatures = features.map(function(feature) {
    return format.writeFeature(feature, {
      featureProjection: options.projection
    });
  });
  data.features = '[' + agsFeatures + ']';
  data.f = 'json';
  return data;
}

function agsTransaction(transObj, layerName) {
  var projection = viewer.getProjection();
  var layer = viewer.getLayer(layerName);
  var id = layer.get('id');
  var source = viewer.getMapSource()[layer.get('sourceName')];
  var types = Object.getOwnPropertyNames(transObj);
  var cb = {
    update: updateSuccess,
    insert: insertSuccess,
    delete: ''
  };
  types.forEach(function(type) {
    if (transObj[type]) {
      var url = source.url  + '/' + id + '/' + urlSuffix[type];
      var datat = writeAgsTransaction(transObj[type], {
        projection: projection
      });
      $.ajax({
        type: "POST",
        url: url,
        data: datat,
        success: cb[type],
        error: error,
        context: this
      });
    }
  });

  function updateSuccess(data) {
    var result = JSON.parse(data);
    if (result) {
      if (result.updateResults.length > 0) {
        result.updateResults.forEach(function(update) {
          if (update.success !== true) {
            throwError(update.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [layer.getSource().getFeatureById(update.objectId)],
              layerName: layerName,
              status: 'finished',
              action: 'update'
            });
          }
        });
      }
      // if (result.transactionSummary.totalUpdated > 0) {
      //   dispatcher.emitChangeFeature({
      //     feature: transObj.update,
      //     layerName: layerName,
      //     status: 'finished',
      //     action: 'update'
      //   });
      // }
      // if (result.transactionSummary.totalDeleted > 0) {
      //   dispatcher.emitChangeFeature({
      //     feature: transObj.delete,
      //     layerName: layerName,
      //     status: 'finished',
      //     action: 'delete'
      //   });
      // }
      // if (result.transactionSummary.totalInserted > 0) {
      //   var feature = transObj.insert;
      //   dispatcher.emitChangeFeature({
      //     feature: transObj.insert,
      //     layerName: layerName,
      //     status: 'finished',
      //     action: 'insert'
      //   });
      //   var insertIds = result.insertIds;
      //   insertIds.forEach(function(insertId, index) {
      //     feature[index].setId(insertId);
      //   });
      // }
    } else {
      error();
    }
  }

  function insertSuccess(data) {
    var feature = transObj.insert;
    var result = JSON.parse(data);
    if (result) {
      if (result.addResults.length > 0) {
        result.addResults.forEach(function(insert, index) {
          if (insert.success !== true) {
            throwError(insert.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName: layerName,
              status: 'finished',
              action: 'insert'
            });
            feature[index].set('objectId',insert.objectId);
            feature[index].setId(insert.objectId);
          }
        });
      }
    } else {
      error();
    }
  }

  function error(e) {
    var errorMsg = e ? (e.status + ' ' + e.statusText) : "";
    alert('Det inträffade ett fel när ändringarna skulle sparas till servern...<br><br>' +
      errorMsg);
  }

  function throwError(error) {
    alert(error.description + ' (' + error.code + ')');
  }
}
