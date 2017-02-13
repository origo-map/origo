/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var modal = require('../modal');
var featureInfo = require('../featureinfo');
var editsStore = require('./editsstore')();
var generateUUID = require('../utils/generateuuid');
var transactionHandler = require('./transactionhandler')();
var dispatcher = require('./editdispatcher');

var autoSave = undefined;
var editSource = undefined;
var geometryType = undefined;
var geometryName = undefined;
var map = undefined;
var currentLayer = undefined;
var attributes = undefined;
var title = undefined;
var draw = undefined;
var hasDraw = undefined;
var hasAttribute = undefined;
var hasSnap = undefined;
var select = undefined;
var modify = undefined;
var snap = undefined;

module.exports = function(options) {
  autoSave = options.autoSave;
  $(document).on('toggleEdit', toggleEdit);
}

function setEditLayer(options) {
  removeInteractions();
  editSource = options.source;
  geometryType = options.geometryType;
  geometryName = options.geometryName;
  map = options.map;
  currentLayer = options.layerName;
  attributes = options.attributes;
  title = options.title;
  draw = new ol.interaction.Draw({
    source: editSource,
    'type': geometryType,
    geometryName: geometryName
  });
  hasDraw = false;
  hasAttribute = false;
  select = new ol.interaction.Select({
    layers: [options.editableLayer]
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
  hasSnap = options.hasOwnProperty('snap') ? options.snap : true;
  if (hasSnap) {
    var selectionSource = featureInfo.getSelectionLayer().getSource();
    var snapSources = options.snapLayers ? getSnapSources(options.snapLayers) : [editSource];
    snapSources.push(selectionSource);
    snap = addSnapInteraction(snapSources);
  }
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
  if (features.getLength() === 1) {
    var feature = features.item(0);
    var r = confirm("Är du säker på att du vill ta bort det här objektet?");
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

function onSelectAdd(evt) {
  var feature = evt.element;
    feature.getGeometry().on('change', function(e) {
      saveFeature({
        feature: editSource.getFeatureById(feature.getId()),
        layerName: currentLayer,
        action: 'update'
      });
    }, this);
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
    snap.forEach(function(snapInteraction) {
      map.removeInteraction(snapInteraction);
    });
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

function toggleEdit(e) {
  e.stopPropagation();
  if (e.tool === 'draw') {
    if (hasDraw === false) {
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
      setEditLayer(e.options);
  } else if (e.tool === 'cancel') {
      removeInteractions();
  } else if (e.tool === 'save') {
      saveFeatures();
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

  //Get attributes from selected feature and fill DOM elements with the values
  var features = select.getFeatures();
  if (features.getLength() === 1) {
    dispatcher.emitChangeEdit('attribute', true);
    var feature = features.item(0);
    if (attributes.length > 0) {

      //Create an array of defined attributes and corresponding values from selected feature
      var attributeObjects = attributes.map(function(attributeObject) {
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
            alert('Constraint properties are not written correct, it should written as for example change:attribute:value');
          }
        } else {
          obj.isVisible = true;
          obj.elId = '#input-' + obj.name;
        }
        obj.formElement = createForm(obj);
        return obj;
      });

    }
    var formElement = attributeObjects.reduce(function(prev, next) {
      return prev + next.formElement;
    }, '');
    var form = '<form>' + formElement + '<br><div class="o-form-save"><input id="o-save-button" type="button" value="Spara"></input></div></form>';
    modal.createModal('#o-map', {
      title: title,
      content: form
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

function createForm(obj) {
  var id = obj.elId.slice(1);
  var cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? "" : " o-hidden";
  var label = obj.title;
  var val = obj.isVisible ? obj.val : '';
  var type = obj.type;
  var maxLength = obj.maxLength ? ' maxlength="' + obj.maxLength + '" ' : '';
  var dropdownOptions = obj.options || [];
  var el;
  switch (type) {
    case 'text':
      el = '<div><label>' + label + '</label><br><input type="text" id="' + id + '" value="' + val + '"' + maxLength + '></div>';
      break;
    case 'textarea':
      el = '<div><label>' + label + '</label><br><textarea id="' + id + '"' + maxLength + 'rows="3">' + val + '</textarea></div>';
      break;
    case 'checkbox':
      var checked = val === true ? ' checked' : '';
      el = '<div class="o-form-checkbox"><label>' + label + '</label><input type="checkbox" id="' + id + '" value="' + val + '"' + checked + '></div>';
      break;
    case 'dropdown':
      var firstOption;
      if (val) {
        firstOption = '<option value="' + val + '" selected>' + val + '</option>';
      } else {
        firstOption = '<option value="" selected>Välj</option>';
      }
      el = '<div class="' + cls + '"><label>' + label + '</label><br><select id=' + id + '>' + firstOption;
      for (var i = 0; i < dropdownOptions.length; i++) {
        el += '<option value="' + dropdownOptions[i] + '">' + dropdownOptions[i] + '</option>';
      }
      el += '</select></div>';
      break;
  }
  return el;
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
      features = getFeaturesByIds(editType,layer,ids);
      if (features.length) {
        transaction[editType] = features;
      }
    });
    transactionHandler.wfsTransaction(transaction, layerName);
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
