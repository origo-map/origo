"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var modal = require('../modal');
var featureInfo = require('../featureinfo');
var editsStore = require('./editsstore')();
var generateUUID = require('../utils/generateuuid');
var transactionHandler = require('./transactionhandler');
var dispatcher = require('./editdispatcher');
var editForm = require('./editform');
var shapes = require('./shapes');

var editLayers = {};
var autoSave = undefined;
var editSource = undefined;
var geometryType = undefined;
var geometryName = undefined;
var map = undefined;
var currentLayer = undefined;
var editableLayers = undefined;
var attributes = undefined;
var title = undefined;
var draw = undefined;
var hasDraw = undefined;
var hasAttribute = undefined;
var hasSnap = undefined;
var select = undefined;
var modify = undefined;
var snap = undefined;
var tools = undefined;

module.exports = function(options) {
  map = viewer.getMap();
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;
  tools = options.drawTools || [];

  //set edit properties for editable layers
  editLayers = setEditProps(options);
  editableLayers.forEach(function(layerName) {
    var layer = viewer.getLayer(layerName);
    verifyLayer(layerName);
    if (layerName === currentLayer && options.isActive) {
      dispatcher.emitEnableInteraction();
      setEditLayer(layerName);
    }
  });

  autoSave = options.autoSave;
  $(document).on('toggleEdit', onToggleEdit);
  $(document).on('changeEdit', onChangeEdit);
  $(document).on('editorShapes', onChangeShape);
}

function setEditLayer(layerName) {
  currentLayer = layerName;
  setInteractions();
}

function setInteractions(drawType) {
  var editLayer = editLayers[currentLayer];
  var drawOptions;
  editSource = editLayer.getSource();
  attributes = editLayer.get('attributes');
  title = editLayer.get('title') || 'Information';
  drawOptions = {
    source: editSource,
    type: editLayer.get('geometryType'),
    geometryName: editLayer.get('geometryName')
  };
  if (drawType) {
    $.extend(drawOptions, shapes(drawType));
  }
  removeInteractions();
  draw = new ol.interaction.Draw(drawOptions);
  hasDraw = false;
  hasAttribute = false;
  select = new ol.interaction.Select({
    layers: [editLayer]
  });
  modify = new ol.interaction.Modify({
    features: select.getFeatures()
  });
  map.addInteraction(select);
  map.addInteraction(modify);
  map.addInteraction(draw);
  modify.on('modifyend', onModifyEnd, this);
  draw.on('drawend', onDrawEnd, this);
  setActive();

  //If snap should be active then add snap internactions for all snap layers
  hasSnap = editLayer.get('snap');
  if (hasSnap) {
    var selectionSource = featureInfo.getSelectionLayer().getSource();
    var snapSources = editLayer.get('snapLayers') ? getSnapSources(editLayer.get('snapLayers')) : [editLayer.get('source')];
    snapSources.push(selectionSource);
    snap = addSnapInteraction(snapSources);
  }
}

function verifyLayer(layerName) {
  if (!(editLayers[layerName].get('geometryType'))) {
    addFeatureAddListener(layerName);
  }
}

function setGeometryProps(layer) {
  var layerName = layer.get('name');
  editLayers[layerName].set('geometryType', layer.getSource().getFeatures()[0].getGeometry().getType());
  if (layerName === currentLayer) {
    setEditLayer(layerName);
  }
}

function addFeatureAddListener(layerName) {
  var layer = viewer.getLayer(layerName);
  layer.getSource().once('addfeature', function(e) {
    setGeometryProps(layer);
  });
}

function setEditProps(options) {
  var initialValue = {};
  var result = editableLayers.reduce(function(layerProps, layerName) {
    var layer = viewer.getLayer(layerName);
    var snap = options.hasOwnProperty('snap') ? options.snap : true;
    var snapLayers = options.snapLayers || editableLayers;
    layer.set('snap', snap);
    layer.set('snapLayers', snapLayers);
    layerProps[layerName] = layer;
    return layerProps;
  }, initialValue);
  return result;
}

function isActive() {
  if (modify === undefined || select === undefined) {
    return false;
  } else {
    return true;
  }
}

