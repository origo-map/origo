import { getArea, getLength } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Projection from 'ol/proj/Projection';
import * as Extent from 'ol/extent';
import { Component, Icon, Element as El, Button, dom } from '../ui';
import Style from '../style';
import StyleTypes from '../style/styletypes';
import replacer from '../utils/replacer';

const Measure = function Measure({
  default: defaultMeasureTool = 'length',
  measureTools = ['length', 'area'],
  elevationServiceURL,
  elevationTargetProjection,
  elevationAttribute,
  showSegmentLengths = false,
  useHectare = true
} = {}) {
  const style = Style;
  const styleTypes = StyleTypes();

  let map;
  let activeButton;
  let defaultButton;
  let measure;
  let type;
  let sketch;
  let prevSketchLength = 0;
  let measureTooltip;
  let measureTooltipElement;
  let measureStyleOptions;
  let helpTooltip;
  let helpTooltipElement;
  let markerIcon;
  let markerElement;
  let vector;
  let source;
  let label;
  let lengthTool;
  let areaTool;
  let elevationTool;
  let defaultTool;
  let isActive = false;
  let tempOverlayArray = [];
  const overlayArray = [];

  let viewer;
  let measureElement;
  let measureButton;
  let lengthToolButton;
  let areaToolButton;
  let elevationToolButton;
  let addNodeButton;
  let undoButton;
  let clearButton;
  const buttons = [];
  let target;
  let touchMode;

  function createStyle(feature) {
    const featureType = feature.getGeometry().getType();
    const measureStyle = featureType === 'LineString' ? style.createStyleRule(measureStyleOptions.linestring) : style.createStyleRule(measureStyleOptions.polygon);

    return measureStyle;
  }
  function setActive(state) {
    isActive = state;
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

    tempOverlayArray.push(helpTooltip);
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

    tempOverlayArray.push(measureTooltip);
    map.addOverlay(measureTooltip);
  }

  function formatLength(line) {
    const projection = map.getView().getProjection();
    const length = getLength(line, {
      projection
    });
    let output;

    if (length > 1000) {
      output = `${Math.round((length / 1000) * 100) / 100} km`;
    } else {
      output = `${Math.round(length * 100) / 100} m`;
    }

    return output;
  }

  function formatArea(polygon) {
    const projection = map.getView().getProjection();
    const area = getArea(polygon, {
      projection
    });
    let output;

    if (area > 10000000) {
      output = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
    } else if (area > 10000 && useHectare) {
      output = `${Math.round((area / 10000) * 100) / 100} ha`;
    } else {
      output = `${Math.round(area * 100) / 100} m<sup>2</sup>`;
    }

    const htmlElem = document.createElement('span');
    htmlElem.innerHTML = output;

    [].forEach.call(htmlElem.children, (element) => {
      const el = element;
      if (el.tagName === 'SUP') {
        el.innerHTML = String.fromCharCode(el.innerHTML.charCodeAt(0) + 128);
      }
    });

    return htmlElem.textContent;
  }

  function getElevationAttribute(path, obj = {}) {
    const properties = Array.isArray(path) ? path : path.split(/[.[\]]+/).filter(element => element);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
  }

  function getElevation(evt) {
    const feature = evt.feature;
    let coordinates;
    let elevationProjection;
    const options = {
      start: '{',
      end: '}'
    };

    if (elevationTargetProjection && elevationTargetProjection !== viewer.getProjection().getCode()) {
      const clone = feature.getGeometry().clone();
      clone.transform(viewer.getProjection().getCode(), elevationTargetProjection);
      coordinates = clone.getCoordinates();
      elevationProjection = new Projection({ code: elevationTargetProjection });
    } else {
      coordinates = feature.getGeometry().getCoordinates();
      elevationProjection = viewer.getProjection();
    }

    let easting = coordinates[0];
    let northing = coordinates[1];

    switch (elevationProjection.getAxisOrientation()) {
      case 'enu':
        easting = coordinates[0];
        northing = coordinates[1];
        break;
      case 'neu':
        northing = coordinates[0];
        easting = coordinates[1];
        break;
      default:
        easting = coordinates[0];
        northing = coordinates[1];
        break;
    }

    const url = replacer.replace(elevationServiceURL, {
      easting,
      northing
    }, options);

    feature.setStyle(createStyle(feature));
    feature.getStyle()[0].getText().setText('Hämtar höjd...');

    fetch(url).then(response => response.json({
      cache: false
    })).then((data) => {
      const elevation = getElevationAttribute(elevationAttribute, data);
      feature.getStyle()[0].getText().setText(`${elevation.toFixed(1)} m`);
      source.changed();
    });
  }

  function placeMeasurementLabel(segment, coords) {
    const aa = segment.getExtent();
    const oo = Extent.getCenter(aa);
    measureElement = document.createElement('div');
    measureElement.className = 'o-tooltip o-tooltip-measure';
    measureElement.id = `measure_${coords.length}`;
    const labelOverlay = new Overlay({
      element: measureElement,
      positioning: 'center-center',
      stopEvent: true
    });

    tempOverlayArray.push(labelOverlay);
    labelOverlay.setPosition(oo);
    measureElement.innerHTML = formatLength(/** @type {LineString} */(segment));
    map.addOverlay(labelOverlay);
  }

  function centerSketch() {
    if (sketch) {
      const geom = (sketch.getGeometry());
      if (geom instanceof Polygon) {
        const sketchCoord = geom.getCoordinates()[0];
        sketchCoord.splice(-2, 1, map.getView().getCenter());
        sketch.getGeometry().setCoordinates([sketchCoord]);
      } else if (geom instanceof LineString) {
        const sketchCoord = geom.getCoordinates();
        sketchCoord.splice(-1, 1, map.getView().getCenter());
        sketch.getGeometry().setCoordinates(sketchCoord);
      }
    }
  }

  // Display and move tooltips with pointer
  function pointerMoveHandler(evt) {
    const helpMsg = 'Klicka för att börja mäta';
    let tooltipCoord = evt.coordinate;

    if (sketch) {
      const geom = (sketch.getGeometry());
      let output = '';
      let coords;
      let area;
      let newNode;
      label = '';

      if (geom instanceof Polygon) {
        area = formatArea(/** @type {Polygon} */(geom));
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
        coords = geom.getCoordinates()[0];
        newNode = coords.length > prevSketchLength && coords.length !== 3;
        prevSketchLength = coords.length;
      } else if (geom instanceof LineString) {
        tooltipCoord = geom.getLastCoordinate();
        coords = geom.getCoordinates();
        newNode = coords.length > prevSketchLength;
        prevSketchLength = coords.length;
      }

      let totalLength = 0;
      if (!(geom instanceof Point)) {
        totalLength = formatLength(/** @type {LineString} */(geom));
      }
      if (showSegmentLengths && !(geom instanceof Point)) {
        let lengthLastSegment = 0; // totalLength;
        let lastSegment;
        if (coords.length >= 1) {
          if (geom instanceof Polygon && coords.length > 2) {
            if (evt.type !== 'drawend') {
              // If this is a polygon in the progress of being drawn OL creates a extra vertices back to start that we need to ignore
              lastSegment = new LineString([coords[coords.length - 2], coords[coords.length - 3]]);
              const polygonAsLineString = /** @type {LineString} */ (geom);
              const lineStringWithoutLastSegment = new LineString(polygonAsLineString.getCoordinates()[0].slice(0, -1));
              totalLength = formatLength(lineStringWithoutLastSegment);
            } else {
              // Finish the polygon and put a label on the last verticies as well
              lastSegment = new LineString([coords[coords.length - 1], coords[coords.length - 2]]);
              placeMeasurementLabel(lastSegment, coords);
            }
          } else { // Draw segment while drawing is in progress
            lastSegment = new LineString([coords[coords.length - 1], coords[coords.length - 2]]);
          }
          // Create a label for the last drawn vertices and place it in the middle of it.
          lengthLastSegment = formatLength(/** @type {LineString} */(lastSegment));
          if ((newNode && evt.type !== 'drawend') && coords.length > 2) {
            let secondToLastSegment;
            if (geom instanceof Polygon && coords.length > 3) {
              secondToLastSegment = new LineString([coords[coords.length - 3], coords[coords.length - 4]]);
            } else {
              secondToLastSegment = new LineString([coords[coords.length - 2], coords[coords.length - 3]]);
            }
            if (secondToLastSegment) {
              placeMeasurementLabel(secondToLastSegment, coords);
            }
          }
        }
        if (area) {
          output = `${area}<br/>`;
          label = `${area}\n`;
        }
        output += `${lengthLastSegment} (Totalt: ${totalLength})`;
        label += totalLength;
      } else if (area) {
        output = area;
        label = area;
      } else {
        output = totalLength;
        label += totalLength;
      }

      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord);
    }

    if (evt.type === 'pointermove') {
      helpTooltipElement.innerHTML = helpMsg;
      helpTooltip.setPosition(evt.coordinate);
    }
  }

  function resetSketch() {
    // unset sketch
    sketch = null;
    // unset tooltip so that a new one can be created
    measureTooltipElement = null;
    helpTooltipElement = null;
    viewer.removeOverlays(tempOverlayArray);
  }

  function renderMarker() {
    markerIcon = Icon({
      icon: '#o_centerposition_24px',
      cls: 'o-position-marker'
    });

    markerElement = dom.html(markerIcon.render());
    document.getElementById(`${viewer.getId()}`).appendChild(markerElement);
  }

  function disableInteraction() {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }
    document.getElementById(measureButton.getId()).classList.remove('active');
    if (lengthTool) {
      document.getElementById(lengthToolButton.getId()).classList.add('hidden');
    }
    if (areaTool) {
      document.getElementById(areaToolButton.getId()).classList.add('hidden');
    }
    if (lengthTool || areaTool) {
      document.getElementById(undoButton.getId()).classList.add('hidden');
    }
    if (elevationTool) {
      document.getElementById(elevationToolButton.getId()).classList.add('hidden');
    }
    document.getElementById(measureButton.getId()).classList.add('tooltip');
    document.getElementById(clearButton.getId()).classList.add('hidden');
    if (touchMode && isActive) {
      document.getElementById(addNodeButton.getId()).classList.add('hidden');
      const markerIconElement = document.getElementById(`${markerIcon.getId()}`);
      markerIconElement.parentNode.removeChild(markerIconElement);
    }
    setActive(false);
    map.un('pointermove', pointerMoveHandler);
    map.removeInteraction(measure);
    if (typeof helpTooltipElement !== 'undefined' && helpTooltipElement !== null) {
      if (helpTooltipElement.parentNode !== null) {
        helpTooltipElement.outerHTML = '';
      }
    }
    if (typeof measureTooltipElement !== 'undefined' && measureTooltipElement !== null) {
      if (measureTooltipElement.parentNode !== null) {
        measureTooltipElement.outerHTML = '';
      }
    }
    setActive(false);
    resetSketch();
  }

  function enableInteraction() {
    document.getElementById(measureButton.getId()).classList.add('active');
    if (lengthTool) {
      document.getElementById(lengthToolButton.getId()).classList.remove('hidden');
    }
    if (areaTool) {
      document.getElementById(areaToolButton.getId()).classList.remove('hidden');
    }
    if (elevationTool) {
      document.getElementById(elevationToolButton.getId()).classList.remove('hidden');
    }
    document.getElementById(measureButton.getId()).classList.remove('tooltip');
    document.getElementById(clearButton.getId()).classList.remove('hidden');
    document.getElementById(defaultButton.getId()).click();
    if (touchMode) {
      document.getElementById(addNodeButton.getId()).classList.remove('hidden');
      renderMarker();
    }
    setActive(true);
  }

  function addInteraction() {
    measure = new DrawInteraction({
      source,
      type,
      style: style.createStyleRule(measureStyleOptions.interaction),
      condition(evt) {
        return evt.originalEvent.pointerType !== 'touch';
      }
    });

    map.addInteraction(measure);
    createMeasureTooltip();
    createHelpTooltip();
    if (!touchMode) {
      map.on('pointermove', pointerMoveHandler);
    }

    measure.on('drawstart', (evt) => {
      measure.getOverlay().getSource().getFeatures()[1].setStyle([]);
      sketch = evt.feature;
      sketch.on('change', pointerMoveHandler);
      if (touchMode) {
        map.getView().on('change:center', centerSketch);
      } else {
        pointerMoveHandler(evt);
      }
      document.getElementsByClassName('o-tooltip-measure')[1].remove();

      if (type === 'LineString' || type === 'Polygon') {
        document.getElementById(undoButton.getId()).classList.remove('hidden');
      }
    }, this);

    measure.on('drawend', (evt) => {
      const feature = evt.feature;
      sketch.un('change', pointerMoveHandler);
      if (touchMode) {
        map.getView().un('change:center', centerSketch);
      }
      pointerMoveHandler(evt);
      feature.setStyle(createStyle(feature));
      feature.getStyle()[0].getText().setText(label);
      document.getElementsByClassName('o-tooltip-measure')[0].remove();
      overlayArray.push(...tempOverlayArray);
      tempOverlayArray = [];
      resetSketch();
      createMeasureTooltip();
      createHelpTooltip();

      document.getElementById(undoButton.getId()).classList.add('hidden');
      if (feature.getGeometry().getType() === 'Point') {
        getElevation(evt);
      }
    }, this);
  }

  function abort() {
    measure.abortDrawing();
    resetSketch();
    createMeasureTooltip();
    createHelpTooltip();
  }

  function toggleMeasure() {
    const detail = {
      name: 'measure',
      active: !isActive
    };
    viewer.dispatch('toggleClickInteraction', detail);
  }

  function toggleType(button) {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }
    document.getElementById(button.getId()).classList.add('active');
    document.getElementById(undoButton.getId()).classList.add('hidden');
    activeButton = button;
    map.removeInteraction(measure);
    resetSketch();
    addInteraction();
  }

  function addNode() {
    const pixel = map.getPixelFromCoordinate(map.getView().getCenter());
    const eventObject = {
      clientX: pixel[0],
      clientY: pixel[1],
      bubbles: true
    };
    const down = new PointerEvent('pointerdown', eventObject);
    const up = new PointerEvent('pointerup', eventObject);
    map.getViewport().dispatchEvent(down);
    map.getViewport().dispatchEvent(up);
  }

  function undoLastPoint() {
    if ((type === 'LineString' && sketch.getGeometry().getCoordinates().length === 2) || (type === 'Polygon' && sketch.getGeometry().getCoordinates()[0].length <= 3)) {
      document.getElementsByClassName('o-tooltip-measure')[0].remove();
      document.getElementById(undoButton.getId()).classList.add('hidden');
      abort();
    } else {
      if (showSegmentLengths) document.getElementsByClassName('o-tooltip-measure')[1].remove();
      measure.removeLastPoint();
      if (touchMode) {
        centerSketch();
      }
    }
  }

  return Component({
    name: 'measure',
    onAdd(evt) {
      viewer = evt.target;
      touchMode = 'ontouchstart' in document.documentElement;
      if (touchMode) {
        addNodeButton = Button({
          cls: 'o-measure-undo padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
          click() {
            addNode();
          },
          icon: '#ic_add_24px',
          tooltipText: 'Lägg till punkt',
          tooltipPlacement: 'east'
        });
        buttons.push(addNodeButton);
      }
      target = `${viewer.getMain().getMapTools().getId()}`;

      map = viewer.getMap();
      source = new VectorSource();
      measureStyleOptions = styleTypes.getStyle('measure');

      // Drawn features
      vector = new VectorLayer({
        group: 'none',
        source,
        name: 'measure',
        visible: true,
        zIndex: 6
      });

      map.addLayer(vector);
      this.addComponents(buttons);
      this.render();
      viewer.on('toggleClickInteraction', (detail) => {
        if (detail.name === 'measure' && detail.active) {
          enableInteraction();
        } else {
          disableInteraction();
        }
      });
    },
    onInit() {
      lengthTool = measureTools.indexOf('length') >= 0;
      areaTool = measureTools.indexOf('area') >= 0;
      elevationTool = measureTools.indexOf('elevation') >= 0;
      defaultTool = lengthTool ? defaultMeasureTool : 'area';
      if (lengthTool || areaTool || elevationTool) {
        measureElement = El({
          tagName: 'div',
          cls: 'flex column'
        });

        measureButton = Button({
          cls: 'o-measure padding-small margin-bottom-smaller icon-smaller round light box-shadow',
          click() {
            toggleMeasure();
          },
          icon: '#ic_straighten_24px',
          tooltipText: 'Mäta',
          tooltipPlacement: 'east'
        });
        buttons.push(measureButton);

        if (lengthTool) {
          lengthToolButton = Button({
            cls: 'o-measure-length padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'LineString';
              toggleType(this);
            },
            icon: '#ic_timeline_24px',
            tooltipText: 'Längd',
            tooltipPlacement: 'east'
          });
          buttons.push(lengthToolButton);
          defaultButton = lengthToolButton;
        }

        if (areaTool) {
          areaToolButton = Button({
            cls: 'o-measure-area padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'Polygon';
              toggleType(this);
            },
            icon: '#o_polygon_24px',
            tooltipText: 'Yta',
            tooltipPlacement: 'east'
          });
          buttons.push(areaToolButton);
          defaultButton = defaultTool === 'length' ? lengthToolButton : areaToolButton;
        }

        if (elevationTool) {
          elevationToolButton = Button({
            cls: 'o-measure-elevation padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'Point';
              toggleType(this);
            },
            icon: '#ic_height_24px',
            tooltipText: 'Höjd',
            tooltipPlacement: 'east'
          });
          buttons.push(elevationToolButton);
          defaultButton = defaultTool === 'length' ? lengthToolButton : elevationToolButton;
        }

        if (lengthTool || areaTool) {
          undoButton = Button({
            cls: 'o-measure-undo padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              undoLastPoint();
            },
            icon: '#ic_undo_24px',
            tooltipText: 'Ångra',
            tooltipPlacement: 'east'
          });
          buttons.push(undoButton);
          clearButton = Button({
            cls: 'o-measure-clear padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              abort();
              vector.getSource().clear();
              viewer.removeOverlays(overlayArray);
            },
            icon: '#ic_delete_24px',
            tooltipText: 'Rensa',
            tooltipPlacement: 'east'
          });
          buttons.push(clearButton);
        }
      }
    },
    render() {
      let htmlString = `${measureElement.render()}`;
      let el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      htmlString = measureButton.render();
      el = dom.html(htmlString);
      document.getElementById(measureElement.getId()).appendChild(el);
      if (lengthTool) {
        htmlString = lengthToolButton.render();
        buttons.push(lengthToolButton);
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (areaTool) {
        htmlString = areaToolButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (elevationTool) {
        htmlString = elevationToolButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (touchMode) {
        htmlString = addNodeButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (lengthTool || areaTool) {
        htmlString = undoButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
        htmlString = clearButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      this.dispatch('render');
    }
  });
};

export default Measure;
