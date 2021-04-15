import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
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
      modify.setActive(true);
      select.setActive(false);
      break;
    case 'custom':
      draw.setActive(false);
      modify.setActive(false);
      select.setActive(false);
      break;
    default:
      draw.setActive(false);
      hasDraw = false;
      modify.setActive(true);
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
        transaction[editType] = features;
      }
    });

    transactionHandler(transaction, layerName, viewer);
  });
}

function saveFeature(change) {
  dispatcher.emitChangeFeature(change);
  if (autoSave) {
    saveFeatures(change);
  }
}

function onModifyEnd(evt) {
  const feature = evt.features.item(0);
  saveFeature({
    feature,
    layerName: currentLayer,
    action: 'update'
  });
}

// Helper for adding new features. Typically called from various eventhandlers
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
  addFeature(evt.feature);
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

function setInteractions(drawType) {
  const editLayer = editLayers[currentLayer];
  editSource = editLayer.getSource();
  attributes = editLayer.get('attributes');
  title = editLayer.get('title') || 'Information';
  const drawOptions = {
    source: editSource,
    type: editLayer.get('geometryType'),
    geometryName: editLayer.get('geometryName')
  };
  if (drawType) {
    Object.assign(drawOptions, shapes(drawType));
  }
  removeInteractions();
  draw = new Draw(drawOptions);
  hasDraw = false;
  hasAttribute = false;
  select = new Select({
    layers: [editLayer]
  });
  modify = new Modify({
    features: select.getFeatures()
  });
  map.addInteraction(select);
  map.addInteraction(modify);
  map.addInteraction(draw);
  modify.on('modifyend', onModifyEnd, this);
  draw.on('drawend', onDrawEnd, this);
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

function attributesSaveHandler(feature, formEl) {
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
  });
}

function onAttributesSave(feature, attrs) {
  document.getElementById('o-save-button').addEventListener('click', (e) => {
    const editEl = {};
    const valid = {};
    const fileReaders = [];

    // Read values from form
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
          valid.datetime = validate.datetime(inputValue) && inputValue.length === 19 ? inputValue : false;
          if (!valid.datetime) {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'date':
          valid.date = validate.date(inputValue) && inputValue.length === 10 ? inputValue : false;
          if (!valid.date && inputValue !== '') {
            if (!errorMsg) {
              errorOn.insertAdjacentHTML('afterend', `<div class="o-${inputId} errorMsg fade-in padding-bottom-small">${errorText}</div>`);
            }
          } else if (errorMsg) {
            errorMsg.remove();
          }
          break;
        case 'time':
          valid.time = validate.time(inputValue) && inputValue.length === 8 ? inputValue : false;
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
          attributesSaveHandler(feature, editEl);
        });
      } else {
        attributesSaveHandler(feature, editEl);
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
      if (document.getElementById(obj.elDependencyId).value === obj.requiredVal) {
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

function editAttributes(feat) {
  let feature = feat;
  let attributeObjects;
  let features;

  // Get attributes from the created, or the selected, feature and fill DOM elements with the values
  if (feature) {
    features = new Collection();
    features.push(feature);
  } else {
    features = select.getFeatures();
  }
  if (features.getLength() === 1) {
    dispatcher.emitChangeEdit('attribute', true);
    feature = features.item(0);
    if (attributes.length > 0) {
      // Create an array of defined attributes and corresponding values from selected feature
      attributeObjects = attributes.map((attributeObject) => {
        const obj = {};
        Object.assign(obj, attributeObject);
        obj.val = feature.get(obj.name) !== undefined ? feature.get(obj.name) : '';
        if ('constraint' in obj) {
          const constraintProps = obj.constraint.split(':');
          if (constraintProps.length === 3) {
            obj.eventType = constraintProps[0];
            obj.dependencyVal = feature.get(constraintProps[1]);
            obj.requiredVal = constraintProps[2];
            obj.isVisible = obj.dependencyVal === obj.requiredVal;
            obj.addListener = addListener();
            obj.elId = `input-${obj.name}-${obj.requiredVal}`;
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

        obj.formElement = editForm(obj);
        return obj;
      });
    }

    const formElement = attributeObjects.reduce((prev, next) => prev + next.formElement, '');
    const form = `<div id="o-form">${formElement}<br><div class="o-form-save"><input id="o-save-button" type="button" value="Ok"></input></div></div>`;

    modal = Modal({
      title,
      content: form,
      static: true,
      target: viewer.getId()
    });

    attributeObjects.forEach((obj) => {
      if ('addListener' in obj) {
        obj.addListener(obj);
      }
    });

    onAttributesSave(feature, attributeObjects);
  }
}

function onToggleEdit(e) {
  const { detail: { tool } } = e;
  e.stopPropagation();
  if (tool === 'draw') {
    if (hasDraw === false) {
      setInteractions();
      startDraw();
    } else {
      cancelDraw();
    }
  } else if (tool === 'attribute') {
    if (hasAttribute === false) {
      editAttributes();
      sList = sList || new searchList();
    } else {
      cancelAttribute();
    }
  } else if (tool === 'delete') {
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
  document.addEventListener('toggleEdit', onToggleEdit);
  document.addEventListener('changeEdit', onChangeEdit);
  document.addEventListener('editorShapes', onChangeShape);
  document.addEventListener('customDrawEnd', onCustomDrawEnd);
}
