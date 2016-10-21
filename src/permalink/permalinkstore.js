/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */

"use strict";

var viewer = require('../viewer');
var selection = require('../featureinfo')['getSelection'];
var getPin = require('../featureinfo')['getPin'];
var urlparser =require('../utils/urlparser');

var permalinkStore = {};
var state;
var url;

permalinkStore.getState = function getState() {
    state = {};
    var view = viewer.getMap().getView();
    var layers = viewer.getLayers();
    state.layers = getSaveLayers(layers);
    state.center = view.getCenter().map(function(coord) {
        return Math.round(coord);
    }).join();
    state.zoom = view.getZoom().toString();
    // state.selection = getSaveSelection(selection());
    if (getPin()) {
        state.pin = getPin().getGeometry().getCoordinates().map(function(coord) {
          return Math.round(coord);
        }).join();
    }
    if (viewer.getMapName()) {
        state.map = viewer.getMapName().split('.')[0];
    }
    return state;
}
permalinkStore.getUrl = function() {
    url = viewer.getUrl();
    return url;
}

function getSaveLayers(layers) {
    var saveLayers = [];
    layers.forEach(function(layer) {
        var saveLayer = {};
        saveLayer.v = layer.getVisible() === true ? 1 : 0;
        saveLayer.s = layer.get('legend') === true ? 1 : 0;
        if (saveLayer.s || saveLayer.v) {
            saveLayer.name = layer.get('name');
            saveLayers.push(urlparser.stringify(saveLayer, {topmost: 'name'}));
        }
    });
    return saveLayers;
}
function getSaveSelection(selection) {
    return urlparser.arrStringify(selection.coordinates, {topmost: selection.geometryType});
}

module.exports = permalinkStore;
