/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var editsStore = require('./editsstore')();
var dispatcher = require('./editdispatcher');

var format = new ol.format.EsriJSON();
var urlSuffix = {
  update: 'updateFeatures',
  insert: 'addFeatures',
  delete: 'deleteFeatures'
};

module.exports = function(transObj, layerName) {
  agsTransaction(transObj, layerName);
}

function writeAgsTransaction(features, options) {
  var data = {};

  if (options.type === 'delete') {
    var objectIds = features.map(function(feature) {
      return feature.getId();
    });
    data.objectIds = objectIds.join(',');
  } else {
    var agsFeatures = features.map(function(feature) {
      return format.writeFeature(feature, {
        featureProjection: options.projection
      });
    });
    data.features = '[' + agsFeatures + ']';
  }
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
    delete: deleteSuccess
  };
  types.forEach(function(type) {
    if (transObj[type]) {
      var url = source.url  + '/' + id + '/' + urlSuffix[type];
      var datat = writeAgsTransaction(transObj[type], {
        projection: projection,
        type: type
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
    var feature = transObj.update;
    var result = JSON.parse(data);
    if (result) {
      if (result.updateResults.length > 0) {
        result.updateResults.forEach(function(update, index) {
          if (update.success !== true) {
            throwServerError(update.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName: layerName,
              status: 'finished',
              action: 'update'
            });
          }
        });
      }
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
            throwServerError(insert.error);
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

  function deleteSuccess(data) {
    var feature = transObj.delete;
    var result = JSON.parse(data);
    if (result) {
      if (result.deleteResults.length > 0) {
        result.deleteResults.forEach(function(deleted, index) {
          if (deleted.success !== true) {
            throwServerError(deleted.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName: layerName,
              status: 'finished',
              action: 'delete'
            });
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

  function throwServerError(error) {
    alert(error.description + ' (' + error.code + ')');
  }
}
