import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { LineString } from 'ol/geom';
import { noModifierKeys } from 'ol/events/condition';
import { Modal } from '../../ui';
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

const editsStore = store();
let editLayers = {};
let autoSave;
let autoForm;
let editSource;
let map;
let currentLayer;
let editableLayers;
let attributes;
let title;
let draw;
let hasDraw;
let hasAttribute;
let hasSnap;
let select;
let modify;
let snap;
let viewer;
let featureInfo;
let modal;
let sList;
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

function isActive() {
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
      draw.setActive(false);
      hasDraw = false;
      if (modify) modify.setActive(true);
      select.setActive(true);
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

function getDefaultValues(attrs) {
  return attrs.filter(attribute => attribute.name && attribute.defaultValue)
    .reduce((prev, curr) => {
      const previous = prev;
      previous[curr.name] = curr.defaultValue;
      return previous;
    }, {});
}

function getSnapSources(layers) {
  return layers.map(layer => viewer.getLayer(layer).getSource());
}

function saveFeatures() {
  const edits = editsStore.getEdits();
  const layerNames = Object.getOwnPropertyNames(edits);
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
        // Remove attributes added by attachments before saving.
        const attachmentsConfig = layer.get('attachments');
        if (attachmentsConfig && attachmentsConfig.groups) {
          features.forEach(feat => {
            attachmentsConfig.groups.forEach(g => {
              feat.unset(g.linkAttribute);
              feat.unset(g.fileNameAttribute);
            });
          });
        }
        transaction[editType] = features;
      }
    });

    transactionHandler(transaction, layerName, viewer);
  });
}

/**
 * Adds changed feature to the editstore and if config parameter autoSave is set, also triggers a transaction.
 * @param {any} change The feature and change type
 * @param {any} ignoreAutoSave Optional argument that overrides autoSave configuration parameter. Used to prevent numerous transactions in batch mode.
 */
