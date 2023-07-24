import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { LineString } from 'ol/geom';
import { noModifierKeys } from 'ol/events/condition';
import { Button, Element as El, Modal } from '../../ui';
import Infowindow from '../../components/infowindow';
import store from './editsstore';
import generateUUID from '../../utils/generateuuid';
import transactionHandler from './transactionhandler';
import dispatcher from './editdispatcher';
import editForm from './editform';
import imageresizer from '../../utils/imageresizer';
import getImageOrientation from '../../utils/getimageorientation';
import shapes from './shapes';
import searchList from './addons/searchList/searchList';
import validate from '../../utils/validate';
import slugify from '../../utils/slugify';
import topology from '../../utils/topology';
import attachmentsform from './attachmentsform';
import relatedTablesForm from './relatedtablesform';
import relatedtables from '../../utils/relatedtables';

const editsStore = store();
let editLayers = {};
let autoSave;
let autoForm;
let map;
let currentLayer;
let editableLayers;
let attributes;
let title;
let draw;
let hasDraw;
let hasSnap;
let select;
let modify;
let snap;
let viewer;
let featureInfo;
let modal;
/** Roll back copy of geometry that is currently being modified (if any) */
let modifyGeometry;
/** The feature that is currently being drawn (if any). Must be reset when draw is finished or abandoned as OL resuses its feature and
 *  we must detect when a new drawing is started */
let drawFeature;
let validateOnDraw;
let allowDelete;
let allowCreate;
let allowEditAttributes;
let allowEditGeometry;
/** List that tracks the state when editing related tables */
let breadcrumbs = [];
let autoCreatedFeature = false;
let infowindowCmp = false;

function isActive() {
  // FIXME: this only happens at startup as they are set to null on closing. If checking for null/falsley/not truely it could work as isVisible with
  // the exption that it can not determine if it is visble before interactions are set, i.e. it can't be used to determine if interactions should be set.
  // Right now it does not matter as it is not used anywhere critical.
  if (modify === undefined || select === undefined) {
    return false;
  }
  return true;
}

function setActive(editType) {
  switch (editType) {
    case 'modify':
      draw.setActive(false);
      modify.setActive(true);
      select.setActive(true);
      break;
    case 'draw':
      draw.setActive(true);
      if (modify) modify.setActive(true);
      select.setActive(false);
      break;
    case 'custom':
      draw.setActive(false);
      if (modify) modify.setActive(false);
      select.setActive(false);
      break;
    default:
      if (draw) draw.setActive(false);
      if (modify) modify.setActive(true);
      if (select) select.setActive(true);
      hasDraw = false;
      break;
  }
}

function getFeaturesByIds(type, layer, ids) {
  const source = layer.getSource();
  const features = [];
  if (type === 'delete') {
    ids.forEach((id) => {
      const dummy = new Feature();
      dummy.setId(id);
      features.push(dummy);
    });
  } else {
    ids.forEach((id) => {
      let feature;
      if (source.getFeatureById(id)) {
        feature = source.getFeatureById(id);
        feature.unset('bbox');
        features.push(feature);
      }
    });
  }

  return features;
}

/**
 * Helper that calculates the default value for one attribute
 * @param {any} attribConf The list entry from "attributes"-configuration that default value should be calculated for
 * @returns The default value for provided attribute or undefined if no default value
 */
function getDefaultValueForAttribute(attribConf) {
  const defaultsConfig = attribConf.defaultValue;
  if (defaultsConfig) {
    if (typeof defaultsConfig === 'string') {
      return defaultsConfig;
    }
    // Else look for some properties
    if (defaultsConfig.type === 'sessionStorage') {
      return sessionStorage.getItem(defaultsConfig.key);
    } else if (defaultsConfig.type === 'localStorage') {
      return localStorage.getItem(defaultsConfig.key);
    } else if (defaultsConfig.type === 'timestamp') {
      // If an exact timestamp is needed, use a database default or trigger, this is taken when editor opens
      const today = new Date();
      // Can't win the timezone war. If local time is used, save it without any timezone info and hope the server does the right thing
      const isoDate = defaultsConfig.useUTC ? today.toISOString() : new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
      switch (defaultsConfig.timeStampFormat) {
        // yy-MM-dd consistent with attribute format "date"
        case 'date':
          return isoDate.slice(0, 10);
        case 'time':
          // HH:mm:ss consistent with attribute format "time"
          return isoDate.slice(11, 19);
        case 'datetime':
          // "yy-MM-dd HH:mm:ss" consistent with attribute format "datetime"
          return `${isoDate.slice(0, 10)} ${isoDate.slice(11, 19)}`;
        default:
          // Can be parsed to DateTime by server, skipping milliseconds and timezone info.
          // Suitable for hidden fields that correspond to a DateTime in database
          return isoDate.slice(0, 19);
      }
    }
  } else if (attribConf.type === 'checkbox' && attribConf.config && attribConf.config.uncheckedValue) {
    // Checkboxes defaults to unchecked value if no default value is specified. If no uncheckedValue is specified it
    // will default to unchecked by some magic javascript falsly comparison later.
    return attribConf.config.uncheckedValue;
  }
  // This attribute has no default value
  return undefined;
}

/**
 * Helper that calculate all default values for a layer.
 * @param {any} attrs The "attributes"-configuration for the desired layer
 * @returns {object} An object with attributes names as properties and the default value as value.
 */
function getDefaultValues(attrs) {
  return attrs.filter(attribute => attribute.name)
    .reduce((prev, curr) => {
      const previous = prev;
      const defaultValue = getDefaultValueForAttribute(curr);
      if (defaultValue !== undefined) {
        previous[curr.name] = defaultValue;
      }
      return previous;
    }, {});
}

function getSnapSources(layers) {
  return layers.map(layer => viewer.getLayer(layer).getSource());
}
/**
 * Saves the features to server.
 * @returns A promise which is resolved when all features have been saved if the source supports it. Otherwise it is resolved immediately.
 * */
async function saveFeatures() {
  const edits = editsStore.getEdits();
  const layerNames = Object.getOwnPropertyNames(edits);
  const promises = [];
  layerNames.forEach((layerName) => {
    const transaction = {
      insert: null,
      delete: null,
      update: null
    };
    const editTypes = Object.getOwnPropertyNames(edits[layerName]);
    editTypes.forEach((editType) => {
      const layer = viewer.getLayer(layerName);
      const ids = edits[layerName][editType];
      const features = getFeaturesByIds(editType, layer, ids);
      if (features.length) {
        transaction[editType] = features;
      }
    });
    // If the source does not return a promise it is not awaited for in Promise.all, so this is pretty safe.
    promises.push(transactionHandler(transaction, layerName, viewer));
  });
  return Promise.all(promises);
}

