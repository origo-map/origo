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

var adress;
var map,
    name,
    northing,
    easting,
    geometryAttribute,
    idAttribute,
    layerNameAttribute,
    layerName,
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
    maxZoomLevel: options.maxZoomLevel || 2;
    hintText = options.hintText || "Sök...";
    hint = options.hasOwnProperty('hint') ? options.hint : true;
    highlight = options.hasOwnProperty('highlight') ? options.highlight : true;
    projectionCode = Viewer.getProjectionCode();

    map = Viewer.getMap();

    var el = '<div id="search-wrapper">' +
                '<div id="search" class="search search-false">' +
                    '<input class="search-field typeahead form-control" type="text" placeholder="' + hintText + '">' +
                    '<button id="search-button">' +
                        '<svg class="mdk-icon-fa-search">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-search"></use>' +
                        '</svg>' +
                    '</button>' +
                    '<button id="search-button-close">' +
                        '<svg class="mdk-icon-search-fa-times">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-times"></use>' +
                        '</svg>' +
                    '</button>' +
                '</div>' +
              '</div>';
    $('#map').append(el);
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
        $('.typeahead').on('typeahead:selected', function(evt, data){

          if(geometryAttribute) {
              var feature = wktToFeature(data[geometryAttribute], projectionCode);
              var coord = feature.getGeometry().getCoordinates();
          }
          else {
              var coord = [data[easting], data[northing]];
          }

          //Select geometry if configured with layerName or layerNameAttribute
          if(layerNameAttribute && idAttribute) {
              var layer = Viewer.getLayer(data[layerNameAttribute]);
              var id = data[idAttribute];
              var promise = getFeature(id, layer)
                .done(function(res) {
                    if(res.length > 0) {
                        var obj = {};
                        obj.layer = layer;
                        obj.feature = res[0];
                        obj.content = getAttributes(res[0], layer);
                        featureInfo.identify([obj], 'overlay', coord);
                        mapUtils.zoomToExent(res[0].getGeometry(), maxZoomLevel);
                    }
                    else {
                        showOverlay(data, coord);
                        mapUtils.zoomToExent(coord, maxZoomLevel);
                    }
                });
          }
          else {
              showOverlay(data, coord);
              mapUtils.zoomToExent(coord, maxZoomLevel);
          }
        });

        $('#search .search-field').on('input', function() {
          if($('#search .search-field.tt-input').val() &&  $('#search').hasClass('search-false')) {
            $('#search').removeClass('search-false');
            $('#search').addClass('search-true');
            onClearSearch();
          }
          else if(!($('#search .search-field.tt-input').val()) &&  $('#search').hasClass('search-true')) {
            $('#search').removeClass('search-true');
            $('#search').addClass('search-false');
            offClearSearch();
          }
        });
}
function onClearSearch() {
    $('#search-button-close').on('touchend click', function(e) {
      $('.typeahead').typeahead('val', '');
      featureInfo.clear();
      Viewer.removeOverlays();
      $('#search').removeClass('search-true');
      $('#search').addClass('search-false');
      $('#search .search-field.tt-input').val('');
      $('#search-button').blur();
      e.preventDefault();
    });
}
function offClearSearch() {
    console.log('offClearSearch');
    // $('#search-button').off('touchend click', function(e) {
    //   e.preventDefault();
    // });
}
function showOverlay(data, coord) {
    Viewer.removeOverlays();
    var overlay = new ol.Overlay({
      element: $('#popup').get(0)
    });

    map.addOverlay(overlay);

    overlay.setPosition(coord);
    var content = data[name];
    // content += '<br>' + data.postnr + '&nbsp;' + data.postort;
    Popup.setContent({content: content, title: title});
    Popup.setVisibility(true);
}

module.exports.init = init;
