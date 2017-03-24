/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var $geolocateButtonId = undefined;
var $geolocateButton = undefined;
var deltaMean = 500;
var enabled = false;
var map = undefined;
var geolocation = undefined;
var marker = undefined;
var markerEl = undefined;
var positions = undefined;
var baseUrl = undefined;

function init(opt_options) {
  var options = opt_options || {};
  var target = options.target || '#o-toolbar-navigation';
  map = viewer.getMap();
  baseUrl = viewer.getBaseUrl();

  render(target);

  $geolocateButtonId = $('#o-geolocation-button');
  $geolocateButton = $('#o-geolocation-button button');

  markerEl = $('#o-geolocation_marker').get(0);
  marker = new ol.Overlay({
    positioning: 'center-center',
    element: markerEl,
    stopEvent: false
  });

  positions = new ol.geom.LineString([], ('XYZM'));

  geolocation = new ol.Geolocation(({
    projection: map.getView().getProjection(),
    trackingOptions: {
      maximumAge: 10000,
      enableHighAccuracy: true,
      timeout: 600000
    }
  }));

  bindUIActions();
}

function render(target) {
  var tooltipText = 'Visa nuvarande position i kartan';
  var src = baseUrl + 'img/geolocation_marker.png';
  var markerImg = '<img id="o-geolocation_marker" src="' + src + '"/>';

  //Element for control
  var el = utils.createButton({
    id: 'o-geolocation-button',
    cls: 'o-geolocation-button',
    iconCls: 'o-icon-fa-location-arrow',
    src: '#fa-location-arrow',
    tooltipText: tooltipText,
    tooltipPlacement: 'east'
  });
  $(target).append(el);
  $('#o-map').prepend(markerImg);
}

function bindUIActions() {
  $geolocateButtonId.on('click', function(e) {
    enabled = false;
    toggle();
    $geolocateButton.blur();
    e.preventDefault();
  });
}

function toggle() {
  if ($geolocateButton.hasClass('o-geolocation-button-true')) {
    $geolocateButton.removeClass('o-geolocation-button-true');
    geolocation.setTracking(false);

    geolocation.un('change', updatePosition);
    map.un('postcompose', renderMap);
    map.removeOverlay(marker);
  } else {
    $geolocateButton.addClass('o-geolocation-button-true');
    map.addOverlay(marker);

    // Listen to position changes
    geolocation.on('change', updatePosition);
    geolocation.setTracking(true); // Start position tracking
    map.on('postcompose', renderMap);
    map.render();
  }
}

function updatePosition() {
  addPosition(getPositionVal());
}

function getPositionVal() {
  var current = {};
  current.position = geolocation.getPosition();
  current.accuracy = geolocation.getAccuracy();
  current.heading = geolocation.getHeading() || 0;
  current.speed = geolocation.getSpeed() || 0;
  current.m = Date.now();
  return current;
}

function addPosition(current) {
  var x = current.position[0];
  var y = current.position[1];
  var fCoords = positions.getCoordinates();
  var previous = fCoords[fCoords.length - 1];
  var prevHeading = previous && previous[2];
  var previousM;
  if (prevHeading) {
    var headingDiff = current.heading - mod(prevHeading);

    // force the rotation change to be less than 180°
    if (Math.abs(headingDiff) > Math.PI) {
      var sign = (headingDiff >= 0) ? 1 : -1;
      headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
    }
    var heading = prevHeading + headingDiff;
  }
  positions.appendCoordinate([x, y, current.heading, current.m]);

  // only keep the 20 last coordinates
  positions.setCoordinates(positions.getCoordinates().slice(-20));

  // FIXME use speed instead
  if (current.heading && current.speed) {
    markerEl.src = baseUrl + 'img/geolocation_marker_heading.png';
  } else {
    markerEl.src = baseUrl + 'img/geolocation_marker.png';
  }

  previousM = 0;

  // change center and rotation before render
  map.beforeRender(function(map, frameState) {
    if (frameState !== null) {

      // use sampling period to get a smooth transition
      var m = frameState.time - deltaMean * 1.5;
      m = Math.max(m, previousM);
      previousM = m;

      // interpolate position along positions LineString
      var c = positions.getCoordinateAtM(m, true);
      if (c && enabled === false && geolocation.getTracking()) {
        marker.setPosition(c);
        map.getView().setCenter(c);
        map.getView().setZoom(10);
        enabled = true;
      } else if (c && geolocation.getTracking()) {
        marker.setPosition(c);
      }
    }
    return true; // Force animation to continue
  });

}

function mod(n) {
  return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

function renderMap() {
  map.render;
}

module.exports.init = init;
