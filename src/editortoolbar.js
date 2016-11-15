/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
 "use strict";

 var ol = require('openlayers');
 var $ = require('jquery');
 var viewer = require('./viewer');
 var transactionhandler = require('./transactionhandler');
 var editortemplate = require("./templates/editortoolbar.template.handlebars");

module.exports = function(){


  var options = {};

  var defaultLayer;
  var editableLayers = {};
  var editableLayer = undefined;
  var editAttributes = {};

  function render(selectOptions) {
      $("#o-map").append(editortemplate(selectOptions));
  }
  function onEnableInteraction(e) {
      if(e.interaction === 'editor') {
          setActive(true);
          transactionhandler.onSetEditLayer(editableLayers[defaultLayer]);
      }
      else {
          setActive(false);
          transactionhandler.removeInteractions();
      }
  }
  function setActive(state) {
      if(state === true) {
          $('#o-editor-toolbar').removeClass('o-hidden');
      }
      else {
          $('#o-editor-toolbar').addClass('o-hidden');
      }
  }
  function emitEnableInteraction() {
      $('.o-map').trigger({
          type: 'enableInteraction',
          interaction: 'editor'
      });
  }
  function selectionModel(layerNames) {
      var selectOptions = layerNames.map(function(layerName) {
          var obj = {};
          obj.name = viewer.getLayer(layerName).get('title');
          obj.value = layerName;
          return obj;
      });
      return selectOptions;
  }
  function setEditProps(layerNames, map, srsName) {
      var initialValue = {};
      var result = layerNames.reduce(function(layerProps, layerName) {
          var layer = viewer.getLayer(layerName);
          //get the layers source options
          var source = viewer.getMapSource()[layer.get('sourceName')];

          layerProps[layerName] = {
              editableLayer: layer,
              source: layer.getSource(),
              geometryType: layer.get('geometryType') || undefined,
              geometryName: layer.get('geometryName') || undefined,
              srsName: srsName,
              featureNS: source.workspace,
              featureType: layer.get('featureType'),
              attributes: layer.get('attributes'),
              title: layer.get('title') || 'Information',
              url: source.url,
              map: map
          };
          return layerProps;
      }, initialValue);
      return result;
  }

  return {
    init: function(opt_options){

        $.extend(options, opt_options)
        defaultLayer = options.defaultLayer || options.editableLayers[0];

        var map = viewer.getMap();
        var srsName = viewer.getProjectionCode();

        render(selectionModel(options.editableLayers));

        $('.o-map').on('enableInteraction', onEnableInteraction);

        //set edit properties for editable layers
        editableLayers = setEditProps(options.editableLayers, map, srsName);
        //
        options.editableLayers.forEach(function(layerName) {
            var layer = viewer.getLayer(layerName);
            layer.getSource().once('addfeature', function(e) {
                editableLayers[layerName].geometryType = layer.getSource().getFeatures()[0].getGeometry().getType();
                editableLayers[layerName].geometryName = layer.getSource().getFeatures()[0].getGeometryName();
                if(layerName === defaultLayer && options.isActive) {
                    emitEnableInteraction();
                }
            });
        });

        this.bindUIActions();

        if(options.isActive) {
            setActive(true);
        }
    },
    deleteFeature: function() {
      transactionhandler.deleteSelected();
    },
    attributeFeature: function() {
      transactionhandler.onAttributes();
    },
    drawFeature: function() {
      transactionhandler.activateInsert();
      //turnOnCursor();

      //transactionhandler.draw.on('drawend', turnOffCursor, this);
    },
    bindUIActions: function() {
      var self = this;
      $('#o-editor-draw').on('click', function(e) {
        self.drawFeature();
        $('#o-editor-draw').blur();
        e.preventDefault();
      });
      $('#o-editor-attribute').on('click', function(e) {
        self.attributeFeature();
        $('#o-editor-attribute').blur();
        e.preventDefault();
      });
      $('#o-editor-delete').on('click', function(e) {
        self.deleteFeature();
        $('#o-editor-delete').blur();
        e.preventDefault();
      });
      $('#o-editor-close').on('click', function(e) {
          $('.o-map').trigger({
              type: 'enableInteraction',
              interaction: 'featureInfo'
          });
          $('#o-editor-close').blur();
          e.preventDefault();
      });
      $('select[name="layer-dropdown"]').change(function() {
          transactionhandler.removeInteractions();
          transactionhandler.onSetEditLayer(editableLayers[$(this).val()]);
      });
    }
  };
}()
