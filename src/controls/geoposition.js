import $ from 'jquery';
import Geolocation from 'ol/geolocation';
import Overlay from 'ol/overlay';
import viewer from '../viewer';
import utils from '../utils';

let $geolocateButtonId;
let $geolocateButton;
let map;
let geolocation;
let marker;
let markerEl;
let baseUrl;
let zoomLevel;
let enabled = false;

function addPosition(current) {
  const position = current.position;

  if (enabled === false && geolocation.getTracking()) {
    marker.setPosition(position);
    map.getView().animate({
      center: position,
      zoom: zoomLevel
    });
    enabled = true;
  } else if (geolocation.getTracking()) {
    marker.setPosition(position);
  }
}

function getPositionVal() {
  const current = {};
  current.position = geolocation.getPosition();
  current.accuracy = geolocation.getAccuracy();
  current.heading = geolocation.getHeading() || 0;
  current.speed = geolocation.getSpeed() || 0;
  current.m = Date.now();
  return current;
}

function updatePosition() {
  addPosition(getPositionVal());
}

function toggle() {
  if ($geolocateButton.hasClass('o-geolocation-button-true')) {
    $geolocateButton.removeClass('o-geolocation-button-true');
    geolocation.setTracking(false);

    geolocation.un('change', updatePosition);
    map.removeOverlay(marker);
  } else {
    $geolocateButton.addClass('o-geolocation-button-true');
    map.addOverlay(marker);

    // Listen to position changes
    geolocation.on('change', updatePosition);
    geolocation.setTracking(true); // Start position tracking
  }
}

function render(target) {
  const tooltipText = 'Visa nuvarande position i kartan';
  const src = `${baseUrl}img/geolocation_marker.png`;
  const markerImg = `<img id="o-geolocation_marker" src="${src}"/>`;

  // Element for control
  const el = utils.createButton({
    id: 'o-geolocation-button',
    cls: 'o-geolocation-button',
    iconCls: 'o-icon-fa-location-arrow',
    src: '#fa-location-arrow',
    tooltipText,
    tooltipPlacement: 'east'
  });
  $(target).append(el);
  $('#o-map').prepend(markerImg);
}

function bindUIActions() {
  $geolocateButtonId.on('click', (e) => {
    enabled = false;
    toggle();
    $geolocateButton.blur();
    e.preventDefault();
  });
}

function init(optOptions) {
  const options = optOptions || {};
  const target = options.target || '#o-toolbar-navigation';
  map = viewer.getMap();
  baseUrl = viewer.getBaseUrl();
  zoomLevel = options.zoomLevel || viewer.getResolutions().length - 3 || 0;

  render(target);

  $geolocateButtonId = $('#o-geolocation-button');
  $geolocateButton = $('#o-geolocation-button button');

  markerEl = $('#o-geolocation_marker').get(0);
  marker = new Overlay({
    positioning: 'center-center',
    element: markerEl,
    stopEvent: false
  });

  geolocation = new Geolocation(({
    projection: map.getView().getProjection(),
    trackingOptions: {
      maximumAge: 10000,
      enableHighAccuracy: true,
      timeout: 600000
    }
  }));

  bindUIActions();
}

export default { init };
