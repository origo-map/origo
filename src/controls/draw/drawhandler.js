import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import GeoJSONFormat from 'ol/format/GeoJSON';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Style from 'ol/style/Style';
import { MultiPoint, Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import dispatcher from './drawdispatcher';
import defaultDrawStyle from './drawstyle';
import shapes from '../editor/shapes';
import { restoreStylewindow, updateStylewindow, getStylewindowStyle } from './stylewindow';
import origoStyle from '../../style';

let map;
let drawSource;
let drawLayer;
let draw;
let activeTool;
let select;
let modify;
let annotationField;

const selectionStyle = new Style({
  image: new Circle({
    radius: 6,
    fill: new Fill({
      color: [200, 100, 100, 0.8]
    })
  }),
  geometry(feature) {
    let coords;
    let pointGeometry;
    const type = feature.getGeometry().getType();
    if (type === 'Polygon') {
      coords = feature.getGeometry().getCoordinates()[0];
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'LineString') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'Point') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new Point(coords);
    }
    return pointGeometry;
  }
});

function disableDoubleClickZoom(evt) {
  const featureType = evt.feature.getGeometry().getType();
  const interactionsToBeRemoved = [];

  if (featureType === 'Point') {
    return;
  }

  map.getInteractions().forEach((interaction) => {
    if (interaction instanceof DoubleClickZoom) {
      interactionsToBeRemoved.push(interaction);
    }
  });
  if (interactionsToBeRemoved.length > 0) {
    map.removeInteraction(interactionsToBeRemoved[0]);
  }
}

function onDrawStart(evt) {
  if (evt.feature.getGeometry().getType() !== 'Point') {
    disableDoubleClickZoom(evt);
  }
}