/**
 * Adds changed feature to the editstore and if config parameter autoSave is set, also triggers a transaction.
 * @param {any} change The feature and change type
 * @param {any} ignoreAutoSave Optional argument that overrides autoSave configuration parameter. Used to prevent numerous transactions in batch mode.
 */
async function saveFeature(change, ignoreAutoSave) {
  dispatcher.emitChangeFeature(change);
  if (autoSave && !ignoreAutoSave) {
    await saveFeatures(change);
  }
}

function onModifyEnd(evt) {
  const feature = evt.features.item(0);
  // Roll back modification if the resulting geometry was invalid
  if (validateOnDraw && !topology.isGeometryValid(feature.getGeometry())) {
    feature.setGeometry(modifyGeometry);
  } else {
    saveFeature({
      feature,
      layerName: currentLayer,
      action: 'update'
    });
  }
}

function onModifyStart(evt) {
  // Get a copy of the geometry before modification
  if (validateOnDraw) {
    modifyGeometry = evt.features.item(0).getGeometry().clone();
  }
}

/**
 * Adds the feature to the layer and set default attributes and a temporary id. If autosaved is enabled it is saved to db.
 * @param {any} feature
 * @param {any} layerName
 * @returns a promise which is resolved when feature is saved to db (or immediately id not autosave)
 */
async function addFeatureToLayer(feature, layerName) {
  const layer = viewer.getLayer(layerName);
  const defaultAttributes = getDefaultValues(layer.get('attributes'));
  feature.setProperties(defaultAttributes);
  feature.setId(generateUUID());
  layer.getSource().addFeature(feature);
  return saveFeature({
    feature,
    layerName,
    action: 'insert'
  });
}

/**
 * Helper for adding new features. Typically called from various eventhandlers
 * @param {Feature} feature The feature to add.
 * @returns a promise which is resolved when feature is saved to db (or immediately if not autosave)
 */
async function addFeature(feature) {
  await addFeatureToLayer(feature, currentLayer);
  setActive();
  hasDraw = false;
  dispatcher.emitChangeEdit('draw', false);
  if (autoForm) {
    autoCreatedFeature = true;
    // eslint-disable-next-line no-use-before-define
    editAttributes(feature);
  }
}

// Handler for OL Draw interaction
function onDrawEnd(evt) {
  const f = evt.feature;

  // Reset pointer to drawFeature, OL resuses the same feature
  drawFeature = null;

  // WORKAROUND OL 6.5.0: OL have two identical vertices in the beginning of a LineString or Polygon when drawing freehand, and that would
  // be considered as an invalid geometry.
  // Also when drawing freehand (epsecially using touch screen) there may be identical vertices
  // Remove identical vertices by doing a simplify using a small tolerance. Not the most efficient, but it's only one row for me to write and
  // freehand produces so many vertices that a clean up is still a good idea.
  f.setGeometry(f.getGeometry().simplify(0.00001));

  // If live validation did its job, we should not have to validate here, but freehand bypasses all controls and we can't tell if freehand was used.
  if (validateOnDraw && !topology.isGeometryValid(f.getGeometry())) {
    alert('Kan ej spara, geometrin är ogiltig');
  } else {
    addFeature(evt.feature);
  }
}

/**
 * Called when the startdraw-event fires.
 * @param {any} evt
 */
function onDrawStart(evt) {
  // Stash a pointer to the feature being drawn for later use
  // It is constantly being updated when drawing using a mouse.
  drawFeature = evt.feature;
}

/**
 * Called when draw is aborted from OL
 * */
function onDrawAbort() {
  drawFeature = null;
}
/**
 * Called by OL on mouse down to check if a vertex should be added
 * @param {any} evt The MapBrowserEvent as received by Draw
 * @returns true if the point should be added, false otherwise
 */
function conditionCallback(evt) {
  // Check modifiers
  if (!noModifierKeys(evt)) {
    return false;
  }
  // This function is called before onDrawStart, so first time there is no drawFeature as no point has been allowed
  // Second time there will be two points (first click and second click)
  // Third time there will be three points for line and four points for poly as a poly is auto closed.
  // When using touch, the current point is a copy of the previous, as it has not been moved yet. Clicked position comes in the event.
  // when using mouse, the current point is updated continously on mousemove, so it is the same as the click event
  // If this function returns true, the action is allowed and the clicked point is added t the draw.
  // If it returns false, the click is regarded as never happened, which will affect the possibility to stop drawing as well.
  if (!drawFeature) {
    // First call. Here we could check event to see if it is possible to start a new geometry here (overlapping rules, holes, multipolygon self overlap etc)
    return true;
  }

  const isTouch = evt.originalEvent.pointerType === 'touch';
  let coords;
  let minPointsToClose = 3;
  // Strangely enough, we don't get what has actually been drawn in the event. Pick up pointer to sketch from our own state
  // The sketch feature is what is drawn on the screen, not the actual feature, so It can only be poly, line or point. No multi-variant as
  // draw interaction can't make them.
  if (drawFeature.getGeometry().getType() === 'Polygon') {
    // OL adds a closing vertex when more than two points. Remove it in validation
    const polyCoords = drawFeature.getGeometry().getCoordinates()[0];
    const arrayend = polyCoords.length > 2 ? -1 : polyCoords.length;
    coords = polyCoords.slice(0, arrayend);
  }
  if (drawFeature.getGeometry().getType() === 'LineString') {
    minPointsToClose = 2;
    coords = drawFeature.getGeometry().getCoordinates().slice();
  }
  if (coords) {
    if (isTouch) {
      // Touch has a duplicate vertex as placeholder for clicked coordinate. Remove that and add the clicked coordinate, as it is not included in geom for touch
      coords.pop();
      coords.push(evt.coordinate);
    }

    // When trying to self auto close there can be two identical coords in the end if clicked on the exact same pixel. Allow that and make finishCondition fail instead of checking if we will succeed
    // This has the drawback that it is not possible to finish with an invalid last point that will be removed anyway.
    // Otherwise we have to implement the same clickTolerance as draw to distinguish between a new point and auto close or always try to autoclose and save that
    // result as a state to check in finishCondition.
    // If we got here we have at least two coords, so indexing -2 is safe
    if (coords[coords.length - 1][0] === coords[coords.length - 2][0] && coords[coords.length - 1][1] === coords[coords.length - 2][1]) {
      if (coords.length <= minPointsToClose) {
        // Cant' put second point on first, and finishCondition will not be called on too few points
        return false;
      }
      // No need to validate, it was valid before and no new point is added, we just for sure will try to finish.
      return true;
    }
    // Validate only last added segment
    return !topology.isSelfIntersecting(new LineString(coords), true);
  }

  return true;
}

