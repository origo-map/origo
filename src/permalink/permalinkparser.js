"use strict";
var urlparser = require('../utils/urlparser');

var layerModel = {
    v: {
      name: "visible",
      dataType: "boolean"
    },
    s: {
      name: "legend",
      dataType: "boolean"
    },
}

module.exports = {
  layers: function(layersStr) {
      var layers = layersStr.split(',');
      var layerObjects = {};
      layers.forEach(function(layer) {
          var obj = {};
          var layerObject = urlparser.objectify(layer,{topmost: "name"});
          Object.getOwnPropertyNames(layerObject).forEach(function(prop) {
              var val = layerObject[prop];
              if(layerModel.hasOwnProperty(prop)) {
                  var attribute = layerModel[prop];
                  obj[attribute.name] = urlparser.strBoolean(val);
              }
              else {
                  obj[prop] = val;
              }
          });
          layerObjects[obj.name] = obj;

      });
      return layerObjects;
  },
  zoom: function(zoomStr) {
      return parseInt(zoomStr);
  },
  center: function(centerStr) {
      var center = centerStr.split(",").map(function(coord) {
          return parseInt(coord);
      });
      return center;
  },
  selection: function(selectionStr) {
      return urlparser.strArrayify(selectionStr, {
        topmostName: "geometryType",
        arrName: "coordinates"}
      );
  },
  pin: function(pinStr) {
      return urlparser.strIntify(pinStr);
  },
  map: function(mapStr) {
      return mapStr;
  }
}
