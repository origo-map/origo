import $ from 'jquery';
import { getArea, getLength } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import viewer from '../viewer';
import utils from '../utils';
import Style from '../style';
import StyleTypes from '../style/styletypes';

const style = Style();
const styleTypes = StyleTypes();

let map;
let activeButton;
let defaultButton;
let measure;
let type;
let sketch;
let measureTooltip;
let measureTooltipElement;
let measureStyleOptions;
let helpTooltip;
let helpTooltipElement;
let vector;
let source;
let label;
let lengthTool;
let areaTool;
let defaultTool;
let isActive = false;
const overlayArray = [];

function createStyle(feature) {
  const featureType = feature.getGeometry().getType();
  const measureStyle = featureType === 'LineString' ? style.createStyleRule(measureStyleOptions.linestring) : style.createStyleRule(measureStyleOptions.polygon);

  return measureStyle;
}

function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }

  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'o-tooltip o-tooltip-measure';

  helpTooltip = new Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });

  overlayArray.push(helpTooltip);
  map.addOverlay(helpTooltip);
}

function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }

  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'o-tooltip o-tooltip-measure';

  measureTooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false
  });

  overlayArray.push(measureTooltip);
  map.addOverlay(measureTooltip);
}

function formatLength(line) {
  const projection = map.getView().getProjection().code;
  const length = getLength(line, {
    projection
  });
  let output;

  if (length > 100) {
    output = `${Math.round((length / 1000) * 100) / 100} km`;
  } else {
    output = `${Math.round(length * 100) / 100} m`;
  }

  return output;
}

function formatArea(polygon) {
  const projection = map.getView().getProjection().code;
  const area = getArea(polygon, {
    projection
  });
  let output;

  if (area > 10000000) {
    output = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
  } else if (area > 10000) {
    output = `${Math.round((area / 10000) * 100) / 100} ha`;
  } else {
    output = `${Math.round(area * 100) / 100} m<sup>2</sup>`;
  }

  const htmlElem = document.createElement('span');
  htmlElem.innerHTML = output;

  [].forEach.call(htmlElem.children, (element) => {
    if (element.tagName === 'SUP') {
      element.textContent = String.fromCharCode(element.textContent.charCodeAt(0) + 128);
    }
  });

  return htmlElem.textContent;
}

function toggleMeasure() {
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
}

function setActive(state) {
  isActive = state;
}

// Display and move tooltips with pointer
function pointerMoveHandler(evt) {
  if (evt.dragging) {
    return;
  }

  const helpMsg = 'Klicka för att börja mäta';
  let tooltipCoord = evt.coordinate;

  if (sketch) {
    const geom = (sketch.getGeometry());
    let output;

    if (geom.getType() === 'Polygon') {
      output = formatArea((geom));
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom.getType() === 'LineString') {
      output = formatLength((geom));
      tooltipCoord = geom.getLastCoordinate();
    }

    measureTooltipElement.innerHTML = output;
    label = output;
    measureTooltip.setPosition(tooltipCoord);
  }

  if (evt.type === 'pointermove') {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  }
}