/**
 * Called by OL on mouse down to check if a sketch could be finished
 * @param {any} evt The MapBrowserEvent as received by Draw
 * @returns true if the feature can be completed , false otherwise
 */
function finishConditionCallback() {
  // Only necessary to check polygons. Lines do not auto close, so all points are already checked.
  if (validateOnDraw && drawFeature && drawFeature.getGeometry().getType() === 'Polygon') {
    const coords = drawFeature.getGeometry().getCoordinates()[0];
    // remove second last coord. It is the last clicked position. If this function got called, OL deemed it close enough to either start or last point
    // to finish sketch and will not be a part of the final geometry, so remove it.
    const last = coords.pop();
    coords.pop();
    coords.push(last);
    const line = new LineString(coords);
    const isValid = !topology.isSelfIntersecting(line);

    if (!isValid) {
      // Topology can only be invalid if trying to auto close, but to not mess with the logic in Draw for clickTolerance,
      // we allow the click events and try to deal with it later.
      // The only way to become invalid here is because auto close, and if that failed remove last point as it will be double there.
      // Non auto close are blocked in conditionCallback.
      // Must schedule to make draw finish execution first.
      setTimeout(() => draw.removeLastPoint(), 0);
    }
    return isValid;
  }
  return true;
}

// Handler for external draw. It just adds a new feature to the layer, no questions asked.
// Intended usage is creating a feature in a drawTool custom tool
// event contains the new feature to be added.
// if no feature is provided action is aborted.
function onCustomDrawEnd(e) {
  // Check if a feature has been created, or tool canceled
  const feature = e.detail.feature;
  if (feature) {
    if (feature.getGeometry().getType() !== editLayers[currentLayer].get('geometryType')) {
      alert('Kan inte lägga till en geometri av den typen i det lagret');
    } else {
      // Must move geometry to correct property. Setting geometryName is not enough.
      if (editLayers[currentLayer].get('geometryName') !== feature.getGeometryName()) {
        feature.set(editLayers[currentLayer].get('geometryName'), feature.getGeometry());
        feature.unset(feature.getGeometryName());
        e.detail.feature.setGeometryName(editLayers[currentLayer].get('geometryName'));
      }
      addFeature(e.detail.feature);
    }
  }
  setActive();
}

function addSnapInteraction(sources) {
  const snapInteractions = [];
  sources.forEach((source) => {
    const interaction = new Snap({
      source
    });
    snapInteractions.push(interaction);
    map.addInteraction(interaction);
  });
  return snapInteractions;
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    if (snap) {
      snap.forEach((snapInteraction) => {
        map.removeInteraction(snapInteraction);
      });
    }

    modify = null;
    select = null;
    draw = null;
    snap = null;
  }
}

function setAllowedOperations() {
  const allowedOperations = editLayers[currentLayer].get('allowedEditOperations');
  if (allowedOperations) {
    allowEditGeometry = allowedOperations.includes('updateGeometry');
    allowEditAttributes = allowedOperations.includes('updateAttributes');
    allowCreate = allowedOperations.includes('create');
    allowDelete = allowedOperations.includes('delete');
  } else {
    // For backwards compability, allow everything if allowedEditOperations is not in config.
    allowEditGeometry = true;
    allowEditAttributes = true;
    allowCreate = true;
    allowDelete = true;
  }
}

function setInteractions(drawType) {
  const editLayer = editLayers[currentLayer];
  attributes = editLayer.get('attributes');
  title = editLayer.get('title') || 'Information';
  const drawOptions = {
    type: editLayer.get('geometryType'),
    geometryName: editLayer.get('geometryName')
  };
  if (drawType) {
    Object.assign(drawOptions, shapes(drawType));
  }
  if (validateOnDraw) {
    drawOptions.condition = conditionCallback;
    drawOptions.finishCondition = finishConditionCallback;
  }
  removeInteractions();
  draw = new Draw(drawOptions);
  hasDraw = false;
  select = new Select({
    layers: [editLayer],
    multi: !!infowindowCmp
  });
  if (infowindowCmp) {
    infowindowCmp.close();
    select.on('select', () => {
      if (select.getFeatures().getLength() > 1) {
        const featureListAttributes = editLayer.get('featureListAttributes');
        const listCmp = [];
        const featureArray = select.getFeatures().getArray();
        featureArray.forEach(feature => {
          if (typeof feature.getStyle() === 'function') {
            const styleArr = feature.getStyle()(feature);
            styleArr.forEach(style => style.setZIndex(10));
          }
          let buttonText = '';
          if (featureListAttributes && featureListAttributes.length > 0) {
            featureListAttributes.forEach(attribute => {
              if (attribute.toLowerCase() === 'id') {
                buttonText += `id: ${feature.getId()}<br />`;
              } else {
                buttonText += feature.get(attribute) ? `${attribute}: ${feature.get(attribute)}<br />` : '';
              }
            });
          } else {
            buttonText += `ID: ${feature.getId()}`;
          }
          const featureButton = Button({
            text: buttonText,
            state: 'initial',
            cls: 'text-align-left hover light',
            click() {
              select.getFeatures().clear();
              select.getFeatures().push(feature);
              infowindowCmp.dispatch('resetButtonStates');
              infowindowCmp.dispatch('removeMouseenter');
              this.setState('active');
            },
            mouseenter() {
              select.getFeatures().clear();
              select.getFeatures().push(feature);
              infowindowCmp.dispatch('resetButtonStates');
              this.setState('active');
            }
          });
          const listItem = El({
            tagName: 'li',
            components: [featureButton]
          });
          listCmp.push(listItem);
          infowindowCmp.on('resetButtonStates', () => {
            featureButton.setState('initial');
            if (document.getElementById(featureButton.getId())) {
              document.getElementById(featureButton.getId()).blur();
            }
          });
          infowindowCmp.on('removeMouseenter', () => {
            featureButton.dispatch('removeMouseenter');
          });
        });
        const content = El({
          tagName: 'ul',
          components: listCmp
        });
        infowindowCmp.changeContent(content);
      } else {
        infowindowCmp.close();
      }
    });
  }
  if (allowEditGeometry) {
    modify = new Modify({
      features: select.getFeatures()
    });
    map.addInteraction(modify);
    modify.on('modifyend', onModifyEnd, this);
    modify.on('modifystart', onModifyStart, this);
  }

  map.addInteraction(select);

  map.addInteraction(draw);

  draw.on('drawend', onDrawEnd, this);
  draw.on('drawstart', onDrawStart, this);
  draw.on('drawabort', onDrawAbort, this);
  setActive();

  // If snap should be active then add snap internactions for all snap layers
  hasSnap = editLayer.get('snap');
  if (hasSnap) {
    const selectionSource = featureInfo.getSelectionLayer().getSource();
    const snapSources = editLayer.get('snapLayers') ? getSnapSources(editLayer.get('snapLayers')) : [editLayer.get('source')];
    snapSources.push(selectionSource);
    snap = addSnapInteraction(snapSources);
  }
}

