/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');
var modal = require('./modal');
var featureInfo = require('./featureinfo');

var srsName = undefined;
var editSource = undefined;
var geometryType = undefined;
var geometryName = undefined;
var url = undefined;
var map = undefined;
var featureNS = undefined;
var featureType = undefined;
var attributes = undefined;
var title = undefined;
var draw = undefined;
var hasDraw = undefined;
var hasAttribute = undefined;
var hasSnap = undefined;
var select = undefined;
var modify = undefined;
var snap = undefined;
var dirty = undefined;
var format = undefined;
var serializer = undefined;

module.exports = function() {
  $(document).on('toggleEdit', toggleEdit);
}

function setEditLayer(options) {
  removeInteractions();
  srsName = options.srsName;
  editSource = options.source;
  geometryType = options.geometryType;
  geometryName = options.geometryName;
  url = options.url;
  map = options.map;
  featureNS = options.featureNS;
  featureType = options.featureType;
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
  select.getFeatures().on('add', onSelectAdd, this);
  select.getFeatures().on('remove', onSelectRemove, this);
  dirty = {};
  map.addInteraction(select);
  map.addInteraction(modify);
  map.addInteraction(draw);
  format = new ol.format.WFS();
  serializer = new XMLSerializer();
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

function emitChangeEdit(tool, state) {
  $.event.trigger({
    type: 'changeEdit',
    tool: tool,
    active: state
  });
}

function createForm(obj) {
  var id = obj.elId.slice(1);
  var cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? "" : " hidden";
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

function deleteSelected() {
  var features = select.getFeatures();
  if (features.getLength() === 1) {
    var feature = features.item(0);
    var r = confirm("Är du säker på att du vill ta bort det här objektet?");
    if (r === true) {
      var node = format.writeTransaction(null, null, [feature], {
        featureNS: featureNS,
        featureType: featureType
      });
      $.ajax({
        type: "POST",
        url: url,
        data: serializer.serializeToString(node),
        contentType: 'text/xml',
        success: function(data) {
          var result = readResponse(data);
          if (result) {
            if (result.transactionSummary.totalDeleted === 1) {
              select.getFeatures().clear();
              editSource.removeFeature(feature);
            } else {
              alert("There was an issue deleting the feature.");
            }
          }
        },
        context: this
      });
    }
  }
}

function editAttributes() {

  //Get attributes from selected feature and fill DOM elements with the values
  var features = select.getFeatures();
  if (features.getLength() === 1) {
    emitChangeEdit('attribute', true);
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

function getSelect() {
  return select;
}

function onSelectAdd(evt) {
  var feature = evt.element;
  var fid = feature.getId();
  feature.on('change', function(evt) {
    dirty[evt.target.getId()] = true;
  }, this);
}

function onSelectRemove(evt) {
  var feature = evt.element;
  var fid = feature.getId();
  if (dirty[fid]) {

    // do a WFS transaction to update the geometry
    var properties = feature.getProperties();

    // get rid of bbox which is not a real property
    delete properties.bbox;
    var clone = new ol.Feature(properties);
    clone.setId(fid);
    var node = format.writeTransaction(null, [clone], null, {
      gmlOptions: {
        srsName: srsName
      },
      featureNS: featureNS,
      featureType: featureType
    });
    $.ajax({
      type: "POST",
      url: url,
      data: serializer.serializeToString(node),
      contentType: 'text/xml',
      success: function(data) {
        var result = readResponse(data);
        if (result && result.transactionSummary.totalUpdated === 1) {
          delete dirty[fid];
        }
      },
      context: this
    });
  }
}

function onDrawEnd(evt) {
  var feature = evt.feature;
  var node = format.writeTransaction([feature], null, null, {
    gmlOptions: {
      srsName: srsName
    },
    featureNS: featureNS,
    featureType: featureType
  });
  $.ajax({
    type: "POST",
    url: url,
    data: serializer.serializeToString(node),
    contentType: 'text/xml',
    success: function(data) {
      var result = readResponse(data);
      if (result) {
        var insertId = result.insertIds[0];
        if (insertId === 'new0') {

          // reload data if we're dealing with a shapefile store
          editSource.clear();
        } else {
          feature.setId(insertId);
        }
      }
      setActive();
      hasDraw = false;
    },
    error: function(e) {
      setActive();
      hasDraw = false;
      var errorMsg = e ? (e.status + ' ' + e.statusText) : "";
      alert('Error saving this feature to the server...<br><br>' +
        errorMsg);
    },
    context: this
  });
  emitChangeEdit('draw', false);
}

function cancelDraw() {
  setActive();
  hasDraw = false;
  emitChangeEdit('draw', false);
}

function cancelAttribute() {
  modal.closeModal();
  emitChangeEdit('attribute', false);
}

function onAttributesSave(feature, attributes) {
  $('#o-save-button').on('click', function(e) {
    var editEl = {};

    //Read values from form
    for (var i = 0; i < attributes.length; i++) {

      //Get the input container class
      var containerClass = '.' + attributes[i].elId.slice(1);

      // If hidden element it should be excluded
      if ($(containerClass).hasClass('hidden') === false) {

        //Check if checkbox. If checkbox read state.
        if ($(attributes[i].elId).attr('type') === 'checkbox') {
          editEl[attributes[i].name] = $(attributes[i].elId).is(':checked') ? 1 : 0;
        }

        //Read value from input text, textarea or select
        else {
          editEl[attributes[i].name] = $(attributes[i].elId).val();
        }
      }
    }
    modal.closeModal();
    attributesSaveHandler(feature, editEl);
    $('#o-save-button').blur();
    e.preventDefault();
  });
}

function attributesSaveHandler(f, el) {
  var formEl = el;
  var feature = f;
  var fid = feature.getId();
  var clone = new ol.Feature();
  clone.setId(fid);

  //get DOM values and set attribute values to cloned feature
  for (var i = 0; i < attributes.length; i++) {
    if (formEl.hasOwnProperty(attributes[i].name)) {
      feature.set(attributes[i].name, formEl[attributes[i].name]);
      clone.set(attributes[i].name, formEl[attributes[i].name]);
    }
  }

  var node = format.writeTransaction(null, [clone], null, {
    gmlOptions: {
      srsName: srsName
    },
    featureNS: featureNS,
    featureType: featureType
  });
  $.ajax({
    type: "POST",
    url: url,
    data: serializer.serializeToString(node),
    contentType: 'text/xml',
    success: function(data) {
    },
    error: function(e) {
      var errorMsg = e ? (e.status + ' ' + e.statusText) : "";
      alert('Error saving this feature to the server...<br><br>' +
        errorMsg);
    },
    context: this
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
    emitChangeEdit('draw', true);
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

function readResponse(data) {
  var result;
  if (window.Document && data instanceof Document && data.documentElement &&
    data.documentElement.localName === 'ExceptionReport') {
    alert(data.getElementsByTagNameNS(
      'http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
  } else {
    result = format.readTransactionResponse(data);
  }
  return result;
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
      deleteSelected();
  } else if (e.tool === 'edit') {
      setEditLayer(e.options);
  } else if (e.tool === 'cancel') {
      removeInteractions();
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
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}
