import { getArea, getLength } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Circle from 'ol/geom/Circle';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Projection from 'ol/proj/Projection';
import * as Extent from 'ol/extent';
import { Snap } from 'ol/interaction';
import { Collection } from 'ol';
import LayerGroup from 'ol/layer/Group';
import { unByKey } from 'ol/Observable';
import { Component, Icon, Element as El, Button, dom, Modal } from '../ui';
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
  showSegmentLabelButtonActive = true,
  useHectare = true,
  snap = false,
  snapIsActive = true,
  snapLayers,
  snapRadius = 15
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
  let bufferTool;
  let toggleSnapButton;
  let defaultTool;
  let isActive = false;
  let tempOverlayArray = [];
  const overlayArray = [];

  let viewer;
  let measureElement;
  let measureButton;
  let lengthToolButton;
  let areaToolButton;
  let bufferToolButton;
  let bufferSize;
  let elevationToolButton;
  let addNodeButton;
  let showSegmentLabelButton;
  let showSegmentLabelButtonState = showSegmentLabelButtonActive;
  let showSegmentLabels;
  let undoButton;
  let clearButton;
  const buttons = [];
  let target;
  let touchMode;
  let snapCollection;
  let snapEventListenerKeys;
  let snapActive = snapIsActive;

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

  function getElevation(feature) {
    let coordinates;
    let elevationProjection;
    const options = {
      start: '{',
      end: '}'
    };
    if (feature.getStyle() === null) {
      feature.setStyle(style.createStyleRule(measureStyleOptions.interaction));
      source.addFeature(feature);
    }

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

  function addBuffer(feature, radius = 0) {
    if (feature.getStyle() === null) {
      feature.setStyle(style.createStyleRule(measureStyleOptions.interaction));
      source.addFeature(feature);
    }
    // Mark the central point of the circle
    feature.getStyle()[0].getText().setText('o');
    if (radius !== 0) {
      bufferSize = radius;
    }
    function addBufferToFeature() {
      const pointCenter = feature.getGeometry().getCoordinates();
      // Create a buffer around the point which was clicked on.
      const bufferCircle = new Circle(pointCenter, bufferSize);
      const bufferedFeature = new Feature(bufferCircle);
      // Create a new point at top of the circle to add a text with radius information
      const radiusText = new Point([pointCenter[0], bufferCircle.getExtent()[3]]);
      const radiusFeature = new Feature(radiusText);
      const featStyle = createStyle(feature);
      radiusFeature.setStyle(featStyle);
      // Remove stroke and fill only to leave the text styling from default measure style
      radiusFeature.getStyle()[0].setStroke(null);
      radiusFeature.getStyle()[0].setFill(null);
      // Offset the text so it dont't cover the circle
      radiusFeature.getStyle()[0].getText().setOffsetY(-10);
      radiusFeature.getStyle()[0].getText().setPlacement('line');
      radiusFeature.getStyle()[0].getText().setText(`${bufferSize} m`);
      vector.getSource().addFeature(bufferedFeature);
      vector.getSource().addFeature(radiusFeature);
    }

    addBufferToFeature();
  }

  function clearSnapInteractions() {
    snapCollection.forEach((s) => map.removeInteraction(s));
    snapCollection.clear();
    snapEventListenerKeys.forEach((k) => unByKey(k));
    snapEventListenerKeys.clear();
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
    if (coords.length < 6 && showSegmentLengths) {
      switch (type) {
        case 'LineString':
          if (coords.length === 3) {
            document.getElementById('measure_3').style.display = 'none';
            if (showSegmentLabels) {
              document.getElementById('measure_3').style.display = 'block';
            }
          }
          break;
        case 'Polygon':
          if (coords.length === 4) {
            document.getElementById('measure_4').style.display = 'none';
            if (showSegmentLabels) {
              document.getElementById('measure_4').style.display = 'block';
            }
          }
          break;
        case 'Point':
          if (showSegmentLabels) {
            document.getElementById('measure_2').style.display = 'block';
          } else {
            document.getElementById('measure_2').style.display = 'none';
          }
          break;
        default:
          break;
      }
    }
    if (!showSegmentLabels) {
      measureElement.style.display = 'none';
    }
  }

  // Takes a Polygon as input and adds area measurements on it
  function addArea(area) {
    const tempFeature = new Feature(area);
    const areaLabel = formatArea(area);
    tempFeature.setStyle(style.createStyleRule(measureStyleOptions.polygon));
    source.addFeature(tempFeature);
    const flatCoords = area.getCoordinates();
    for (let i = 0; i < flatCoords[0].length; i += 1) {
      if (i < flatCoords[0].length - 1) {
        const tempSegment = new LineString([flatCoords[0][i], flatCoords[0][i + 1]]);
        placeMeasurementLabel(tempSegment, flatCoords[0][i]);
      }
    }
    const totalLength = formatLength(new LineString(flatCoords[0]));
    tempFeature.getStyle()[0].getText().setText(`${areaLabel}\n${totalLength}`);
  }

  // Takes a LineString as input and adds length measurements on it
  function addLength(line) {
    const tempFeature = new Feature(line);
    const totalLength = formatLength(line);
    tempFeature.setStyle(style.createStyleRule(measureStyleOptions.linestring));
    source.addFeature(tempFeature);
    const flatCoords = line.getCoordinates();
    for (let i = 0; i < flatCoords.length; i += 1) {
      if (i < flatCoords.length - 1) {
        const tempSegment = new LineString([flatCoords[i], flatCoords[i + 1]]);
        placeMeasurementLabel(tempSegment, flatCoords[i]);
      }
    }
    tempFeature.getStyle()[0].getText().setText(totalLength);
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

  function createRadiusModal(feature) {
    const title = 'Ange buffert i meter (ex 1000):';
    const content = `<div>
                      <input type="number" id="bufferradius">
                      <button id="bufferradiusBtn">OK</button>
                    </div>`;
    const modal = Modal({
      title,
      content,
      target: viewer.getId(),
      style: 'width: auto;'
    });
    const bufferradiusEl = document.getElementById('bufferradius');
    bufferradiusEl.focus();
    const bufferradiusBtn = document.getElementById('bufferradiusBtn');
    bufferradiusBtn.addEventListener('click', (e) => {
      const radiusVal = bufferradiusEl.value;
      const radius = parseFloat(radiusVal);
      if ((!radius && radius !== 0)
        || (radius <= 0)) {
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      modal.closeModal();
      if (Number.isNaN(radius)) {
        feature.getStyle()[0].getText().setText('');
      } else {
        addBuffer(feature, radius);
      }
    });
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
    if (bufferTool) {
      document.getElementById(bufferToolButton.getId()).classList.add('hidden');
    }
    if (snap) {
      document.getElementById(toggleSnapButton.getId()).classList.add('hidden');
    }
    document.getElementById(measureButton.getId()).classList.add('tooltip');
    document.getElementById(clearButton.getId()).classList.add('hidden');
    if (showSegmentLengths) {
      document.getElementById(showSegmentLabelButton.getId()).classList.add('hidden');
    }
    if (touchMode && isActive) {
      document.getElementById(addNodeButton.getId()).classList.add('hidden');
      const markerIconElement = document.getElementById(`${markerIcon.getId()}`);
      markerIconElement.parentNode.removeChild(markerIconElement);
    }
    setActive(false);
    map.un('pointermove', pointerMoveHandler);
    map.removeInteraction(measure);
    if (snap) {
      clearSnapInteractions();
    }
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
    if (bufferTool) {
      document.getElementById(bufferToolButton.getId()).classList.remove('hidden');
    }
    if (snap) {
      document.getElementById(toggleSnapButton.getId()).classList.remove('hidden');
    }
    document.getElementById(measureButton.getId()).classList.remove('tooltip');
    document.getElementById(clearButton.getId()).classList.remove('hidden');
    document.getElementById(defaultButton.getId()).click();
    if (touchMode) {
      document.getElementById(addNodeButton.getId()).classList.remove('hidden');
      renderMarker();
    }
    if (showSegmentLengths) {
      document.getElementById(showSegmentLabelButton.getId()).classList.remove('hidden');
      if (showSegmentLabelButtonState) {
        document.getElementById(showSegmentLabelButton.getId()).classList.add('active');
      }
    }
    setActive(true);
  }

  function createSnapInteractionForVectorLayer(layer) {
    const state = layer.getLayerState();
    // Using ol_uid because the Origo layer id is unreliable
    const layerId = layer.ol_uid;
    let sn;
    if (state.visible) {
      sn = new Snap({
        source: layer.getSource(),
        pixelTolerance: snapRadius
      });
      sn.setActive(!!state.visible && snapActive);
      sn.set('layerId', layerId);
    }
    const eventKey = layer.on('change:visible', (visibilityChangeEvent) => {
      if (!visibilityChangeEvent.oldValue) {
        const s = new Snap({
          source: layer.getSource(),
          pixelTolerance: snapRadius
        });
        s.setActive(!visibilityChangeEvent.oldValue && snapActive);
        s.set('layerId', layerId);
        map.addInteraction(s);
        snapCollection.push(s);
      } else {
        const int = map
          .getInteractions()
          .getArray()
          .find((i) => (i instanceof Snap ? i.get('layerId') === layerId : false));
        map.removeInteraction(int);
        snapCollection.remove(int);
      }
    });
    snapEventListenerKeys.push(eventKey);
    return sn;
  }

  function createSnapInteractionsRecursive(layer) {
    const snaps = [];
    if (layer instanceof VectorLayer) {
      const sn = createSnapInteractionForVectorLayer(layer);
      if (sn) snaps.push(sn);
    } else if (layer instanceof LayerGroup) {
      layer.getLayers().forEach((l) => {
        snaps.concat(createSnapInteractionsRecursive(l));
      });
    }
    return snaps;
  }

  function addSnapInteractions() {
    if (snapLayers === undefined) {
      const allLayers = viewer.getLayers();
      allLayers.forEach((l) => {
        snapCollection.extend(createSnapInteractionsRecursive(l));
      });
    } else {
      snapLayers.forEach((sl) => {
        const l = viewer.getLayer(sl);
        if (l instanceof VectorLayer) {
          const sn = createSnapInteractionForVectorLayer(l);
          if (sn) snapCollection.push(sn);
        }
      });
      const sn = createSnapInteractionForVectorLayer(vector);
      if (sn) snapCollection.push(sn);
    }
    snapCollection.forEach((s) => {
      map.addInteraction(s);
    });
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
    if (snap) {
      addSnapInteractions();
    }
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
        if (bufferTool) {
          if (document.getElementById(bufferToolButton.getId()).classList.contains('active')) {
            feature.getStyle()[0].getText().setText('');
            createRadiusModal(evt.feature);
          } else {
            feature.getStyle()[0].getText().setText(label);
            getElevation(evt.feature);
          }
        } else {
          feature.getStyle()[0].getText().setText(label);
          getElevation(evt.feature);
        }
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

  function toggleSegmentLabels() {
    const elements = document.getElementsByClassName('o-tooltip-measure');
    for (let i = 0; i < elements.length; i += 1) {
      const e = elements[i];

      if (e.id.startsWith('measure_')) {
        if (showSegmentLabels) {
          e.style.display = 'none';
        } else {
          e.style.display = 'block';
        }
      }
    }
    if (showSegmentLabels) {
      showSegmentLabels = false;
      document.getElementById(showSegmentLabelButton.getId()).classList.remove('active');
    } else {
      document.getElementById(showSegmentLabelButton.getId()).classList.add('active');
      showSegmentLabels = true;
    }
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

  function toggleSnap() {
    snapCollection.forEach(s => s.setActive(!snapActive));
    snapActive = !snapActive;
    if (snapActive) {
      document.getElementById(toggleSnapButton.getId()).classList.add('active');
    } else {
      document.getElementById(toggleSnapButton.getId()).classList.remove('active');
    }
  }

  function getState() {
    if (vector) {
      const sourceMeasure = vector.getSource();
      const features = sourceMeasure.getFeatures();
      const length = [];
      const area = [];
      const elevation = [];
      const buffer = [];
      const bufferRadius = [];
      features.forEach((feature) => {
        switch (feature.getGeometry().getType()) {
          case 'LineString':
            length.push(feature.getGeometry().getCoordinates());
            break;
          case 'Polygon':
            area.push(feature.getGeometry().getCoordinates());
            break;
          case 'Point':
            if (feature.getStyle()[0].getText().getText() === 'o') {
              buffer.push(feature.getGeometry().getCoordinates());
            } else if (feature.getStyle()[0].getText().getPlacement() === 'line') {
              bufferRadius.push(feature.getStyle()[0].getText().getText());
            } else {
              elevation.push(feature.getGeometry().getCoordinates());
            }
            break;
          default:
            break;
        }
      });
      const returnValue = {};
      if (length.length > 0) {
        returnValue.length = length;
      }
      if (area.length > 0) {
        returnValue.area = area;
      }
      if (elevation.length > 0) {
        returnValue.elevation = elevation;
      }
      if (buffer.length > 0) {
        returnValue.buffer = buffer;
      }
      if (bufferRadius.length > 0) {
        returnValue.bufferRadius = bufferRadius;
      }
      returnValue.showSegmentLabels = showSegmentLabels;
      returnValue.isActive = isActive;
      if (Object.keys(returnValue).length !== 0) {
        return returnValue;
      }
    }

    return undefined;
  }

  function restoreState(params) {
    if (params && params.controls && params.controls.measure) {
      if (params.controls.measure.measureState.isActive) {
        enableInteraction();
      }
      // Restore areas
      if (params.controls.measure.measureState && params.controls.measure.measureState.area && params.controls.measure.measureState.area.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.area)) {
          params.controls.measure.measureState.area.forEach((item) => {
            addArea(new Polygon(item));
          });
        }
      }
      // Restore length
      if (params.controls.measure.measureState && params.controls.measure.measureState.length && params.controls.measure.measureState.length.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.length)) {
          params.controls.measure.measureState.length.forEach((item) => {
            addLength(new LineString(item));
          });
        }
      }
      // Restore buffers
      if (params.controls.measure.measureState && params.controls.measure.measureState.buffer && params.controls.measure.measureState.buffer.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.buffer)) {
          for (let i = 0; i < params.controls.measure.measureState.buffer.length; i += 1) {
            let radius = params.controls.measure.measureState.bufferRadius[i];
            radius = radius.replace(' m', '');
            addBuffer(new Feature(new Point(params.controls.measure.measureState.buffer[i]), Number(radius)), Number(radius));
          }
        }
      }
      // Restore elevation measurements
      if (params.controls.measure.measureState && params.controls.measure.measureState.elevation && params.controls.measure.measureState.elevation.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.elevation)) {
          for (let i = 0; i < params.controls.measure.measureState.elevation.length; i += 1) {
            getElevation(new Feature(new Point(params.controls.measure.measureState.elevation[i])));
          }
        }
      }
      // Restore showSegmentLabels state
      if (params.controls.measure.measureState) {
        if (showSegmentLabels !== params.controls.measure.measureState.showSegmentLabels) {
          toggleSegmentLabels();
        }
        if (!params.controls.measure.measureState.showSegmentLabels && typeof showSegmentLabelButton !== 'undefined') {
          document.getElementById(showSegmentLabelButton.getId()).classList.remove('active');
          showSegmentLabelButtonState = false;
        }
      }
      overlayArray.push(...tempOverlayArray);
      tempOverlayArray = [];
    }
  }

  return Component({
    name: 'measure',
    getState() {
      return getState();
    },
    restoreState() {
      restoreState();
    },
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
      if (showSegmentLengths) {
        if (showSegmentLabelButtonState) {
          showSegmentLabels = true;
        } else {
          showSegmentLabels = false;
        }
        showSegmentLabelButton = Button({
          cls: 'o-measure-segment-label padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
          click() {
            toggleSegmentLabels();
          },
          icon: '#ic_linear_scale_24px',
          tooltipText: 'Visa delsträckor',
          tooltipPlacement: 'east'
        });
        buttons.push(showSegmentLabelButton);
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
      restoreState(viewer.getUrlParams());
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
      bufferTool = measureTools.indexOf('buffer') >= 0;
      defaultTool = lengthTool ? defaultMeasureTool : 'area';
      snapCollection = new Collection([], {
        unique: true
      });
      snapEventListenerKeys = new Collection([], { unique: true });
      if (lengthTool || areaTool || elevationTool || bufferTool) {
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
        }

        if (bufferTool) {
          bufferToolButton = Button({
            cls: 'o-measure-buffer padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'Point';
              toggleType(this);
            },
            icon: '#ic_adjust_24px',
            tooltipText: 'Buffer',
            tooltipPlacement: 'east'
          });
          buttons.push(bufferToolButton);
        }
        switch (defaultTool) {
          case 'area':
            defaultButton = areaToolButton;
            break;
          case 'elevation':
            defaultButton = elevationToolButton;
            break;
          case 'buffer':
            defaultButton = bufferToolButton;
            break;
          default:
            defaultButton = lengthToolButton;
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

        if (snap) {
          toggleSnapButton = Button({
            cls: `o-measure-snap padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden activ ${
              snapActive && 'active'
            }`,
            click() {
              toggleSnap();
            },
            icon: '#fa-magnet',
            tooltipText: 'Snappning',
            tooltipPlacement: 'east'
          });
          buttons.push(toggleSnapButton);
        }
      }
    },
    hide() {
      document.getElementById(measureElement.getId()).classList.add("hidden");
    },
    unhide() {
      document.getElementById(measureElement.getId()).classList.remove("hidden");
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
      if (showSegmentLengths) {
        htmlString = showSegmentLabelButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (bufferTool) {
        htmlString = bufferToolButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (toggleSnapButton) {
        htmlString = toggleSnapButton.render();
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
