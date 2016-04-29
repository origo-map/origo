/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var Popup = require('./popup');
var typeahead = require("typeahead.js-browserify");
typeahead.loadjQueryPlugin();
var Bloodhound = require("typeahead.js-browserify").Bloodhound;

var adress;
var name, northing, easting, url, title;

function init(options){

    // name = options.searchAttribute;
    // northing = options.northing;
    // easting = options.easting;
    // url = options.url;
    // title = options.title || '';

    var proj = [
        {
            "code": "EPSG:3010",
            "alias": "urn:ogc:def:crs:EPSG::3010",
            "projection": "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
        },
        {
          "code": "EPSG:3006",
          "alias": "urn:ogc:def:crs:EPSG::3006",
          "projection": "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
        }
    ];

    for (var i=0; i<proj.length; i++) {
        proj4.defs(proj[i].code, proj[i].projection);
        if(proj[i].hasOwnProperty('alias')) {
            proj4.defs(proj[i].alias, proj4.defs(proj[i].code));
        }
    }

    var el = '<div id="search-wrapper">' +
                '<div id="search" class="search search-false">' +
                    '<input class="search-field typeahead form-control" type="text" placeholder="Sök adress...">' +
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
        url: 'http://www.malardalskartan.se/addressok?s=&QUERY',
        wildcard: '&QUERY',
        ajax: {
          contentType:'application/json',
          type: 'POST',
          crossDomain: true,
          success: function(data) {
            data.sort(function(a, b) {
              return a.adressomrade.localeCompare(b.adressomrade);
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
      hint: true,
      highlight: true,
      minLength: 4
    },
    {
      name: 'adress',
      displayKey: 'adressomrade',
      limit: 9,
      source: adress.ttAdapter()
    });

    bindUIActions();
}
function bindUIActions() {
          $('.typeahead').on('typeahead:selected', function(evt, data){
              // alert(data.x);
            // Popup.init('#map');
            Viewer.removeOverlays();
            var map = Viewer.getMap();
            var overlay = new ol.Overlay({
              element: $('#popup')
            });

            map.addOverlay(overlay);

            // adressplatspunkt: {srsName: "EPSG:3006", gml:pos: "6611684.407 627413.711"}
            var srs = data.adressplatspunkt['srsName'];
            var mapSrs = Viewer.getSettings()['projectionCode'];
            var coord = data.adressplatspunkt['gml:pos'].split(' ').reverse();
            if (srs != mapSrs) {
              coord = ol.proj.transform(coord, srs, mapSrs);
            }

            overlay.setPosition(coord);
            var content = data.adressomrade;
            content += '<br>' + data.postnummer + ' ' + data.kommunnamn;
            var title = 'Adress';
            Popup.setContent({content: content, title: title});
            Popup.setVisibility(true);

            map.getView().setCenter(coord);
            map.getView().setZoom(11);
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
      Popup.setVisibility(false);
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

module.exports.init = init;
