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
var typeahead = require('../externs/typeahead.bloodhound.browserify.js');
typeahead.loadjQueryPlugin();
var Bloodhound = require('../externs/typeahead.bloodhound.browserify.js').Bloodhound;
var getFeature = require('./getfeature');
var getAttributes = require('./getattributes');
var featureInfo = require('./featureinfo');

var adress, fastighet;
var map,
    name,
    northing,
    easting,
    geometryAttribute,
    idAttribute,
    layerNameAttribute,
    layerName,
    urlAds,
    urlFat,
    content,
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
    urlAds = options.urlAds;
    urlFat = options.urlFat;
    title = options.title || '';
    hintText = options.hintText || "Sök i Hallstakartan";
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
    fastighet = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: urlFat + '?q=&QUERY',
        wildcard: '&QUERY',
    }
    });
    adress = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      remote: {
        url: urlAds + '?q=%QUERY',
        wildcard: '%QUERY'
      }
    });

    adress.initialize();
    fastighet.initialize();

    $('.typeahead').typeahead({
      autoSelect: true,
      hint: hint,
      highlight: highlight,
      minLength: 2
    }, {
      name: 'fastighet',
      limit: 5,
      displayKey: name,
      source: fastighet,
      templates: {
          footer: '<h3 class="multiple-datasets"></h3>'
      }
      }, {
        name: 'adress',
        limit: 5,
        displayKey: name,
        source: adress
      });

    bindUIActions();
}
function bindUIActions() {
        $('.typeahead').on('typeahead:selected', function(evt, data){

          var feature = wktToFeature(data[geometryAttribute], projectionCode);
          var featureExtent = feature.getGeometry().getExtent();
          var coord = ol.extent.getCenter(featureExtent);

          showOverlay(data, coord);

          map.getView().fit(feature.getGeometry(), map.getSize());
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

function showOverlay(data, coord) {
    Viewer.removeOverlays();
    var overlay = new ol.Overlay({
      element: $('#popup').get(0)
    });

    map.addOverlay(overlay);

    overlay.setPosition(coord);
    title = data.title;
    var content = data.content;
    Popup.setContent({content: content, title: title});
    Popup.setVisibility(true);
}

module.exports.init = init;
