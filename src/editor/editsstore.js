var $ = require('jquery');
var ol = require('openlayers');
var viewer = require('../viewer');

var editsStore = function featureStore() {

  $(document).on('changeFeature', featureChange);

  var edits = {
    update: {},
    insert: {},
    delete: {}
  };

  return {
    getEdits: getEdits,
    saveFeatures: saveFeatures,
    syncFeatures: syncFeatures
  };

  function addEdit(e) {
    if (e.action === 'insert') {
      addFeature('insert', e.feature, e.layerName);
    } else if (e.action === 'update') {
      if (hasFeature('insert', e.feature, e.layerName) === false) {
        addFeature('update', e.feature, e.layerName);
      }
    } else if (e.action === 'delete') {
      if (removeFeature('insert', e.feature, e.layerName) === false) {
        removeFeature('update', e.feature, e.layerName);
        addFeature('delete', e.feature, e.layerName);
      }
    }
  }

  function removeEdit(e) {
    if (e.feature.length) {
      e.feature.forEach(function(feature) {
        removeFeature(e.action, feature, e.layerName)
      });
    }
  }

  function saveFeatures() {

  }

  function getEdits() {
    return edits;
  }

  function syncFeatures() {

  }

  function featureChange(e) {
    if (e.status === 'pending') {
      addEdit(e);
    } else if (e.status === 'finished') {
      removeEdit(e);
    }
  }

  function hasFeature(type, feature, layerName) {
    if (edits[type].hasOwnProperty(layerName)) {
      if (edits[type][layerName].indexOf(feature.getId()) > -1) {
        return true;
      }
    }
    return false;
  }

  function addFeature(type, feature, layerName) {
    if (edits[type].hasOwnProperty(layerName) === false) {
      edits[type][layerName] = [];
    }
    edits[type][layerName].push(feature.getId());
  }

  function removeFeature(type, feature, layerName) {
    var index = 0;
    if (edits[type].hasOwnProperty(layerName)) {
      index = edits[type][layerName].indexOf(feature.getId());
      if (index > -1) {
        edits[type][layerName].splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

module.exports = editsStore;