function addInteraction() {
  vector.setVisible(true);

  measure = new DrawInteraction({
    source,
    type,
    style: style.createStyleRule(measureStyleOptions.interaction)
  });

  map.addInteraction(measure);

  createMeasureTooltip();
  createHelpTooltip();

  map.on('pointermove', pointerMoveHandler);
  map.on('click', pointerMoveHandler);

  measure.on('drawstart', (evt) => {
    // set sketch
    sketch = evt.feature;
    $(helpTooltipElement).addClass('o-hidden');
  }, this);

  measure.on('drawend', (evt) => {
    const feature = evt.feature;
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
}

function onEnableInteraction(e) {
  if (e.interaction === 'measure') {
    $('#o-measure-button button').addClass('o-measure-button-true');
    if (lengthTool) {
      $('#o-measure-line-button').removeClass('o-hidden');
    }
    if (areaTool) {
      $('#o-measure-polygon-button').removeClass('o-hidden');
    }
    $('#o-measure-button').removeClass('tooltip');
    setActive(true);
    defaultButton.trigger('click');
  } else {
    if (activeButton) {
      activeButton.removeClass('o-measure-button-true');
    }

    $('#o-measure-button button').removeClass('o-measure-button-true');
    if (lengthTool) {
      $('#o-measure-line-button').addClass('o-hidden');
    }
    if (areaTool) {
      $('#o-measure-polygon-button').addClass('o-hidden');
    }
    $('#o-measure-button').addClass('tooltip');

    map.un('pointermove', pointerMoveHandler);
    map.un('click', pointerMoveHandler);
    map.removeInteraction(measure);
    vector.setVisible(false);
    viewer.removeOverlays(overlayArray);
    vector.getSource().clear();
    setActive(false);
  }
}

function toggleType(button) {
  if (activeButton) {
    activeButton.removeClass('o-measure-button-true');
  }

  button.addClass('o-measure-button-true');
  activeButton = button;
  map.removeInteraction(measure);
  addInteraction();
}

function render(target) {
  if (lengthTool || areaTool) {
    const toolbar = utils.createElement('div', '', {
      id: 'o-measure-toolbar',
      cls: 'o-toolbar-horizontal'
    });

    $(target).append(toolbar);

    const mb = utils.createButton({
      id: 'o-measure-button',
      cls: 'o-measure-button',
      iconCls: 'o-icon-steady-measure',
      src: '#steady-measure',
      tooltipText: 'Mät i kartan'
    });
    $('#o-measure-toolbar').append(mb);
  }

  if (lengthTool) {
    const lb = utils.createButton({
      id: 'o-measure-line-button',
      cls: 'o-measure-type-button',
      iconCls: 'o-icon-minicons-line-vector',
      src: '#minicons-line-vector',
      tooltipText: 'Linje',
      tooltipPlacement: 'north'
    });
    $('#o-measure-toolbar').append(lb);
    $('#o-measure-line-button').addClass('o-hidden');
  }

  if (areaTool) {
    const pb = utils.createButton({
      id: 'o-measure-polygon-button',
      cls: 'o-measure-type-button',
      iconCls: 'o-icon-minicons-square-vector',
      src: '#minicons-square-vector',
      tooltipText: 'Yta',
      tooltipPlacement: 'north'
    });
    $('#o-measure-toolbar').append(pb);
    $('#o-measure-polygon-button').addClass('o-hidden');
  }
}

function bindUIActions() {
  if (lengthTool || areaTool) {
    $('#o-measure-button').on('click', (e) => {
      toggleMeasure();
      $('#o-measure-button button').blur();
      e.preventDefault();
    });
  }

  if (lengthTool) {
    $('#o-measure-line-button').on('click', (e) => {
      type = 'LineString';
      toggleType($('#o-measure-line-button button'));
      $('#o-measure-line-button button').blur();
      e.preventDefault();
    });
  }

  if (areaTool) {
    $('#o-measure-polygon-button').on('click', (e) => {
      type = 'Polygon';
      toggleType($('#o-measure-polygon-button button'));
      $('#o-measure-polygon-button button').blur();
      e.preventDefault();
    });
  }
}

function init({
  default: defaultMeasureTool = 'length',
  measureTools = ['length', 'area'],
  target = '#o-toolbar-maptools'
} = {}) {
  lengthTool = measureTools.indexOf('length') >= 0;
  areaTool = measureTools.indexOf('area') >= 0;
  defaultTool = lengthTool ? defaultMeasureTool : 'area';

  if (lengthTool || areaTool) {
    map = viewer.getMap();
    source = new VectorSource();
    measureStyleOptions = styleTypes.getStyle('measure');

    // Drawn features
    vector = new VectorLayer({
      source,
      name: 'measure',
      visible: false,
      zIndex: 6
    });

    map.addLayer(vector);

    $('.o-map').on('enableInteraction', onEnableInteraction);

    render(target);
    bindUIActions();
    if (defaultTool === 'area') {
      defaultButton = $('#o-measure-polygon-button button');
    } else if (defaultTool === 'length') {
      defaultButton = $('#o-measure-line-button button');
    }
  }
}

export default { init };