function setActive(drawType) {
  switch (drawType) {
    case 'draw':
      select.getFeatures().clear();
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      activeTool = undefined;
      map.removeInteraction(draw);
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function onTextEnd(feature, textVal) {
  // Remove the feature if no text is set
  if (textVal === '') {
    drawLayer.getSource().removeFeature(feature);
  } else {
    feature.set(annotationField, textVal);
  }
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('Text', false);
}

function addDoubleClickZoomInteraction() {
  const allDoubleClickZoomInteractions = [];
  map.getInteractions().forEach((interaction) => {
    if (interaction instanceof DoubleClickZoom) {
      allDoubleClickZoomInteractions.push(interaction);
    }
  });
  if (allDoubleClickZoomInteractions.length < 1) {
    map.addInteraction(new DoubleClickZoom());
  }
}

function enableDoubleClickZoom() {
  setTimeout(() => {
    addDoubleClickZoomInteraction();
  }, 100);
}

function onDrawEnd(evt) {
  if (activeTool === 'Text') {
    onTextEnd(evt.feature, 'Text');
    document.getElementById('o-draw-stylewindow').classList.remove('hidden');
  } else {
    setActive();
    activeTool = undefined;
    dispatcher.emitChangeDraw(evt.feature.getGeometry().getType(), false);
  }
  enableDoubleClickZoom(evt);
  if (drawLayer) {
    const featureStyle = getStylewindowStyle(evt.feature);
    evt.feature.setStyle(featureStyle);
  }
}

function setDraw(tool, drawType) {
  let geometryType = tool;
  drawSource = drawLayer.getSource();
  activeTool = tool;

  if (activeTool === 'Text') {
    geometryType = 'Point';
  }

  const drawOptions = {
    source: drawSource,
    type: geometryType
  };

  if (drawType) {
    Object.assign(drawOptions, shapes(drawType));
  }

  map.removeInteraction(draw);
  draw = new Draw(drawOptions);
  map.addInteraction(draw);
  dispatcher.emitChangeDraw(tool, true);
  draw.on('drawend', onDrawEnd, this);
  draw.on('drawstart', onDrawStart, this);
}

function onDeleteSelected() {
  const features = select.getFeatures();
  let source;
  if (features.getLength()) {
    source = drawLayer.getSource();
    features.forEach((feature) => {
      source.removeFeature(feature);
    });
    select.getFeatures().clear();
  }
}

function onSelectAdd(e) {
  if (e.target) {
    const feature = e.target.item(0);
    const featureStyle = feature.getStyle() || origoStyle.createStyleRule(defaultDrawStyle.draw[1]);
    featureStyle.push(selectionStyle);
    feature.setStyle(featureStyle);
    updateStylewindow(feature);
  }
}

function onSelectRemove(e) {
  restoreStylewindow();
  const style = e.element.getStyle();
  if (style[style.length - 1] === selectionStyle) {
    style.pop();
    e.element.setStyle(style);
  }
}

function cancelDraw(tool) {
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw(tool, false);
}

function onChangeDrawType(e) {
  activeTool = undefined;
  dispatcher.emitToggleDraw(e.detail.tool, { drawType: e.detail.drawType });
}

function isActive() {
  if (modify === undefined || select === undefined) {
    return false;
  }
  return true;
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    modify = undefined;
    select = undefined;
    draw = undefined;
  }
}

function getState() {
  if (drawLayer) {
    const source = drawLayer.getSource();
    const geojson = new GeoJSONFormat();
    const features = source.getFeatures();
    const json = geojson.writeFeatures(features);
    return {
      features: json
    };
  }

  return undefined;
}

function restoreState(state) {
  // TODO: Sanity/data check
  if (state.features && state.features.length > 0) {
    if (drawLayer === undefined) {
      drawLayer = new VectorLayer({
        group: 'none',
        name: 'drawplugin',
        visible: true,
        zIndex: 7,
        source: new VectorSource()
      });
      map.addLayer(drawLayer);
    }
    const source = drawLayer.getSource();
    source.addFeatures(state.features);
    source.getFeatures().forEach((feature) => {
      if (feature.get(annotationField)) {
        feature.set(annotationField, feature.get(annotationField));
      }
      if (feature.get('style')) {
        const featureStyle = getStylewindowStyle(feature, feature.get('style'));
        feature.setStyle(featureStyle);
      } else {
        const featureStyle = getStylewindowStyle(feature);
        feature.setStyle(featureStyle);
      }
    });
  }
}

function toggleDraw(e) {
  e.stopPropagation();
  if (e.detail.tool === 'delete') {
    onDeleteSelected();
  } else if (e.detail.tool === 'cancel') {
    cancelDraw(e.detail.tool);
    removeInteractions();
  } else if (e.detail.tool === activeTool) {
    cancelDraw(e.detail.tool);
  } else if (e.detail.tool === 'Polygon' || e.detail.tool === 'LineString' || e.detail.tool === 'Point' || e.detail.tool === 'Text') {
    if (activeTool) {
      cancelDraw(activeTool);
    }
    setActive('draw');
    setDraw(e.detail.tool, e.detail.drawType);
  }
}

function onEnableInteraction(e) {
  if (e.detail.interaction === 'draw' && !isActive()) {
    if (drawLayer === undefined) {
      drawLayer = new VectorLayer({
        group: 'none',
        name: 'drawplugin',
        visible: true,
        zIndex: 7,
        source: new VectorSource()
      });
      map.addLayer(drawLayer);
    }
    select = new Select({
      layers: [drawLayer],
      style: null,
      hitTolerance: 5
    });
    modify = new Modify({
      features: select.getFeatures(),
      style: null
    });
    map.addInteraction(select);
    map.addInteraction(modify);
    select.getFeatures().on('add', onSelectAdd, this);
    select.getFeatures().on('remove', onSelectRemove, this);
    setActive();
  }
}

const getSelection = () => select.getFeatures();

const getActiveTool = () => activeTool;

const init = function init(optOptions) {
  const options = optOptions || {};
  map = options.viewer.getMap();
  annotationField = options.annotation || 'annonation';
  activeTool = undefined;
  document.addEventListener('toggleDraw', toggleDraw);
  document.addEventListener('editorDrawTypes', onChangeDrawType);
  document.addEventListener('enableInteraction', onEnableInteraction);
};

export default {
  init,
  getSelection,
  getState,
  restoreState,
  getActiveTool,
  isActive
};