function onDeleteSelected() {
  var features = select.getFeatures();

  // Make sure all features are loaded in the source
  editSource = editLayers[currentLayer].getSource();
  if (features.getLength() === 1) {
    var feature = features.item(0);
    var r = confirm('Är du säker på att du vill ta bort det här objektet?');
    if (r === true) {
      saveFeature({
        feature: feature,
        layerName: currentLayer,
        action: 'delete'
      });
      select.getFeatures().clear();
      editSource.removeFeature(editSource.getFeatureById(feature.getId()));
    }
  }
}

function onModifyEnd(evt) {
  var feature = evt.features.item(0);
  saveFeature({
    feature: feature,
    layerName: currentLayer,
    action: 'update'
  });
}

function onDrawEnd(evt) {
  var feature = evt.feature;
  var layer = viewer.getLayer(currentLayer);
  var attributes = getDefaultValues(layer.get('attributes'));
  feature.setProperties(attributes);
  feature.setId(generateUUID());
  editSource.addFeature(feature);
  setActive();
  hasDraw = false;
  saveFeature({
    feature: feature,
    layerName: currentLayer,
    action: 'insert'
  });
  dispatcher.emitChangeEdit('draw', false);
}

function cancelDraw() {
  setActive();
  hasDraw = false;
  dispatcher.emitChangeEdit('draw', false);
}

function onChangeShape(e) {
  setInteractions(e.shape);
  startDraw();
}

function cancelAttribute() {
  modal.closeModal();
  dispatcher.emitChangeEdit('attribute', false);
}

function onAttributesSave(feature, attributes) {
  $('#o-save-button').on('click', function(e) {
    var editEl = {};

    //Read values from form
    attributes.forEach(function(attribute) {

      //Get the input container class
      var containerClass = '.' + attribute.elId.slice(1);

      // If hidden element it should be excluded
      if ($(containerClass).hasClass('o-hidden') === false) {

        //Check if checkbox. If checkbox read state.
        if ($(attribute.elId).attr('type') === 'checkbox') {
          editEl[attribute.name] = $(attribute.elId).is(':checked') ? 1 : 0;
        }

        //Read value from input text, textarea or select
        else {
          editEl[attribute.name] = $(attribute.elId).val();
        }
      }
    });

    modal.closeModal();
    attributesSaveHandler(feature, editEl);
    $('#o-save-button').blur();
    e.preventDefault();
  });
}

function attributesSaveHandler(feature, formEl) {

  //get DOM values and set attribute values to feature
  attributes.forEach(function(attribute) {
    if (formEl.hasOwnProperty(attribute.name)) {
      feature.set(attribute.name, formEl[attribute.name]);
    }
  });
  saveFeature({
    feature: feature,
    layerName: currentLayer,
    action: 'update'
  });
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    if (snap) {
      snap.forEach(function(snapInteraction) {
        map.removeInteraction(snapInteraction);
      });
    }

    modify = undefined;
    select = undefined;
    draw = undefined;
    snap = undefined;
  }
}

function startDraw() {
  if (hasDraw !== true && isActive()) {
    setActive('draw');
    hasDraw = true;
    dispatcher.emitChangeEdit('draw', true);
  }
}

function addListener() {
  var fn = function(obj) {
    $(obj.elDependencyId).on(obj.eventType, function(e) {
      var containerClass = '.' + obj.elId.slice(1);
      if ($(obj.elDependencyId + (' option:selected')).text() === obj.requiredVal) {
        $(containerClass).removeClass('o-hidden');
      } else {
        $(containerClass).addClass('o-hidden');
      }
    });
  }
  return fn;
}

function onToggleEdit(e) {
  e.stopPropagation();
  if (e.tool === 'draw') {
    if (hasDraw === false) {
      setInteractions();
      startDraw();
    } else {
      cancelDraw();
    }
  } else if (e.tool === 'attribute') {
    if (hasAttribute === false) {
      editAttributes();
    } else {
      cancelAttribute();
    }
  } else if (e.tool === 'delete') {
      onDeleteSelected();
  } else if (e.tool === 'edit') {
      setEditLayer(e.currentLayer);
  } else if (e.tool === 'cancel') {
      removeInteractions();
  } else if (e.tool === 'save') {
      saveFeatures();
  }
}

