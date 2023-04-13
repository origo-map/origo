import Feature from 'ol/Feature';
import { Polygon, LineString, Point, Circle } from 'ol/geom';
import { Draw, Modify, Snap } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import Projection from 'ol/proj/Projection';
import { Vector as VectorSource } from 'ol/source';
import { Collection } from 'ol';
import LayerGroup from 'ol/layer/Group';
import { unByKey } from 'ol/Observable';
import { Component, Icon, Element as El, Button, dom, Modal } from '../ui';
import * as drawStyles from '../style/drawstyles';
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
  let map;
  let activeButton;
  let defaultButton;
  let measure;
  let type;
  let sketch;
  let markerIcon;
  let markerElement;
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
  let tipPoint;
  let projection;

  const tipStyle = drawStyles.tipStyle;
  const modifyStyle = drawStyles.modifyStyle;
  const measureStyle = drawStyles.measureStyle;
  const source = new VectorSource();
  const modify = new Modify({ source, style: modifyStyle });

  function styleFunction(feature, segments, drawType, tip) {
    const styleScale = feature.get('styleScale') || 1;
    const labelStyle = drawStyles.getLabelStyle(styleScale);
    let styles = [measureStyle(styleScale)];
    const geometry = feature.getGeometry();
    const geomType = geometry.getType();
    let point; let line; let label;
    if (!drawType || drawType === geomType) {
      if (geomType === 'Polygon') {
        point = geometry.getInteriorPoint();
        label = drawStyles.formatArea(geometry, useHectare, projection);
        line = new LineString(geometry.getCoordinates()[0]);
      } else if (geomType === 'LineString') {
        point = new Point(geometry.getLastCoordinate());
        label = drawStyles.formatLength(geometry, projection);
        line = geometry;
      }
    }
    if (segments && line) {
      const segmentLabelStyle = drawStyles.getSegmentLabelStyle(line, projection);
      styles = styles.concat(segmentLabelStyle);
    }
    if (label) {
      labelStyle.setGeometry(point);
      labelStyle.getText().setText(label);
      styles.push(labelStyle);
    }
    if (
      tip
    && geomType === 'Point'
    && !modify.getOverlay().getSource().getFeatures().length
    ) {
      tipPoint = geometry;
      tipStyle.getText().setText(tip);
      styles.push(tipStyle);
    }
    return styles;
  }

  const vector = new VectorLayer({
    group: 'none',
    name: 'measure',
    title: 'Measure',
    source,
    zIndex: 8,
    styleName: 'origoStylefunction',
    style(feature) {
      return styleFunction(feature, showSegmentLabels);
    }
  });

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

  function setActive(state) {
    isActive = state;
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
    const styleScale = feature.get('styleScale') || 1;
    const featureStyle = drawStyles.getLabelStyle(styleScale);
    feature.setStyle(featureStyle);
    feature.getStyle().getText().setText('Hämtar höjd...');

    fetch(url).then(response => response.json({
      cache: false
    })).then((data) => {
      const elevation = getElevationAttribute(elevationAttribute, data);
      feature.getStyle().getText().setText(`${elevation.toFixed(1)} m`);
      source.changed();
    });
  }

  function addBuffer(feature, radius = 0) {
    if (radius > 0) {
      bufferSize = radius;
    }
    const pointCenter = feature.getGeometry().getCoordinates();
    const bufferCircle = new Circle(pointCenter, bufferSize);
    feature.setGeometry(bufferCircle);
    feature.setStyle((feat) => drawStyles.bufferStyleFunction(feat));
  }

  function clearSnapInteractions() {
    snapCollection.forEach((s) => map.removeInteraction(s));
    snapCollection.clear();
    snapEventListenerKeys.forEach((k) => unByKey(k));
    snapEventListenerKeys.clear();
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
    modal.on('closed', () => {
      source.removeFeature(feature);
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
    const drawType = type || 'LineString';
    const activeTip = '';
    const idleTip = 'Klicka för att börja mäta';
    let tip = idleTip;
    measure = new Draw({
      source,
      type: drawType,
      style(feature) {
        return styleFunction(feature, showSegmentLabels, drawType, tip);
      }
    });
    measure.on('drawstart', (e) => {
      sketch = e.feature;
      modify.setActive(false);
      tip = activeTip;
      if (touchMode) {
        map.getView().on('change:center', centerSketch);
      }
      if (drawType === 'LineString' || drawType === 'Polygon') {
        document.getElementById(undoButton.getId()).classList.remove('hidden');
      }
    });
    measure.on('drawend', (evt) => {
      const feature = evt.feature;
      modifyStyle.setGeometry(tipPoint);
      modify.setActive(true);
      map.once('pointermove', () => {
        modifyStyle.setGeometry();
      });

      if (touchMode) {
        map.getView().un('change:center', centerSketch);
      }
      tip = idleTip;
      document.getElementById(undoButton.getId()).classList.add('hidden');
      if (activeButton.data.tool === 'buffer') {
        feature.set('tool', 'buffer');
        createRadiusModal(feature);
      } else if (activeButton.data.tool === 'elevation') {
        feature.set('tool', 'elevation');
        getElevation(feature);
      }
    });

    modify.on('modifyend', (evt) => {
      evt.features.getArray().forEach(feat => {
        if (feat.get('tool') === 'elevation') {
          getElevation(feat);
        }
      });
    });

    modify.setActive(true);
    map.addInteraction(measure);
    map.addInteraction(modify);
    if (snap) {
      addSnapInteractions();
    }
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
    map.removeInteraction(measure);
    map.removeInteraction(modify);
    if (snap) {
      clearSnapInteractions();
    }
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
    map.removeInteraction(modify);
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
    measure.removeLastPoint();
    if (touchMode) {
      centerSketch();
    }
    // TODO: Remove undo button when feature has no geometry
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
          case 'Circle':
            if (feature.get('tool') === 'buffer') {
              const radius = feature.getGeometry().getRadius();
              const center = feature.getGeometry().getCenter();
              bufferRadius.push(radius);
              buffer.push(center);
            } else if (feature.get('tool') === 'elevation') {
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
        isActive = false;
        toggleMeasure();
      }
      // Restore areas
      if (params.controls.measure.measureState && params.controls.measure.measureState.area && params.controls.measure.measureState.area.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.area)) {
          params.controls.measure.measureState.area.forEach((item) => {
            source.addFeature(new Feature({
              geometry: new Polygon(item)
            }));
          });
        }
      }
      // Restore length
      if (params.controls.measure.measureState && params.controls.measure.measureState.length && params.controls.measure.measureState.length.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.length)) {
          params.controls.measure.measureState.length.forEach((item) => {
            source.addFeature(new Feature({
              geometry: new LineString(item)
            }));
          });
        }
      }
      // Restore buffers
      if (params.controls.measure.measureState && params.controls.measure.measureState.buffer && params.controls.measure.measureState.buffer.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.buffer)) {
          for (let i = 0; i < params.controls.measure.measureState.buffer.length; i += 1) {
            const radius = params.controls.measure.measureState.bufferRadius[i];
            const point = params.controls.measure.measureState.buffer[i];
            const feature = new Feature(new Point(point));
            feature.set('tool', 'buffer');
            source.addFeature(feature);
            addBuffer(feature, radius);
          }
        }
      }
      // Restore elevation measurements
      if (params.controls.measure.measureState && params.controls.measure.measureState.elevation && params.controls.measure.measureState.elevation.length > 0) {
        if (Array.isArray(params.controls.measure.measureState.elevation)) {
          for (let i = 0; i < params.controls.measure.measureState.elevation.length; i += 1) {
            const feature = new Feature(new Point(params.controls.measure.measureState.elevation[i]));
            feature.set('tool', 'elevation');
            source.addFeature(feature);
            getElevation(feature);
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
      projection = viewer.getProjection().getCode();
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
            vector.changed();
            measure.getOverlay().changed();
          },
          icon: '#ic_linear_scale_24px',
          tooltipText: 'Visa delsträckor',
          tooltipPlacement: 'east'
        });
        buttons.push(showSegmentLabelButton);
      }
      target = `${viewer.getMain().getMapTools().getId()}`;
      map = viewer.getMap();
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
      restoreState(viewer.getUrlParams());
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
            data: { tool: 'length' },
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
            data: { tool: 'area' },
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
            data: { tool: 'elevation' },
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
            data: { tool: 'buffer' },
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
              measure.abortDrawing();
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
      document.getElementById(measureElement.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(measureElement.getId()).classList.remove('hidden');
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