function saveFeature(change, ignoreAutoSave) {
  dispatcher.emitChangeFeature(change);
  if (autoSave && !ignoreAutoSave) {
    saveFeatures(change);
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

//

/**
 * Helper for adding new features. Typically called from various eventhandlers
 * @param {Feature} feature The feature to add.
 */
function addFeature(feature) {
  const layer = viewer.getLayer(currentLayer);
  const defaultAttributes = getDefaultValues(layer.get('attributes'));
  feature.setProperties(defaultAttributes);
  feature.setId(generateUUID());
  editSource.addFeature(feature);
  setActive();
  hasDraw = false;
  saveFeature({
    feature,
    layerName: currentLayer,
    action: 'insert'
  });
  dispatcher.emitChangeEdit('draw', false);
  if (autoForm) {
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
  editSource = editLayer.getSource();
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
  hasAttribute = false;
  select = new Select({
    layers: [editLayer]
  });
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

function setEditLayer(layerName) {
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

function onDeleteSelected() {
  const features = select.getFeatures();

  // Make sure all features are loaded in the source
  editSource = editLayers[currentLayer].getSource();
  if (features.getLength() === 1) {
    const feature = features.item(0);
    const r = window.confirm('Är du säker på att du vill ta bort det här objektet?');
    if (r === true) {
      saveFeature({
        feature,
        layerName: currentLayer,
        action: 'delete'
      });
      select.getFeatures().clear();
      editSource.removeFeature(editSource.getFeatureById(feature.getId()));
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

function cancelAttribute() {
  modal.closeModal();
  dispatcher.emitChangeEdit('attribute', false);
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
 * Sets up an eventlistener on the attribute editor form save button.
 * @param {Collection} features The features that should be updated
 * @param {any} attrs Array of attributes whih values to set
 */
function onAttributesSave(features, attrs) {
  document.getElementById('o-save-button').addEventListener('click', (e) => {
    const editEl = {};
    const valid = {};
    const fileReaders = [];
    attrs.forEach((attribute) => {
      // Get the input container class
      const containerClass = `.${attribute.elId}`;
      // Get the input attributes
      const inputType = document.getElementById(attribute.elId).getAttribute('type');
      const inputValue = document.getElementById(attribute.elId).value;
      const inputName = document.getElementById(attribute.elId).getAttribute('name');
      const inputId = document.getElementById(attribute.elId).getAttribute('id');
      const inputRequired = document.getElementById(attribute.elId).getAttribute('required');

      // If hidden element it should be excluded
      // By sheer luck, this prevents attributes to be changed in batch edit mode when checkbox is not checked.
      // If this code is changed, it may be necessary to excplict check if the batch edit checkbox is checked for this attribute.
      if (!document.querySelector(containerClass) || document.querySelector(containerClass).classList.contains('o-hidden') === false) {
        // Check if checkbox. If checkbox read state.
        if (inputType === 'checkbox') {
          editEl[attribute.name] = document.getElementById(attribute.elId).checked ? 1 : 0;
        } else { // Read value from input text, textarea or select
          editEl[attribute.name] = inputValue;
        }
      }
      // Check if file. If file, read and trigger resize
      if (inputType === 'file') {
        const input = document.getElementById(attribute.elId);
        const file = input.files[0];

        if (file) {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            getImageOrientation(file, (orientation) => {
              imageresizer(fileReader.result, attribute, orientation, (resized) => {
                editEl[attribute.name] = resized;
                const imageresized = new CustomEvent('imageresized');
                document.dispatchEvent(imageresized);
              });
            });
          };

          fileReader.readAsDataURL(file);
          fileReaders.push(fileReader);
        } else {
          editEl[attribute.name] = document.getElementById(attribute.elId).getAttribute('value');
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
          valid.datetime = validate.datetime(inputValue) ? inputValue : false;
          if (!valid.datetime) {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'date':
          valid.date = validate.date(inputValue) ? inputValue : false;
          if (!valid.date && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'time':
          valid.time = validate.time(inputValue) ? inputValue : false;
          if (!valid.time) {
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
        case 'searchList':
          if (attribute.required || false) {
            const { list } = attribute;
            valid.searchList = validate.searchList(inputValue, list) || inputValue === '' ? inputValue : false;
            if (!valid.searchList && inputValue !== '') {
              errorOn.parentElement.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            } else if (errorMsg) {
              errorMsg.remove();
            }
          } else {
            valid.searchList = true;
          }
          break;
        default:
      }
      valid.validates = !Object.values(valid).includes(false);
    });

    // If valid, continue
    if (valid.validates) {
      if (fileReaders.length > 0 && fileReaders.every(reader => reader.readyState === 1)) {
        document.addEventListener('imageresized', () => {
          attributesSaveHandler(features, editEl);
        });
      } else {
        attributesSaveHandler(features, editEl);
      }

      document.getElementById('o-save-button').blur();
      modal.closeModal();
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

function addImageListener() {
  const fn = (obj) => {
    const fileReader = new FileReader();
    const containerClass = `.${obj.elId}`;
    document.querySelector(`#${obj.elId}`).addEventListener('change', (ev) => {
      if (ev.target.files && ev.target.files[0]) {
        document.querySelector(`${containerClass} img`).classList.remove('o-hidden');
        document.querySelector(`${containerClass} input[type=button]`).classList.remove('o-hidden');
        fileReader.onload = (e) => {
          document.querySelector(`${containerClass} img`).setAttribute('src', e.target.result);
        };
        fileReader.readAsDataURL(ev.target.files[0]);
      }
    });

    document.querySelector(`${containerClass} input[type=button]`).addEventListener('click', (e) => {
      document.getElementById(obj.elId).setAttribute('value', '');
      document.getElementById(obj.elId).value = '';
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
    // Filter out attributes created from attachments. Actually can produce false positives if name is not set, but that is handled in the next row
    // as name is required for editable attributes (although not specified in the docs, but needed to create the input)
    const isAttachment = attachmentsConfig && attachmentsConfig.groups.some(g => g.linkAttribute === attr.name || g.fileNameAttribute === attr.name);
    return attr.name && (!isBatchEdit || (isBatchEdit && attr.allowBatchEdit)) && !isAttachment;
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
        obj.val = feature.get(obj.name) !== undefined ? feature.get(obj.name) : '';
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
            obj.elId = `input-${obj.name}-${slugify(obj.requiredVal)}`;
            obj.elDependencyId = `input-${constraintProps[1]}`;
          } else {
            alert('Villkor verkar inte vara rätt formulerat. Villkor formuleras enligt principen change:attribute:value');
          }
        } else if (obj.type === 'image') {
          obj.isVisible = true;
          obj.elId = `input-${obj.name}`;
          obj.addListener = addImageListener();
        } else {
          obj.isVisible = true;
          obj.elId = `input-${obj.name}`;
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

    const formElement = attributeObjects.reduce((prev, next) => prev + next.formElement, '');

    let attachmentsForm = '';
    if (layer.get('attachments') && !isBatchEdit) {
      attachmentsForm = `<div id="o-attach-form-${currentLayer}"></div>`;
    }
    const form = `<div id="o-form">${formElement}${attachmentsForm}<br><div class="o-form-save"><input id="o-save-button" type="button" value="Ok"></input></div></div>`;

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

    attributeObjects.forEach((obj) => {
      if ('addListener' in obj) {
        obj.addListener(obj);
      }
    });

    // Add the deferred click handlers
    batchEditBoxes.forEach((obj) => {
      if ('addListener' in obj) {
        obj.addListener(obj);
      }
    });

    onAttributesSave(features, attributeObjects);
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
    if (hasAttribute === false) {
      editAttributes();
      sList = sList || new searchList();
    } else {
      cancelAttribute();
    }
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

export default function editHandler(options, v) {
  viewer = v;
  featureInfo = viewer.getControlByName('featureInfo');
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
  document.addEventListener('toggleEdit', onToggleEdit);
  document.addEventListener('changeEdit', onChangeEdit);
  document.addEventListener('editorShapes', onChangeShape);
  document.addEventListener('customDrawEnd', onCustomDrawEnd);
}
