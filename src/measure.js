"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');
var style = require('./style')();
var styleTypes = require('./style/styletypes');

var map;
var activeButton;
var defaultButton;
var measure;
var type;
var sketch;
var measureTooltip;
var measureTooltipElement;
var measureStyleOptions;
var helpTooltip;
var helpTooltipElement;
var vector;
var source;
var label;
var overlayArray = [];
var drawStart = false;
var isActive = false;

function init() {
  map = Viewer.getMap();
  source = new ol.source.Vector();
  measureStyleOptions = styleTypes.getStyle('measure');

  //Drawn features
  vector = new ol.layer.Vector({
    source: source,
    name: 'measure',
    visible: false,
    zIndex: 6
  });

  map.addLayer(vector);

  $('.o-map').on('enableInteraction', onEnableInteraction);

  render();
  bindUIActions();

  defaultButton = $('#o-measure-line-button button');
}

function onEnableInteraction(e) {
  if(e.interaction === 'measure') {
    $('#o-measure-button button').addClass('o-measure-button-true');
    $('#o-measure-line-button').removeClass('o-hidden');
    $('#o-measure-polygon-button').removeClass('o-hidden');
    $('#o-measure-button').removeClass('tooltip');
    setActive(true);
    defaultButton.trigger('click');
  } else {
    if (activeButton) {
      activeButton.removeClass('o-measure-button-true');
    };

    $('#o-measure-button button').removeClass('o-measure-button-true');
    $('#o-measure-line-button').addClass('o-hidden');
    $('#o-measure-polygon-button').addClass('o-hidden');
    $('#o-measure-button').addClass('tooltip');

    map.un('pointermove', pointerMoveHandler);
    map.un('click', pointerMoveHandler);
    map.removeInteraction(measure);
    vector.setVisible(false);
    Viewer.removeOverlays(overlayArray);
    vector.getSource().clear();
    setActive(false);
  }

}

function setActive(state) {
  if(state === true) {
    isActive = true;
  } else {
    isActive = false;
  }

}

function render() {
  var mb = utils.createButton({
    id: 'o-measure-button',
    cls: 'o-measure-button',
    iconCls: 'o-icon-steady-measure',
    src: '#steady-measure',
    tooltipText: 'Mät i kartan'
  });

  $('#o-map').append(mb);

  var lb = utils.createButton({
    id: 'o-measure-line-button',
    cls: 'o-measure-type-button',
    iconCls: 'o-icon-minicons-line-vector',
    src: '#minicons-line-vector',
    tooltipText: 'Linje',
    tooltipPlacement: 'north'
  });

  $('#o-map').append(lb);
  $('#o-measure-line-button').addClass('o-hidden');

  var pb = utils.createButton({
    id: 'o-measure-polygon-button',
    cls: 'o-measure-type-button',
    iconCls: 'o-icon-minicons-square-vector',
    src: '#minicons-square-vector',
    tooltipText: 'Yta',
    tooltipPlacement: 'north'
  });

  $('#o-map').append(pb);
  $('#o-measure-polygon-button').addClass('o-hidden');
}

function bindUIActions() {
  $('#o-measure-button').on('click', function(e) {
    toggleMeasure();
    $('#o-measure-button button').blur();
    e.preventDefault();
  });

  $('#o-measure-line-button').on('click', function(e) {
    type = 'LineString';
    toggleType($('#o-measure-line-button button'));
    $('#o-measure-line-button button').blur();
    e.preventDefault();
  });

  $('#o-measure-polygon-button').on('click', function(e) {
    type = 'Polygon';
    toggleType($('#o-measure-polygon-button button'));
    $('#o-measure-polygon-button button').blur();
    e.preventDefault();
  });

}

function createStyle(feature, labelText) {
  var featureType = feature.getGeometry().getType();
  var measureStyle = featureType == 'LineString' ? style.createStyleRule(measureStyleOptions.linestring) : style.createStyleRule(measureStyleOptions.polygon);

  return measureStyle;
}

//Display and move tooltips with pointer
function pointerMoveHandler(evt) {
  if (evt.dragging) {
    return;
  }

  var helpMsg = 'Klicka för att börja mäta';
  var tooltipCoord = evt.coordinate;

  if (sketch) {
    var output;
    var geom = (sketch.getGeometry());

    if (geom instanceof ol.geom.Polygon) {
      output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof ol.geom.LineString) {
      output = formatLength( /** @type {ol.geom.LineString} */ (geom));
      tooltipCoord = geom.getLastCoordinate();
    }

    measureTooltipElement.innerHTML = output;
    label = output;
    measureTooltip.setPosition(tooltipCoord);
  }

  if (evt.type == 'pointermove') {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  }

};

function addInteraction() {
  vector.setVisible(true);

  measure = new ol.interaction.Draw({
    source: source,
    type: type,
    style: style.createStyleRule(measureStyleOptions.interaction)
  });

  map.addInteraction(measure);

  createMeasureTooltip();
  createHelpTooltip();

  map.on('pointermove', pointerMoveHandler);
  map.on('click', pointerMoveHandler);

  measure.on('drawstart', function(evt) {
    // set sketch
    drawStart = true;
    sketch = evt.feature;
    $(helpTooltipElement).addClass('o-hidden');
  }, this);

  measure.on('drawend', function(evt) {
    var feature = evt.feature;
    feature.setStyle(createStyle(feature));
    feature.getStyle()[0].getText().setText(label);
    $(measureTooltipElement).remove();
    // unset sketch
    sketch = null;
    // unset tooltip so that a new one can be created
    measureTooltipElement = null;
    createMeasureTooltip();
    $(helpTooltipElement).removeClass('o-hidden');
  }, this);

};

function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }

  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'o-tooltip o-tooltip-measure';

  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left',
  });

  overlayArray.push(helpTooltip);
  map.addOverlay(helpTooltip);
};

function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }

  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'o-tooltip o-tooltip-measure';

  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false
  });

  overlayArray.push(measureTooltip);
  map.addOverlay(measureTooltip);
};

function formatLength(line) {
  var length;
  length = Math.round(line.getLength() * 100) / 100;
  var output;

  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
      ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
      ' ' + 'm';
  }

  return output;
};

function formatArea(polygon) {
  var area;
  area = polygon.getArea();
  var output;

  if (area > 10000000) {
    output = (Math.round(area / 1000000 * 100) / 100) +
      ' ' + 'km<sup>2</sup>';
  } else if (area > 10000) {
    output = (Math.round(area / 10000 * 100) / 100) +
      ' ' + 'ha';
  } else {
    output = (Math.round(area * 100) / 100) +
      ' ' + 'm<sup>2</sup>';
  }

  var htmlElem = document.createElement('span');
  htmlElem.innerHTML = output;

  [].forEach.call(htmlElem.children, function(element) {
    if (element.tagName === 'SUP') {
      element.textContent = String.fromCharCode(element.textContent.charCodeAt(0) + 128);
    }
  })

  return htmlElem.textContent;
};

function toggleMeasure () {
  if (isActive) {
    $('.o-map').trigger({
      type: 'enableInteraction',
      interaction: 'featureInfo'
    });
  } else {
    $('.o-map').trigger({
      type: 'enableInteraction',
      interaction: 'measure'
    });
  }

};

function toggleType(button) {
  if (activeButton) {
    activeButton.removeClass('o-measure-button-true');
  }

  button.addClass('o-measure-button-true');
  activeButton = button;
  map.removeInteraction(measure);
  addInteraction();
};

module.exports.init = init;