function closeAllModals() {
  // Close all modals first to get rid of tags in DOM
  if (modal) modal.closeModal();
  modal = null;
  breadcrumbs.forEach(br => {
    if (br.modal) br.modal.closeModal();
  });
  breadcrumbs = [];
}

function setEditLayer(layerName) {
  // It is not possible to actually change layer while having breadcrubs as all modals must be closed, which will
  // pop off all breadcrumbs.
  // But just in case something changes, reset the breadcrumbs when a new layer is edited.
  closeAllModals();
  currentLayer = layerName;
  setAllowedOperations();
  setInteractions();
}

function setGeometryProps(layer) {
  const layerName = layer.get('name');
  editLayers[layerName].set('geometryType', layer.getSource().getFeatures()[0].getGeometry().getType());
  if (layerName === currentLayer) {
    setEditLayer(layerName);
  }
}

function addFeatureAddListener(layerName) {
  const layer = viewer.getLayer(layerName);
  layer.getSource().once('addfeature', () => {
    setGeometryProps(layer);
  });
}

function verifyLayer(layerName) {
  if (!(editLayers[layerName].get('geometryType'))) {
    addFeatureAddListener(layerName);
  }
}

function setEditProps(options) {
  const initialValue = {};
  const result = editableLayers.reduce((layerProps, layerName) => {
    const layer = viewer.getLayer(layerName);
    const layerProperties = layerProps;
    const snapLayers = options.snapLayers || editableLayers;
    snap = 'snap' in options ? options.snap : true;
    layer.set('snap', snap);
    layer.set('snapLayers', snapLayers);
    layerProperties[layerName] = layer;
    return layerProps;
  }, initialValue);
  return result;
}

/**
 * Helper to delete a feature. If the feature belongs to a layer that has related layers the deletion is recursive
 * if configured so in the relation configuration.
 * @param {any} feature The feature to delete
 * @param {any} layer The layer in which the feature is
 * @param {any} supressDbDelete True if the feature should in fact not be deleted from db. Defaults to false. Mainly used by recursive calls.
 * @returns a promise which is resolved when feature is deleted from db (or immediately id not autosave)
 */
async function deleteFeature(feature, layer, supressDbDelete) {
  // If editor is in auto save mode we can delete in the correct order by start by recursing before deleting anything
  // If editor is not in auto save, it is up to the transactionhandler in combination with the map server if
  // delete order is preserved. Better not have any db constraints if mode is 'cascade'.
  // If mode is 'db' child features are only deleted from the map and it is up to the database to delete or keep orphaned children.
  // If mode is 'none' (default), just delete this feature and keep children orphaned in map.

  // First delete child features recursively
  const relatedLayersConfig = relatedtables.getConfig(layer);
  if (relatedLayersConfig) {
    // async and forEach do not mix. Use some old school looping as lint forbids for in
    for (let ix = 0; ix < relatedLayersConfig.length; ix += 1) {
      const currLayerConfig = relatedLayersConfig[ix];
      const deleteMode = currLayerConfig.cascadingDelete;
      if (deleteMode === 'cascade' || deleteMode === 'db') {
        const childLayer = viewer.getLayer(currLayerConfig.layerName);
        // This funtion is recursive, we have to await
        // eslint-disable-next-line no-await-in-loop
        const childFeatures = await relatedtables.getChildFeatures(layer, feature, childLayer);
        for (let jx = 0; jx < childFeatures.length; jx += 1) {
          const currChildFeature = childFeatures[jx];
          // This funtion is recursive, we have to await
          // eslint-disable-next-line no-await-in-loop
          await deleteFeature(currChildFeature, childLayer, deleteMode === 'db');
        }
      }
    }
  }

  // If caller had deleteMode == 'db', this db entry is assumed to be deleted by the database when the parent is deleted
  // but we must still remove it from the map (or refresh the entire layer, which we won't).
  if (!supressDbDelete) {
    await saveFeature({
      feature,
      layerName: layer.get('name'),
      action: 'delete'
    });
  }
  const source = layer.getSource();
  source.removeFeature(feature);
}

function onDeleteSelected() {
  const features = select.getFeatures();

  // Make sure all features are loaded in the source
  // const editSource = editLayers[currentLayer].getSource();
  if (features.getLength() === 1) {
    const feature = features.item(0);
    const r = window.confirm('Är du säker på att du vill ta bort det här objektet?');
    if (r === true) {
      deleteFeature(feature, editLayers[currentLayer]).then(() => select.getFeatures().clear());
    }
  }
}

function startDraw() {
  if (!editLayers[currentLayer].get('geometryType')) {
    alert(`"geometryType" har inte angivits för ${editLayers[currentLayer].get('name')}`);
  } else if (hasDraw !== true && isActive()) {
    setActive('draw');
    hasDraw = true;
    dispatcher.emitChangeEdit('draw', true);
  }
}

function cancelDraw() {
  setActive();
  if (hasDraw) {
    draw.abortDrawing();
  }

  drawFeature = null;
  hasDraw = false;
  dispatcher.emitChangeEdit('draw', false);
}

// Event from drawTools
function onChangeShape(e) {
  // Custom shapes are handled entirely in drawTools, just wait for a feature to land in onCustomDrawEnd
  if (e.detail.shape === 'custom') {
    setActive('custom');
  } else {
    setInteractions(e.detail.shape);
    startDraw();
  }
}

/**
 * Refreshes the related tables section of the current edit form
 * @param {any} feature
 */
