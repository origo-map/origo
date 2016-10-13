/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var wktToFeature = require('./maputils')['wktToFeature'];
var Popup = require('./popup');
var typeahead = require("typeahead.js-browserify");
typeahead.loadjQueryPlugin();
var Bloodhound = require("typeahead.js-browserify").Bloodhound;
var getFeature = require('./getfeature');
var getAttributes = require('./getattributes');
var featureInfo = require('./featureinfo');
var mapUtils = require('./maputils');
var utils = require('./utils');

var adress;
var map,
    name,
    northing,
    easting,
    geometryAttribute,
    idAttribute,
    layerNameAttribute,
    layerName,
    titleAttribute,
    contentAttribute,
    maxZoomLevel,
    url,
    title,
    hintText,
    hint,
    highlight,
    projectionCode;

function init(options){

    name = options.searchAttribute;
    northing = options.northing || undefined;
    easting = options.easting || undefined;
    geometryAttribute = options.geometryAttribute;
    idAttribute = options.idAttribute; //idAttribute in combination with layerNameAttribute must be defined if search result should be selected
    layerNameAttribute = options.layerNameAttribute || undefined;
    layerName = options.layerName || undefined;
    url = options.url;
    title = options.title || '';
    titleAttribute = options.titleAttribute || undefined;
    contentAttribute = options.contentAttribute || undefined;
    maxZoomLevel: options.maxZoomLevel || 2;
    hintText = options.hintText || "Sök...";
    hint = options.hasOwnProperty('hint') ? options.hint : true;
    highlight = options.hasOwnProperty('highlight') ? options.highlight : true;
    projectionCode = Viewer.getProjectionCode();

    map = Viewer.getMap();

    var el = '<div id="o-search-wrapper">' +
                '<div id="o-search" class="o-search o-search-false">' +
                    '<input class="o-search-field typeahead form-control" type="text" placeholder="' + hintText + '">' +
                    '<button id="o-search-button">' +
                        '<svg class="o-icon-fa-search">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-search"></use>' +
                        '</svg>' +
                    '</button>' +
                    '<button id="o-search-button-close">' +
                        '<svg class="o-icon-search-fa-times">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-times"></use>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
              '</div>';
    $('#o-map').append(el);
    // constructs the suggestion engine
    // fix for internet explorer
        // constructs the suggestion engine
        // fix for internet explorer
    $.support.cors = true;
    adress = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(name),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      limit: 10,
      remote: {
        url: url + '?q=&QUERY',
        wildcard: '&QUERY',
        ajax: {
          contentType:'application/json',
          type: 'POST',
          crossDomain: true,
          success: function(data) {
            data.sort(function(a, b) {
              return a[name].localeCompare(b[name]);
            });
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
          }
        }
      }
    });

    adress.initialize();

    $('.typeahead').typeahead({
      autoSelect: true,
      hint: hint,
      highlight: highlight,
      minLength: 4
    },
    {
      name: 'adress',
      limit: 9,
      displayKey: name,
      source: adress.ttAdapter()
      // templates: {
      //   suggestion: function(data) {
      //     return data.NAMN;
      //   }
      // }
    });

    bindUIActions();
}
function bindUIActions() {
        $('.typeahead').on('typeahead:selected', selectHandler);

        $('#o-search .o-search-field').on('input', function() {
          if($('#o-search .o-search-field.tt-input').val() &&  $('#o-search').hasClass('o-search-false')) {
            $('#o-search').removeClass('o-search-false');
            $('#o-search').addClass('o-search-true');
            onClearSearch();
          }
          else if(!($('#o-search .o-search-field.tt-input').val()) &&  $('#o-search').hasClass('o-search-true')) {
            $('#o-search').removeClass('o-search-true');
            $('#o-search').addClass('o-search-false');
            offClearSearch();
          }
        });
}
function onClearSearch() {
    $('#o-search-button-close').on('click', function(e) {
      $('.typeahead').typeahead('val', '');
      featureInfo.clear();
      Viewer.removeOverlays();
      $('#o-search').removeClass('o-search-true');
      $('#o-search').addClass('o-search-false');
      $('#o-search .o-search-field.tt-input').val('');
      $('#o-search-button').blur();
      e.preventDefault();
    });
}
function offClearSearch() {
    console.log('offClearSearch');
    // $('#search-button').off('click', function(e) {
    //   e.preventDefault();
    // });
}
function showOverlay(data, coord) {
    Viewer.removeOverlays();
    var overlay = new ol.Overlay({
        element: $('#o-popup').get(0)
    });

    map.addOverlay(overlay);

    overlay.setPosition(coord);
    var content = data[name];
    // content += '<br>' + data.postnr + '&nbsp;' + data.postort;
    Popup.setContent({
        content: content,
        title: title
    });
    Popup.setVisibility(true);

    mapUtils.zoomToExent(new ol.geom.Point(coord), maxZoomLevel);
}
function showFeatureInfo(features, title, content) {
    var obj = {};
    obj.feature = features[0];
    obj.title = title;
    obj.content = content;
    featureInfo.identify([obj], 'overlay', mapUtils.getCenter(features[0].getGeometry()));
    mapUtils.zoomToExent(features[0].getGeometry(), maxZoomLevel);
}

/**There are several different ways to handle selected search result.
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
 * must be defined.
 */
function selectHandler(evt, data) {

    if (layerNameAttribute && idAttribute) {
        var layer = Viewer.getLayer(data[layerNameAttribute]);
        var id = data[idAttribute];
        var promise = getFeature(id, layer)
            .done(function(res) {
                if (res.length > 0) {
                    showFeatureInfo(res, layer.get('title'), getAttributes(res[0], layer));
                }
                //Fallback if no geometry in response
                else if (geometryAttribute) {
                    var feature = wktToFeature(data[geometryAttribute], projectionCode);
                    var coord = feature.getGeometry().getCoordinates();
                    showOverlay(data, coord);
                }
            });
    } else if (geometryAttribute && layerName) {
        var feature = wktToFeature(data[geometryAttribute], projectionCode);
        var layer = Viewer.getLayer(data[layerName]);
        showFeatureInfo([feature], layer.get('title'), getAttributes(feature, layer));
    } else if (titleAttribute && contentAttribute && geometryAttribute) {
        var feature = wktToFeature(data[geometryAttribute], projectionCode);
        //Make sure the response is wrapped in a html element
        var content = utils.createElement('div', data[contentAttribute])
        showFeatureInfo([feature], data[titleAttribute], content);
    } else if (geometryAttribute && title) {
        var feature = wktToFeature(data[geometryAttribute], projectionCode);
        var content = utils.createElement('div', data[name]);
        showFeatureInfo([feature], title, content);
    } else if (easting && northing && title) {
        var coord = [data[easting], data[northing]];
        showOverlay(data, coord);
    } else {
        console.log('Search options are missing');
    }
}

module.exports.init = init;
