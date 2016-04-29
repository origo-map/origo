/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var Popup = require('./popup');
var sidebar = require('./sidebar');
var maputils = require('./maputils');
var featureinfotemplates = require('./featureinfotemplates');
var featurelayer = require('./featurelayer');
var style = require('./style');
var owlCarousel = require('../externs/owlcarousel-browserify');
owlCarousel.loadjQueryPlugin();

module.exports = function(opt_options) {
  var map = Viewer.getMap();

  var options = opt_options || {};

  var pinStyleOptions = options.pinStyle || [
    {
      'icon': {
          anchor: [0.5, 32],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: 'img/png/drop_blue.png'
      }
    }
  ];
  var pinning = options.hasOwnProperty('pinning') ? options.pinning : true;
  var pinStyle = style.createStyleRule(pinStyleOptions);
  var selectionStyles = style.createEditStyle();

  var savedSelection = options.savedSelection || undefined,
  selectionLayer = featurelayer(savedSelection, map);

  var overlay = new ol.Overlay({
    element: $('#popup').get(0)
  });
  var showOverlay = options.hasOwnProperty('overlay') ? options.overlay : true;

  var identifyTarget;
  if(showOverlay) {
      Popup.init('#map');
      var overlay = new ol.Overlay({
        element: $('#popup').get(0)
      });
      map.addOverlay(overlay);
      identifyTarget = 'overlay';
  }
  else {
      sidebar.init();
      identifyTarget = 'sidebar';
  }

    map.on('click', function(evt) {
        Viewer.removeOverlays();
        //Featurinfo in two steps. First serverside and client side when finished
        var clientResult = forEachFeatureAtPixel(evt);
        if(clientResult !== false) {
            var result = [],
            serverResult = [],
            promiseFn = [];
            forEachLayerAtPixel(evt).map(function(request) {
                request.fn.done(function(data) {
                    var feature = maputils.geojsonToFeature(data),
                    layer = Viewer.getLayer(request.layer);
                    if(feature) {
                        serverResult.push({
                            layer: layer,
                            feature: feature,
                            content: getAttributes(feature, layer)
                        });
                    }
                });
                promiseFn.push(request.fn);
            });
            //When server side finished do client side
            $.when.apply($, promiseFn).done(function() {
              result = serverResult.concat(clientResult);
              if (result.length > 0) {
                  selectionLayer.clear();
                  identify(result, identifyTarget, evt.coordinate)
              }
              else if(selectionLayer.getFeatures().length > 0) {
                  selectionLayer.clear();
                  Popup.setVisibility(false);
                  sidebar.setVisibility(false);
                  console.log("Clearing selection");
              }
              else if(pinning){
                  var resolution = map.getView().getResolution();
                  setTimeout(function() {
                      if(!maputils.checkZoomChange(resolution, map.getView().getResolution())) {
                           var feature = maputils.createPointFeature(evt.coordinate, [pinStyle[0], selectionStyles['Point'][0]]);
                           selectionLayer.addFeature(feature);
                      }
                  }, 250);
              }
              else {
                  console.log('No features identified');
              }
            });
        }
        evt.preventDefault();
    });
    function forEachLayerAtPixel(evt) {
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
    function forEachFeatureAtPixel(evt) {
        var result = [],
        cluster = false;
        map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              var item = {};
              var l = layer;
              var queryable = false;
              if(layer) {
                  queryable = layer.get('queryable');
              }
              if(feature.get('features')) {
                  //If cluster
                  if (feature.get('features').length > 1) {
                    map.getView().setCenter(evt.coordinate);
                    var zoom = map.getView().getZoom();
                    if(zoom + 1 < Viewer.getResolutions().length) {
                      map.getView().setZoom(zoom + 1);
                    }
                    cluster = true;
                    return true;
                  }
                  else if(feature.get('features').length == 1 && queryable) {
                      item.layer = l;
                      item.feature = feature.get('features')[0];
                      item.content = getAttributes(feature.get('features')[0],l);
                      result.push(item);
                  }
              }
              else if(queryable) {
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
                obj.fn = getFeatureInfo(url);
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
            obj.fn = getFeatureInfo(url);
            return obj;
            break;
          default:
            return undefined;
        }
    }
    function getFeatureInfo(url) {
        return $.ajax(url, {
          type: 'post'
        });
    }
    function identify(items, target, coordinate) {
        var layers = items.map(function(i){
            return i.layer;
        });
        var content = items.map(function(i){
            return i.content;
        }).join('');
        content = '<div id="identify"><div id="mdk-identify-carousel" class="owl-carousel owl-theme">' + content + '</div></div>';
        switch (target) {
            case 'overlay':
                var geometry = items[0].feature.getGeometry();
                var coord;
                geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = coordinate;
                overlay.setPosition(coord);
                Popup.setContent({content: content, title: items[0].layer.get('title')});
                Popup.setVisibility(true);
                var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                    var currentItem = this.owl.currentItem;
                    selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
                    Popup.setTitle(items[currentItem].layer.get('title'));
                });
                Viewer.autoPan();
                break;
            case 'sidebar':
                sidebar.setContent({content: content, title: items[0].layer.get('title')});
                sidebar.setVisibility(true);
                var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                    var currentItem = this.owl.currentItem;
                    selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
                    sidebar.setTitle(items[currentItem].layer.get('title'));
                });
                break;
        }
    }
    function initCarousel(id, options, cb) {
        var carouselOptions = options || {
          navigation : true, // Show next and prev buttons
          slideSpeed : 300,
          paginationSpeed : 400,
          singleItem:true,
          rewindSpeed:200,
          navigationText: ['<svg class="mdk-icon-fa-chevron-left"><use xlink:href="css/svg/fa-icons.svg#fa-chevron-left"></use></svg>', '<svg class="mdk-icon-fa-chevron-right"><use xlink:href="css/svg/fa-icons.svg#fa-chevron-right"></use></svg>'],
          afterAction: cb
        };
        return $(id).owlCarousel(carouselOptions);
    }
    function getAttributes(feature, layer) {
      var content = '<div><ul>';
      var attribute, li = '', title, val;
      //If layer is configured with attributes
      if(layer.get('attributes')) {
            //If attributes is string then use template named with the string
            if(typeof layer.get('attributes') === 'string') {
                //Use attributes with the template
                li = featureinfotemplates(layer.get('attributes'),feature.getProperties());
            }
            else {
                for(var i=0; i<layer.get('attributes').length; i++) {
                  attribute = layer.get('attributes')[i];
                  title = '';
                  val = '';
                  if (attribute['name']) {
                    if(feature.get(attribute['name'])) {
                        val = feature.get(attribute['name']);
                        if (attribute['title']) {
                          title = '<b>' + attribute['title'] + '</b>';
                        }
                        if (attribute['url']) {
                          var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['url']));
                          val = '<a href="' + url + '" target="_blank">' +
                                feature.get(attribute['name']) +
                                '</a>';
                        }
                    }
                  }
                  else if (attribute['url']) {
                      if(feature.get(attribute['url'])) {
                          var text = attribute['html'] || attribute['url'];
                          var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['url']));
                          val = '<a href="' + url + '" target="_blank">' +
                                text +
                                '</a>';
                      }
                  }
                  else if (attribute['img']) {
                      if(feature.get(attribute['img'])) {
                          var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['img']));
                          var attribution = attribute['attribution'] ? '<div class="image-attribution">' + attribute['attribution'] + '</div>' : '';
                          val = '<div class="image-container">' +
                                    '<img src="' + url + '">' + attribution +
                                '</div>';
                      }
                  }
                  else if (attribute['html']) {
                    val = attribute['html'];
                  }

                  var cls = ' class="' + attribute['cls'] + '" ' || '';

                  li += '<li' + cls +'>' + title + val + '</li>';
                }
          }
      }
      else {
        //Clean feature attributes from non-wanted properties
        var attributes = filterObject(feature.getProperties(), ['FID_', 'geometry']);
        //Use attributes with the template
        li = featureinfotemplates('default',attributes);
      }
      content += li + '</ul></div>';
      return content;
    }
    function filterObject(obj, excludedKeys) {
        var result = {}, key;
        for (key in obj) {
            if(excludedKeys.indexOf(key) === -1) {
                result[key] = obj[key];
            }
        }
        return result;
    }
    function createUrl(prefix, suffix, url) {
        var p = prefix || '';
        var s = suffix || '';
        return p + url + s;
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
}