function refreshRelatedTablesForm(feature) {
  const relatedTablesFormEl = document.getElementById(`o-relatedtables-form-${currentLayer}`);
  relatedTablesForm(viewer, viewer.getLayer(currentLayer), feature, relatedTablesFormEl);
}

/** Called when the edit form modal is closed. Reverts the editor state to edit the parent object if the modal was a child table */
function onModalClosed() {
  if (breadcrumbs.length > 0) {
    const lastBread = breadcrumbs.pop();

    // Restore some global varaibles that defines the state
    currentLayer = lastBread.layerName;
    modal = lastBread.modal;
    title = lastBread.title;
    attributes = lastBread.attributes;

    // State is restored, now show parent modal instead and refresh as the title attribute might have changed
    if (modal) {
      modal.show();
    }
    if (lastBread.feature) {
      refreshRelatedTablesForm(lastBread.feature);
    }
  } else {
    // last modal to be closed. Set to null so we can check if there is an modal.
    modal = null;
  }
}

/**
 * Reads the new attribute values from from DOM and saves to feature
 * @param {any} features The features to save
 * @param {any} formEl The attributes to set on features
 */
function attributesSaveHandler(features, formEl) {
  features.forEach(feature => {
    // get DOM values and set attribute values to feature
    attributes.forEach((attribute) => {
      if (Object.prototype.hasOwnProperty.call(formEl, attribute.name)) {
        feature.set(attribute.name, formEl[attribute.name]);
      }
    });
    saveFeature({
      feature,
      layerName: currentLayer,
      action: 'update'
    }, true);
  });
  // Take control of auto save here to avoid one transaction per feature when batch editing
  if (autoSave) {
    saveFeatures();
  }
}

/**
 * Sets up an eventlistener on the attribute editor form abort button.
 * @param {Collection} features The features that shouldn't be updated
 */
function onAttributesAbort(features) {
  const abortBtnEl = document.getElementById(`o-abort-button-${currentLayer}`);
  if (abortBtnEl !== null) {
    abortBtnEl.addEventListener('click', (e) => {
      abortBtnEl.blur();
      features.forEach((feature) => {
        deleteFeature(feature, viewer.getLayer(currentLayer)).then(() => {
          if (select) select.getFeatures().clear();
        });
      });
      modal.closeModal();
      // The modal does not fire close event when it is closed externally
      onModalClosed();
      e.preventDefault();
    });
  }
}

/**
 * Sets up an eventlistener on the attribute editor form save button.
 * @param {Collection} features The features that should be updated
 * @param {any} attrs Array of attributes whih values to set
 */
