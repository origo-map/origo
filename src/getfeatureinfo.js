"use strict";
var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var maputils = require('./maputils');
var getAttributes = require('./getattributes');
var featureInfo = require('./featureinfo');

var map;

function getFeaturesFromRemote(evt) {
        map = Viewer.getMap();
        var requestResult = [];
        var requestPromises = getFeatureInfoRequests(evt).map(function(request) {
            return request.fn.then(function(feature) {
                var layer = Viewer.getLayer(request.layer);
                if(feature) {
                    requestResult.push({
                        title: layer.get('title'),
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
            if (layer.get('queryable')) {
              var item = getGetFeatureInfoRequest(layer, evt.coordinate);
              if(item) {requests.push(item)};
            }
        });
    }
    //If canvas is tainted
    else if(isTainted(evt.pixel)) {
        var layers = Viewer.getQueryableLayers();
        layers.forEach(function(layer) {
            if (layer.get('queryable')) {

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
            }
        });
    }
    //If crossOrigin is not supported and canvas not tainted
    else {
        map.forEachLayerAtPixel(evt.pixel, function(layer) {
            if (layer.get('queryable') === true) {
              var item = getGetFeatureInfoRequest(layer, evt.coordinate);
              if (item) {
                requests.push(item)
              };
            }
        });
    }
    return requests;
}
function getGetFeatureInfoRequest(layer, coordinate) {
    var layerType = layer.get('type'),
    obj = {};
    obj.layer = layer.get('name');

    switch (layerType) {
      case 'WMTS':
        if(layer.get('featureinfoLayer')) {
            var featureinfoLayerName = layer.get('featureinfoLayer'),
            featureinfoLayer = Viewer.getLayer(featureinfoLayerName);
            return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
        }
        else {
            return undefined;
        }
        break;
      case 'WMS':
        if(layer.get('featureinfoLayer')) {
            var featureinfoLayerName = layer.get('featureinfoLayer'),
            featureinfoLayer = Viewer.getLayer(featureinfoLayerName);
            return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
        }
        else {
            obj.cb = "GEOJSON";
            obj.fn = getGetFeatureInfoUrl(layer, coordinate);
            return obj;
        }
        case 'AGS_TILE':
            if(layer.get('featureinfoLayer')) {
                var featureinfoLayerName = layer.get('featureinfoLayer'),
                featureinfoLayer = Viewer.getLayer(featureinfoLayerName);
                return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
            }
            else {
                obj.fn = getAGSIdentifyUrl(layer, coordinate);
                return obj;
            }
      default:
        return undefined;
    }
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
                          item.title = l.get('title');
                          item.feature = f;
                          item.content =  getAttributes(f,l);
                          result.push(item);
                    });
                }
              }
              else if(collection.length == 1 && queryable) {
                  var item = {};
                  item.title = l.get('title');
                  item.feature = collection[0];
                  item.content = getAttributes(collection[0],l);
                  result.push(item);
              }
          }
          else if(queryable) {
              var item = {};
              item.title = l.get('title');
              item.feature = feature;
              item.content = getAttributes(feature,l)
              result.push(item);
          }
        }, 
        {
          hitTolerance: featureInfo.getHitTolerance()
        });

    if(cluster) {
        return false;
    }
    else {
        return result;
    }
}
function getGetFeatureInfoUrl(layer, coordinate) {
    var url = layer.getSource().getGetFeatureInfoUrl(
    coordinate, map.getView().getResolution(), Viewer.getProjection(),
    {'INFO_FORMAT': 'application/json'});

    return $.ajax(url, {
      type: 'post'
    })
    .then(function(response) {
        if(response.error) {
            return [];
        }
        else {
            return maputils.geojsonToFeature(response);
        }
    }
    );
}
function getAGSIdentifyUrl(layer, coordinate) {
  var projectionCode = Viewer.getProjectionCode();
  var esriSrs = projectionCode.split(':').pop();
  var layerId = layer.get('id');
  var source = Viewer.getMapSource()[layer.get('sourceName')];
  var serverUrl = source.url;
  var esrijsonFormat = new ol.format.EsriJSON();
  var size = map.getSize();
  var tolerance = source.hasOwnProperty('tolerance') ? source.tolerance.toString() : 5;
  var extent = map.getView().calculateExtent(size);

  var url = serverUrl +
      '/identify?f=json&' +
      'returnGeometry=true' +
      '&geometryType=esriGeometryPoint'+
      '&sr=' + esriSrs +
      '&geometry=' + coordinate +
      '&outFields=*' +
      '&geometryPrecision=2' +
      '&tolerance=' + tolerance +
      '&layers=all:' + layerId +
      '&mapExtent=' + extent +
      '&imageDisplay=' + size + ',' + '96';

  return $.ajax({
        url: url,
        dataType: 'jsonp'
  })
    .then(function(response) {
        if(response.error) {
            return [];
        }
        else {
            var obj = {};
            obj.features = response.results;
            var features = esrijsonFormat.readFeatures(obj, {
                    featureProjection: Viewer.getProjection()
            });
            return features[0];
        }
    }
    );
}

module.exports.getFeaturesFromRemote = getFeaturesFromRemote;
module.exports.getFeaturesAtPixel = getFeaturesAtPixel;