function onChangeEdit(e) {
  if (e.tool!== 'draw' && e.active) {
    cancelDraw();
  }
}

function getSnapSources(layers) {
  var sources = layers.map(function(layer) {
    return viewer.getLayer(layer).getSource();
  });

  return sources;
}

function addSnapInteraction(sources) {
  var snapInteractions = [];
  sources.forEach(function(source) {
    var interaction = new ol.interaction.Snap({
      source: source
    });
    snapInteractions.push(interaction);
    map.addInteraction(interaction);
  });
  return snapInteractions;
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
    default:
      draw.setActive(false);
      hasDraw = false;
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function editAttributes() {
  var attributeObjects;

  //Get attributes from selected feature and fill DOM elements with the values
  var features = select.getFeatures();
  if (features.getLength() === 1) {
    dispatcher.emitChangeEdit('attribute', true);
    var feature = features.item(0);
    if (attributes.length > 0) {

      //Create an array of defined attributes and corresponding values from selected feature
      attributeObjects = attributes.map(function(attributeObject) {
        var obj = {};
        $.extend(obj, attributeObject);
        obj.val = feature.get(obj.name) || '';
        if (obj.hasOwnProperty('constraint')) {
          var constraintProps = obj.constraint.split(':');
          if (constraintProps.length === 3) {
            obj.eventType = constraintProps[0];
            obj.dependencyVal = feature.get(constraintProps[1]);
            obj.requiredVal = constraintProps[2];
            obj.dependencyVal === obj.requiredVal ? obj.isVisible = true : obj.isVisible = false;
            obj.addListener = addListener();
            obj.elId = '#input-' + obj.name + '-' + obj.requiredVal;
            obj.elDependencyId = '#input-' + constraintProps[1];
          } else {
            alert('Villkor verkar inte vara rätt formulerat. Villkor formuleras enligt principen change:attribute:value');
          }
        } else {
          obj.isVisible = true;
          obj.elId = '#input-' + obj.name;
        }

        obj.formElement = editForm(obj);
        return obj;
      });

    }
    var formElement = attributeObjects.reduce(function(prev, next) {
      return prev + next.formElement;
    }, '');
    var form = '<form>' + formElement + '<br><div class="o-form-save"><input id="o-save-button" type="button" value="Ok"></input></div></form>';
    modal.createModal('#o-map', {
      title: title,
      content: form,
      static: true
    });
    modal.showModal();

    attributeObjects.forEach(function(obj) {
      if (obj.hasOwnProperty('addListener')) {
        obj.addListener(obj);
      }
    });

    onAttributesSave(feature, attributeObjects);
  }
}

function saveFeature(change) {
  dispatcher.emitChangeFeature(change);
  if (autoSave) {
    saveFeatures(change);
  }
}

function saveFeatures() {
  var edits = editsStore.getEdits();
  var layerNames = Object.getOwnPropertyNames(edits);
  layerNames.forEach(function(layerName) {
    var transaction = {
      insert: null,
      delete: null,
      update: null
    };
    var editTypes = Object.getOwnPropertyNames(edits[layerName]);
    editTypes.forEach(function(editType) {
      var layer = viewer.getLayer(layerName);
      var ids = edits[layerName][editType];
      var features;
      features = getFeaturesByIds(editType, layer, ids);
      if (features.length) {
        transaction[editType] = features;
      }
    });

    transactionHandler(transaction, layerName);
  });
}

function getFeaturesByIds(type, layer, ids) {
  var source = layer.getSource();
  var features = [];
  if (type === 'delete') {
    ids.forEach(function(id) {
      var dummy = new ol.Feature();
      dummy.setId(id);
      features.push(dummy);
    });
  } else {
    ids.forEach(function(id) {
      if (source.getFeatureById(id)) {
        features.push(source.getFeatureById(id));
      }
    });
  }

  return features;
}

function getDefaultValues(attributes) {
  return attributes.filter(function(attribute) {
      if (attribute.name && attribute.defaultValue) {
        return attribute;
      }
    })
    .reduce(function(prev, curr) {
      prev[curr.name] = curr.defaultValue
      return prev;
    },{});
}