function onAttributesSave(features, attrs) {
  document.getElementById(`o-save-button-${currentLayer}`).addEventListener('click', (e) => {
    const editEl = {};
    const valid = {};
    attrs.forEach((attribute) => {
      // Get the input container class
      const containerClass = `.${attribute.elId}`;
      // Get the input attributes
      // FIXME: Don't have to get from DOM, the same values are in 'attribute'
      // and it would be enough to call getElementId once anyway (called numerous times later on).
      const inputType = document.getElementById(attribute.elId).getAttribute('type');
      const inputValue = document.getElementById(attribute.elId).value;
      const inputName = document.getElementById(attribute.elId).getAttribute('name');
      const inputId = document.getElementById(attribute.elId).getAttribute('id');
      const inputRequired = document.getElementById(attribute.elId).required;

      // If hidden element it should be excluded
      // By sheer luck, this prevents attributes to be changed in batch edit mode when checkbox is not checked.
      // If this code is changed, it may be necessary to excplict check if the batch edit checkbox is checked for this attribute.
      if (!document.querySelector(containerClass) || document.querySelector(containerClass).classList.contains('o-hidden') === false) {
        // Check if checkbox. If checkbox read state.
        if (inputType === 'checkbox') {
          const checkedValue = (attribute.config && attribute.config.checkedValue) || 1;
          const uncheckedValue = (attribute.config && attribute.config.uncheckedValue) || 0;
          editEl[attribute.name] = document.getElementById(attribute.elId).checked ? checkedValue : uncheckedValue;
        } else if (attribute.type === 'searchList') {
          // SearchList may have its value in another place than the input element itself. Query the "Component" instead.
          // Note that inputValue still contains the value of the input element, which is  used to validate required.
          // No other validation is performed on searchList as the only thing that can be checked now is that value is in list
          // and that is handled inside the searchList itself.
          editEl[attribute.name] = attribute.searchList.getValue();
        } else if (attribute.type === 'image') {
          // File input's value is the filename, but the image itself is stored in the model
          editEl[attribute.name] = attribute.val;
        } else { // Read value from input text, textarea or select
          editEl[attribute.name] = inputValue;
        }
      }

      // Validate form input
      const errorOn = document.querySelector(`[id="${inputId}"]`);
      const errorCls = `.o-${inputId}`;
      const errorMsg = document.querySelector(errorCls);
      const errorText = `Vänligen ange korrekt ${inputName}`;
      const requiredOn = document.querySelector(`[id="${inputId}"]`);
      const requiredCls = `.o-${inputId}-requiredMsg`;
      const requiredMsg = document.querySelector(requiredCls);

      valid.required = inputRequired && inputValue === '' ? false : inputValue;
      if (!valid.required && inputRequired && inputValue === '') {
        if (!requiredMsg) {
          if (requiredOn.getAttribute('class') === 'awesomplete') {
            requiredOn.parentNode.insertAdjacentHTML('afterend', `<div class="o-${inputId}-requiredMsg errorMsg fade-in padding-bottom-small">Obligatoriskt fält</div>`);
          } else {
            requiredOn.insertAdjacentHTML('afterend', `<div class="o-${inputId}-requiredMsg errorMsg fade-in padding-bottom-small">Obligatoriskt fält</div>`);
          }
        }
      } else if (requiredMsg) {
        requiredMsg.remove();
      }

      switch (attribute.type) {
        case 'text':
          valid.text = validate.text(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.text && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'textarea':
          valid.textarea = validate.textarea(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.textarea && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'integer':
          valid.integer = validate.integer(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.integer && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'decimal':
          valid.decimal = validate.decimal(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.decimal && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'email':
          valid.email = validate.email(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.email && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'url':
          valid.url = validate.url(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.url && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'datetime':
          valid.datetime = validate.datetime(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.datetime && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'date':
          valid.date = validate.date(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.date && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'time':
          valid.time = validate.time(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.time && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'image':
          valid.image = validate.image(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.image && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'color':
          valid.color = validate.color(inputValue) || inputValue === '' ? inputValue : false;
          if (!valid.color && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;

        default:
      }
      valid.validates = !Object.values(valid).includes(false);
    });

    // If valid, continue
    if (valid.validates) {
      attributesSaveHandler(features, editEl);

      document.getElementById(`o-save-button-${currentLayer}`).blur();
      modal.closeModal();
      // The modal does not fire close event when it is closed externally
      onModalClosed();
      e.preventDefault();
    }
  });
}

function addListener() {
  const fn = (obj) => {
    document.getElementById(obj.elDependencyId).addEventListener(obj.eventType, () => {
      const containerClass = `.${obj.elId}`;
      if (obj.requiredVal.startsWith('[')) {
        const tmpArray = obj.requiredVal.replace('[', '').replace(']', '').split(',');
        if (tmpArray.includes(document.getElementById(obj.elDependencyId).value)) {
          document.querySelector(containerClass).classList.remove('o-hidden');
        } else {
          document.querySelector(containerClass).classList.add('o-hidden');
        }
      } else if (document.getElementById(obj.elDependencyId).value === obj.requiredVal) {
        document.querySelector(containerClass).classList.remove('o-hidden');
      } else {
        document.querySelector(containerClass).classList.add('o-hidden');
      }
    });
  };

  return fn;
}

/**
 * Returns a function that adds an event handler to read an image file when user selects a file.
 * */
function addImageListener() {
  const fn = (obj) => {
    const fileReader = new FileReader();
    const containerClass = `.${obj.elId}`;
    document.querySelector(`#${obj.elId}`).addEventListener('change', (ev) => {
      if (ev.target.files && ev.target.files[0]) {
        document.querySelector(`${containerClass} img`).classList.remove('o-hidden');
        document.querySelector(`${containerClass} input[type=button]`).classList.remove('o-hidden');
        fileReader.onload = () => {
          // When the file has been read, rotate it and resize to configured max size or default max
          // Don't know why it's rotated. Probably something to do with iphones that store images upside down.
          getImageOrientation(ev.target.files[0], (orientation) => {
            imageresizer(fileReader.result, obj, orientation, (resized) => {
              // Display the image in the form
              document.querySelector(`${containerClass} img`).setAttribute('src', resized);
              // Store the image data in the model so it can be retreived when saving without having to read the file again
              // or pick it up from the img tag
              // eslint-disable-next-line no-param-reassign
              obj.val = resized;
            });
          });
        };
        fileReader.readAsDataURL(ev.target.files[0]);
      }
    });
    // Find the remove button and attach event handler.
    document.querySelector(`${containerClass} input[type=button]`).addEventListener('click', (e) => {
      // Clear the filename
      document.getElementById(obj.elId).value = '';
      // Also clear the model value
      // eslint-disable-next-line no-param-reassign
      obj.val = '';
      document.querySelector(`${containerClass} img`).classList.add('o-hidden');
      e.target.classList.add('o-hidden');
    });
  };

  return fn;
}

/**
 * Returns a click handler that should be attached to batch edit checkboxes to show or hide the input field
 * */
function addBatchEditListener() {
  const fn = (obj) => {
    document.getElementById(obj.elId).addEventListener('click', (ev) => {
      const classList = document.querySelector(`.${obj.relatedAttrId}`).classList;
      if (ev.target.checked) {
        classList.remove('o-hidden');
      } else {
        classList.add('o-hidden');
      }
    });
  };
  return fn;
}

/**
 * Makes an input into an searchList (aweseome). Called after model DOM i created.
 * @param {any} obj
 */
function turnIntoSearchList(obj) {
  const el = document.getElementById(obj.elId);
  return searchList(el, { list: obj.list, config: obj.config });
}

/**
 * Edits the attributes for given feature or selection from interaction
 * @param {any} feat Feature to edit attributes for. If omitted selection will be used instead
 */
function editAttributes(feat) {
  let feature;
  let attributeObjects;
  /** Array of batch edit checkbox models */
  const batchEditBoxes = [];
  /** OL Collection */
  let features;
  const layer = viewer.getLayer(currentLayer);

  // Get attributes from the created, or the selected, feature and fill DOM elements with the values
  if (feat) {
    features = new Collection();
    features.push(feat);
  } else {
    // Interaction is set up to only select for edited layer, so no need to check layer.
    features = select.getFeatures();
  }
  const isBatchEdit = features.getLength() > 1 && attributes.some(a => a.allowBatchEdit);
  const dlgTitle = isBatchEdit ? `Batch edit ${title}.<br>(${features.getLength()} objekt)` : title;

  /** Filtered list of attributes containing only those that should be displayed */
  const editableAttributes = attributes.filter(attr => {
    const attachmentsConfig = layer.get('attachments');
    const relatedTablesConfig = relatedtables.getConfig(layer);
    // Filter out attributes created from attachments. Actually can produce false positives if name is not set, but that is handled in the next row
    // as name is required for editable attributes (although not specified in the docs, but needed to create the input)
    const isAttachment = attachmentsConfig && attachmentsConfig.groups.some(g => g.linkAttribute === attr.name || g.fileNameAttribute === attr.name);
    const isRelatedPromoted = relatedTablesConfig && relatedTablesConfig.some(c => c.promoteAttribs && c.promoteAttribs.some(c2 => c2.parentName === attr.name));
    return attr.name && (!isBatchEdit || (isBatchEdit && attr.allowBatchEdit)) && !isAttachment && !isRelatedPromoted;
  });

  if (features.getLength() === 1 || isBatchEdit) {
    dispatcher.emitChangeEdit('attribute', true);
    // Pick first feature to extract some properties from.
    feature = features.item(0);
    if (editableAttributes.length > 0) {
      // Create an array of defined attributes and corresponding values from selected feature
      attributeObjects = editableAttributes.map((attributeObject) => {
        const obj = {};
        Object.assign(obj, attributeObject);
        if (obj.defaultValue && obj.defaultValue.updateOnEdit) {
          obj.val = getDefaultValueForAttribute(obj);
        } else {
          obj.val = feature.get(obj.name) !== undefined ? feature.get(obj.name) : '';
        }
        if ('constraint' in obj) {
          const constraintProps = obj.constraint.split(':');
          if (constraintProps.length === 3) {
            obj.eventType = constraintProps[0];
            obj.dependencyVal = feature.get(constraintProps[1]);
            obj.requiredVal = constraintProps[2];
            if (constraintProps[2].startsWith('[')) {
              const tmpArray = constraintProps[2].replace('[', '').replace(']', '').split(',');
              if (tmpArray.includes(obj.dependencyVal)) {
                obj.isVisible = true;
              }
            } else {
              obj.isVisible = obj.dependencyVal === obj.requiredVal;
            }
            obj.addListener = addListener();
            obj.elId = `input-${currentLayer}-${obj.name}-${slugify(obj.requiredVal)}`;
            obj.elDependencyId = `input-${currentLayer}-${constraintProps[1]}`;
          } else {
            alert('Villkor verkar inte vara rätt formulerat. Villkor formuleras enligt principen change:attribute:value');
          }
        } else if (obj.type === 'image') {
          obj.isVisible = true;
          obj.elId = `input-${currentLayer}-${obj.name}`;
          obj.addListener = addImageListener();
        } else {
          obj.isVisible = true;
          obj.elId = `input-${currentLayer}-${obj.name}`;
        }
        if (obj.type === 'searchList') {
          obj.searchListListener = turnIntoSearchList;
        }
        if (isBatchEdit && !('constraint' in obj)) {
          // Create an additional ckeckbox, that controls if this attribute should be changed
          // Attributes with constraints don't have their own checkbox. They are forced to change value if the dependee is checked
          // if it is configured as allowBatchEdit as well. If not, it won't change and you probaby broke some business rule.
          const batchObj = {};
          batchObj.isVisible = true;
          batchObj.title = `Ändra ${obj.title}`;
          batchObj.elId = `${obj.elId}-batch`;
          batchObj.type = 'checkbox';
          batchObj.relatedAttrId = obj.elId;
          // Hide the attribute that this checkbox is connected to so it won't be changed unless user checks the box first.
          obj.isVisible = false;
          // Inject the checkbox next to the attribute
          obj.formElement = editForm(batchObj) + editForm(obj);

          // Defer adding click handler until element exists in DOM
          batchObj.addListener = addBatchEditListener();

          batchEditBoxes.push(batchObj);
        } else {
          obj.formElement = editForm(obj);
        }
        return obj;
      });
    }

    // Create the placeholder for the related tables form
    let relatedTablesFormHTML = '';
    if (relatedtables.getConfig(layer) && !isBatchEdit) {
      relatedTablesFormHTML = `<div id="o-relatedtables-form-${currentLayer}"></div>`;
    }

    const formElement = attributeObjects.reduce((prev, next) => prev + next.formElement, '');

    let attachmentsForm = '';
    if (layer.get('attachments') && !isBatchEdit) {
      attachmentsForm = `<div id="o-attach-form-${currentLayer}"></div>`;
    }

    let form = `<div id="o-form">${formElement}${relatedTablesFormHTML}${attachmentsForm}<br><div class="o-form-save"><input id="o-save-button-${currentLayer}" type="button" value="OK" aria-label="OK"></input></div></div>`;
    if (autoCreatedFeature) {
      form = `<div id="o-form">${formElement}${relatedTablesFormHTML}${attachmentsForm}<br><div class="o-form-save"><input id="o-save-button-${currentLayer}" type="button" value="Spara" aria-label="Spara"></input><input id="o-abort-button-${currentLayer}" type="button" value="Ta bort" aria-label="Ta bort"></input></div></div>`;
      autoCreatedFeature = false;
    }

    modal = Modal({
      title: dlgTitle,
      content: form,
      static: true,
      target: viewer.getId()
    });

    // This injects the entire attachment handling which is performed independently from save, so fire and forget it sets up
    // its own callbacks and what not.
    // Lucky for us when the form is saved, that handler only looks for attributes in the attributesObjects array, so we don't
    // have to bother filter out attachment inputs.
    if (attachmentsForm) {
      const attachmentEl = document.getElementById(`o-attach-form-${currentLayer}`);
      if (editsStore.hasFeature('insert', feature, currentLayer)) {
        attachmentEl.innerHTML = `<label>${layer.get('attachments').formTitle || 'Bilagor'}</label><p>Du måste spara innan du kan lägga till bilagor.</p>`;
      } else {
        // Async fire and forget. Populates the form placeholder.
        attachmentsform(layer, feature, attachmentEl);
      }
    }

    // Get notified when form is closed in order to go back to parent form when closing a child form
    modal.on('closed', () => { onModalClosed(); });

    // Populate the related tables form now that the DOM element exists
    if (relatedTablesFormHTML) {
      const formEl = document.getElementById(`o-relatedtables-form-${currentLayer}`);
      if (editsStore.hasFeature('insert', feature, currentLayer)) {
        formEl.innerHTML = '<h3>Relaterade objekt</h3><p>Du måste spara innan du kan lägga till relaterade objekt.</p>';
      } else {
        relatedTablesForm(viewer, layer, feature, formEl);
      }
    }

    // Execute the function that need the DOM objects to operate on
    attributeObjects.forEach((obj) => {
      if ('addListener' in obj) {
        obj.addListener(obj);
      }
      if ('searchListListener' in obj) {
        // eslint-disable-next-line no-param-reassign
        obj.searchList = obj.searchListListener(obj);
      }
    });

    // Add the deferred click handlers
    batchEditBoxes.forEach((obj) => {
      if ('addListener' in obj) {
        obj.addListener(obj);
      }
    });

    onAttributesSave(features, attributeObjects);
    onAttributesAbort(features);
  }
}

function onToggleEdit(e) {
  const { detail: { tool } } = e;
  e.stopPropagation();
  if (tool === 'draw' && allowCreate) {
    if (hasDraw === false) {
      setInteractions();
      startDraw();
    } else {
      cancelDraw();
    }
  } else if (tool === 'attribute' && allowEditAttributes) {
    editAttributes();
  } else if (tool === 'delete' && allowDelete) {
    onDeleteSelected();
  } else if (tool === 'edit') {
    setEditLayer(e.detail.currentLayer);
  } else if (tool === 'cancel') {
    removeInteractions();
  } else if (tool === 'save') {
    saveFeatures();
  }
}

function onChangeEdit(e) {
  const { detail: { tool, active } } = e;
  if (tool !== 'draw' && active) {
    cancelDraw();
  }
}

/**
 * Stores the editor state and opens up a new attribute edit modal for a child object
 * @param {any} layer The child layer to edit
 * @param {any} parentFeature The parent feature that is currently edited
 * @param {any} feature The child feature to edit
 */
function editChild(layer, parentFeature, feature) {
  // Store a state of some global variables that needs to be changed when editing a child
  const newBreadcrumb = {
    modal,
    layerName: currentLayer,
    title,
    attributes,
    feature: parentFeature
  };
  breadcrumbs.push(newBreadcrumb);
  currentLayer = layer.get('name');
  // Hide parent form to keep UI clean (and avoid user closing parent modal).
  // Do not delete and recreate parent form in order to keep pending edits.
  modal.hide();
  title = layer.get('title');
  attributes = layer.get('attributes');
  editAttributes(feature);
}

/**
 * Eventhandler called from realtedTableForm when edit button is pressed
 * @param {any} e Event containing layers and features necessary
 */
function onEditChild(e) {
  editChild(e.detail.layer, e.detail.parentFeature, e.detail.feature);
}

/**
 * Eventhandler called from relatedTableForm when add button is pressed
 * @param {any} e Event containing layers and features necessary
 */
async function onAddChild(e) {
  const newfeature = new Feature();
  relatedtables.attachChild(e.detail.parentLayer, e.detail.parentFeature, e.detail.childLayer, newfeature);
  await addFeatureToLayer(newfeature, e.detail.childLayer.get('name'));
  if (autoForm) {
    editChild(e.detail.childLayer, e.detail.parentFeature, newfeature);
  } else {
    // Refresh / add to parent list. Not needed for autoform, as it will be handled when child modal closes
    refreshRelatedTablesForm(e.detail.parentFeature);
  }
}

/**
 * Opens the attribute editor dialog for a feature. The dialog excutes asynchronously and never returns anything.
 * @param {any} feature
 * @param {any} layer
 */
function editAttributesDialogApi(featureId, layerName = null) {
  const layer = viewer.getLayer(layerName);
  const feature = layer.getSource().getFeatureById(featureId);
  // Hijack the current layer for a while. If there's a modal visible it is closed (without saving) as editAttributes can not handle
  // multiple dialogs for the same layer so to be safe we always close. Technically the user can not
  // call this function when a modal is visible, as they can't click anywhere.
  // Restoring currentLayer is performed in onModalClosed(), as we can't await the modal.
  // Close all modals and eat all breadcrumbs
  closeAllModals();
  // If editing in another layer, add a breadcrumb to restore layer when modal is closed.
  if (layerName && layerName !== currentLayer) {
    const newBreadcrumb = {
      layerName: currentLayer,
      title,
      attributes
    };
    breadcrumbs.push(newBreadcrumb);
    title = layer.get('title');
    attributes = layer.get('attributes');
    // Don't call setEditLayer, as that would change tools which requires that editor is active,
    // and if it is a table it would probably crash on somehing geometry related.
    currentLayer = layerName;
  }
  editAttributes(feature);
}

/**
 * Creates a new feature and adds it to a layer. Default values are set. If autosave is set, it returns when
 * the feature has been saved and thus will have a permanent database Id. If not autosave it returns immediately (async of course) and
 * the id will be a temporary Guid that can be used until the feature is saved, then it will be replaced. Keeping a reference to the feature
 * itself will still work.
 * @param {any} layerName Name of layer to add a feature to
 * @param {any} geometry A geomtry to add to the feature that will be created
 * @returns {Feature} the newly created feature
 */
async function createFeatureApi(layerName, geometry = null) {
  const editLayer = editLayers[layerName];
  if (!editLayer) {
    throw new Error('Ej redigerbart lager');
  }
  const newfeature = new Feature();
  if (geometry) {
    if (geometry.getType() !== editLayer.get('geometryType')) {
      throw new Error('Kan inte lägga till en geometri av den typen i det lagret');
    }
    newfeature.setGeometryName(editLayer.get('geometryName'));
    newfeature.setGeometry(geometry);
  }
  await addFeatureToLayer(newfeature, layerName);
  if (autoForm) {
    autoCreatedFeature = true;
    editAttributesDialogApi(newfeature.getId(), layerName);
  }
  return newfeature;
}

async function deleteFeatureApi(featureId, layerName) {
  const feature = viewer.getLayer(layerName).getSource().getFeatureById(featureId);
  const layer = viewer.getLayer(layerName);
  await deleteFeature(feature, layer);
}

function setActiveLayerApi(layerName) {
  const layer = editLayers[layerName];
  if (!layer || layer.get('isTable')) {
    // Can't set tables as active in editor as the editor can't handle them. They are in list though, as they may
    // be edited through api
    throw new Error(`Layer ${layerName} är inte redigerbart`);
  }
  setEditLayer(layerName);
}
/**
 * Eventhandler called from relatedTableForm when delete button is pressed
 * @param { any } e Event containing layers and features necessary
 */
function onDeleteChild(e) {
  deleteFeature(e.detail.feature, e.detail.layer).then(() => refreshRelatedTablesForm(e.detail.parentFeature));
}

/**
 * Creates the handler. It is used as sort of a singelton, but in theory there could be many handlers.
 * It communicates with the editor toolbar and forms using DOM events, which makes it messy to have more than one instance as they would use the same events.
 * @param {any} options
 * @param {any} v The viewer object
 */
export default function editHandler(options, v) {
  viewer = v;
  featureInfo = viewer.getControlByName('featureInfo');
  if (options.featureList) {
    infowindowCmp = Infowindow({ viewer, type: 'floating', title: 'Välj objekt' });
    infowindowCmp.render();
  }
  map = viewer.getMap();
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;

  // set edit properties for editable layers
  editLayers = setEditProps(options);
  editableLayers.forEach((layerName) => {
    verifyLayer(layerName);
    if (layerName === currentLayer && options.isActive) {
      dispatcher.emitEnableInteraction();
      setEditLayer(layerName);
    }
  });

  autoSave = options.autoSave;
  autoForm = options.autoForm;
  validateOnDraw = options.validateOnDraw;

  // Listen to DOM events from menus and forms
  document.addEventListener('toggleEdit', onToggleEdit);
  document.addEventListener('changeEdit', onChangeEdit);
  document.addEventListener('editorShapes', onChangeShape);
  document.addEventListener('customDrawEnd', onCustomDrawEnd);
  document.addEventListener(dispatcher.EDIT_CHILD_EVENT, onEditChild);
  document.addEventListener(dispatcher.ADD_CHILD_EVENT, onAddChild);
  document.addEventListener(dispatcher.DELETE_CHILD_EVENT, onDeleteChild);

  return {
    // These functions are called from Editor Component, possibly from its Api so change these calls with caution.
    createFeature: createFeatureApi,
    editAttributesDialog: editAttributesDialogApi,
    deleteFeature: deleteFeatureApi,
    setActiveLayer: setActiveLayerApi
  };
}
