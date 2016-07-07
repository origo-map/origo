/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var Viewer = require('./viewer');
var maputils = require('./maputils');
var getAttributes = require('./getattributes');

var map;

function getFeaturesFromRemote(evt) {
        map = Viewer.getMap();
        var requestResult = [];
        var requestPromises = getFeatureInfoRequests(evt).map(function(request) {
            return request.fn.then(function(data) {
                var feature = maputils.geojsonToFeature(data),
                layer = Viewer.getLayer(request.layer);
                if(feature) {
                    requestResult.push({
                        layer: layer,
                        feature: feature,
                        content: getAttributes(feature, layer)
                    });
                    return requestResult;
                }
            });
        });
        return $.when.apply($, requestPromises).then(function(data) {
            return requestResult;
        });
}
function getFeatureInfoRequests(evt) {
    var requests = [];
    //Check for support of crossOrigin in image, absent in IE 8 and 9
    if('crossOrigin' in new(Image)) {
        map.forEachLayerAtPixel(evt.pixel, function(layer) {
            var item = getGetFeatureInfoRequest(layer, evt.coordinate);
            if(item) {requests.push(item)};
        });
    }
    //If canvas is tainted
    else if(isTainted(evt.pixel)) {
        var layers = Viewer.getQueryableLayers();
        layers.forEach(function(layer) {
            //If layer is tainted, then create request for layer
            if(isTainted(evt.pixel, layer)) {
                var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                if(item) {requests.push(item)};
            }
            //If layer is not tainted, test if layer hit at pixel
            else if(layerAtPixel(evt.pixel, layer)){
                var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                if(item) {requests.push(item)};
            }
        });
    }
    //If crossOrigin is not supported and canvas not tainted
    else {
        map.forEachLayerAtPixel(evt.pixel, function(layer) {
            var item = getGetFeatureInfoRequest(layer, evt.coordinate);
            if(item) {requests.push(item)};
        });
    }
    return requests;
}
function getGetFeatureInfoRequest(layer, coordinate) {
    var layerType = layer.get('type'),
    obj = {};
    switch (layerType) {
      case 'WMTS':
        if(layer.get('featureinfoLayer')) {
            var featureinfoLayerName = layer.get('featureinfoLayer'),
            featureinfoLayer = Viewer.getLayer(featureinfoLayerName),
            url = featureinfoLayer.getSource().getGetFeatureInfoUrl(
            coordinate, map.getView().getResolution(), Viewer.getProjection(),
            {'INFO_FORMAT': 'application/json'});
            obj.layer = featureinfoLayerName;
            obj.cb = "GEOJSON";
            obj.fn = getRequest(url);
            return obj;
        }
        else {
            return undefined;
        }
        break;
      case 'WMS':
        var url = layer.getSource().getGetFeatureInfoUrl(
        coordinate, map.getView().getResolution(), Viewer.getProjection(),
        {'INFO_FORMAT': 'application/json'});
        obj.layer = layer.get('name');
        obj.cb = "GEOJSON";
        obj.fn = getRequest(url);
        return obj;
        break;
      default:
        return undefined;
    }
}
function getRequest(url) {
    return $.ajax(url, {
      type: 'post'
    });
}
function isTainted(pixel, layerFilter) {
    try {
        if(layerFilter) {
            map.forEachLayerAtPixel(pixel, function(layer) {
                return layerFilter === layer;
            });
        }
        else {
            map.forEachLayerAtPixel(pixel, function(layer) {});
        }
        return false;
    }
    catch(e) {
        console.log(e);
        return true;
    }
}
function layerAtPixel(pixel, matchLayer) {
    map.forEachLayerAtPixel(pixel, function(layer) {
        return matchLayer === layer;
    })
}
function getFeaturesAtPixel(evt, clusterFeatureinfoLevel) {
    map = Viewer.getMap();
    var result = [],
    cluster = false;
    map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          var l = layer;
          var queryable = false;
          if(layer) {
              queryable = layer.get('queryable');
          }
          if(feature.get('features')) {
              //If cluster
              var collection = feature.get('features');
              if (collection.length > 1) {
                var zoom = map.getView().getZoom();
                var zoomLimit = clusterFeatureinfoLevel === -1 ? Viewer.getResolutions().length : zoom + clusterFeatureinfoLevel;
                if(zoomLimit < Viewer.getResolutions().length) {
                    map.getView().setCenter(evt.coordinate);
                    map.getView().setZoom(zoom + 1);
                    cluster = true;
                    return true;
                }
                else {
                    collection.forEach(function(f) {
                          var item = {};
                          item.layer = l;
                          item.feature = f;
                          item.content =  getAttributes(f,l);
                          result.push(item);
                    });
                }
              }
              else if(collection.length == 1 && queryable) {
                  var item = {};
                  item.layer = l;
                  item.feature = collection[0];
                  item.content = getAttributes(collection[0],l);
                  result.push(item);
              }
          }
          else if(queryable) {
              var item = {};
              item.layer = l;
              item.feature = feature;
              item.content = getAttributes(feature,l)
              result.push(item);
          }

        });
    if(cluster) {
        return false;
    }
    else {
        return result;
    }
}

module.exports.getFeaturesFromRemote = getFeaturesFromRemote;
module.exports.getFeaturesAtPixel = getFeaturesAtPixel;
