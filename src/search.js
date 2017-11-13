"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var wktToFeature = require('./maputils').wktToFeature;
var Popup = require('./popup');
var typeahead = require('typeahead.js');
var getFeature = require('./getfeature');
var getAttributes = require('./getattributes');
var featureInfo = require('./featureinfo');
var mapUtils = require('./maputils');
var getCenter = require('./geometry/getcenter');
var utils = require('./utils');
var map;
var name;
var northing;
var easting;
var geometryAttribute;
var idAttribute;
var layerNameAttribute;
var layerName;
var titleAttribute;
var contentAttribute;
var markSearchableLayers;
var maxZoomLevel;
var url;
var title;
var hintText;
var hint;
var highlight;
var projectionCode;
var overlay;
var limit;
var minLength;

function init(options) {
  var el;
  name = options.searchAttribute;
  northing = options.northing || undefined;
  easting = options.easting || undefined;
  geometryAttribute = options.geometryAttribute;

  /** idAttribute in combination with layerNameAttribute
  must be defined if search result should be selected */
  idAttribute = options.idAttribute;
  layerNameAttribute = options.layerNameAttribute || undefined;
  layerName = options.layerName || undefined;
  url = options.url;
  title = options.title || '';
  titleAttribute = options.titleAttribute || undefined;
  contentAttribute = options.contentAttribute || undefined;
  markSearchableLayers = options.hasOwnProperty('markSearchableLayers') ? options.markSearchableLayers : false;
  maxZoomLevel = options.maxZoomLevel || Viewer.getResolutions().length - 2 || Viewer.getResolutions();
  limit = options.limit || 9;
  hintText = options.hintText || 'Sök...';
  hint = options.hasOwnProperty('hint') ? options.hint : true;
  highlight = options.hasOwnProperty('highlight') ? options.highlight : true;
  minLength = options.minLength || 4;
  projectionCode = Viewer.getProjectionCode();

  map = Viewer.getMap();

  el = '<div id="o-search-wrapper">' +
    '<div id="o-search" class="o-search o-search-false">' +
    '<input class="o-search-field typeahead form-control" type="text" placeholder="' + hintText + '">' +
    '<button id="o-search-button">' +
    '<svg class="o-icon-fa-search">' +
    '<use xlink:href="#fa-search"></use>' +
    '</svg>' +
    '</button>' +
    '<button id="o-search-button-close">' +
    '<svg class="o-icon-search-fa-times">' +
    '<use xlink:href="#fa-times"></use>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '</div>';
  $('#o-map').append(el);

  // fix for internet explorer
  $.support.cors = true;

  $('.typeahead').typeahead({
    autoSelect: true,
    hint: hint,
    highlight: highlight,
    minLength: minLength
  }, {
    name: 'adress',
    limit: limit,
    displayKey: name,
    source: function(query, syncResults, asyncResults) {
      var queryUrl = url + '?q=' + encodeURI(query);
      if(markSearchableLayers){
        queryUrl += '&l=' + Viewer.getSearchableLayers();
      }
      $.get(queryUrl, function(data) {
        asyncResults(data);
      });
    }
  });

  bindUIActions();
}

function bindUIActions() {
  $('.typeahead').on('typeahead:selected', selectHandler);

  $('#o-search .o-search-field').on('input', function() {
    if ($('#o-search .o-search-field.tt-input').val() && $('#o-search').hasClass('o-search-false')) {
      $('#o-search').removeClass('o-search-false');
      $('#o-search').addClass('o-search-true');
      onClearSearch();
    } else if (!($('#o-search .o-search-field.tt-input').val()) && $('#o-search').hasClass('o-search-true')) {
      $('#o-search').removeClass('o-search-true');
      $('#o-search').addClass('o-search-false');
    }
  });
}

function onClearSearch() {
  $('#o-search-button-close').on('click', function(e) {
    $('.typeahead').typeahead('val', '');
    featureInfo.clear();
    $('#o-search').removeClass('o-search-true');
    $('#o-search').addClass('o-search-false');
    $('#o-search .o-search-field.tt-input').val('');
    $('#o-search-button').blur();
    e.preventDefault();
  });
}

function showOverlay(data, coord) {
  var popup;
  var content;
  featureInfo.clear();
  clear();
  popup = Popup('#o-map');
  overlay = new ol.Overlay({
    element: popup.getEl()
  });

  map.addOverlay(overlay);

  overlay.setPosition(coord);
  content = data[name];
  popup.setContent({
    content: content,
    title: title
  });
  popup.setVisibility(true);
  mapUtils.zoomToExent(new ol.geom.Point(coord), maxZoomLevel);
}

function showFeatureInfo(features, title, content) {
  var obj = {};
  obj.feature = features[0];
  obj.title = title;
  obj.content = content;
  featureInfo.identify([obj], 'overlay', getCenter(features[0].getGeometry()));
  mapUtils.zoomToExent(features[0].getGeometry(), maxZoomLevel);
}

function clear() {
  Viewer.removeOverlays(overlay);
}

/** There are several different ways to handle selected search result.
 * Option 1. Feature info is requested from a map service.
 * In this case idAttribute and layerNameAttribute must be provided.
 * A map service is used to get the geometry and attributes. The layer is defined
 * as an ordinary layer in the layer config section.
 * Option 2. Same as option 1 but for single layer search. layerName is defined
 * as an option and is not included in the search response.
 * In this case geometryAttribute and layerName must be provided.
 * Option 3. Complete feature info is included in the search result.
 * In this case titleAttribute, contentAttribute and geometryAttribute must be provided.
 * Option 4. This is a single table search. No layer is defined.
 * In this case geometryAttribute and title must be defined.
 * Option 5. Feature info is shown without selection in the map.
 * This is a simple single table search. In this case title, northing and easting
 * must be defined. */

function selectHandler(evt, data) {
  var layer;
  var id;
  var feature;
  var content;
  var coord;
  if (layerNameAttribute && idAttribute) {
    layer = Viewer.getLayer(data[layerNameAttribute]);
    id = data[idAttribute];
    getFeature(id, layer)
      .done(function(res) {
        var featureWkt;
        var coordWkt;
        if (res.length > 0) {
          showFeatureInfo(res, layer.get('title'), getAttributes(res[0], layer));
        }

        // Fallback if no geometry in response
        else if (geometryAttribute) {
          featureWkt = wktToFeature(data[geometryAttribute], projectionCode);
          coordWkt = featureWkt.getGeometry().getCoordinates();
          showOverlay(data, coordWkt);
        }
      });
  } else if (geometryAttribute && layerName) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);
    layer = Viewer.getLayer(data[layerName]);
    showFeatureInfo([feature], layer.get('title'), getAttributes(feature, layer));
  } else if (titleAttribute && contentAttribute && geometryAttribute) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);

    // Make sure the response is wrapped in a html element
    content = utils.createElement('div', data[contentAttribute]);
    showFeatureInfo([feature], data[titleAttribute], content);
  } else if (geometryAttribute && title) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);
    content = utils.createElement('div', data[name]);
    showFeatureInfo([feature], title, content);
  } else if (easting && northing && title) {
    coord = [data[easting], data[northing]];
    showOverlay(data, coord);
  } else {
    console.log('Search options are missing');
  }
}

module.exports.init = init;
