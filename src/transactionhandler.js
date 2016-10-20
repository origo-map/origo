/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
 "use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('./viewer');
var modal = require('./modal');

module.exports = function(){

  var settings = {
  		srsName: undefined,
      source: undefined,
      geometryType: undefined,
      geometryName: undefined,
      url: undefined,
      map: undefined,
      featureNS: undefined,
      featureType:undefined,
      draw: undefined,
      hasDraw: undefined,
      select: undefined,
      modify: undefined,
      dirty: undefined,
      format: undefined,
      serializer: undefined
  };



  return {
    onSetEditLayer: function(options){
      settings.srsName = options.srsName;
      settings.source = options.source;
      settings.geometryType = options.geometryType;
      settings.geometryName = options.geometryName;
      settings.url = options.url;
      settings.map = options.map;
      settings.featureNS = options.featureNS;
      settings.featureType = options.featureType;
      settings.attributes = options.attributes;
      settings.title = options.title;
      settings.draw = new ol.interaction.Draw({
        source: settings.source,
        'type': settings.geometryType,
        geometryName: settings.geometryName
      });
      settings.hasDraw = false;
      settings.select = new ol.interaction.Select({layers: [options.editableLayer]});
      settings.modify = new ol.interaction.Modify({
        features: settings.select.getFeatures()
      });
      settings.select.getFeatures().on('add', this.onSelectAdd, this);
      settings.select.getFeatures().on('remove', this.onSelectRemove, this);
      settings.dirty = {};
      settings.map.addInteraction(settings.select);
      settings.map.addInteraction(settings.modify);
      settings.format = new ol.format.WFS();
      settings.serializer = new XMLSerializer();
      settings.draw.on('drawend', this.onDrawEnd, this);
    },
    readResponse: function(data) {
      var result;
      if (window.Document && data instanceof Document && data.documentElement &&
          data.documentElement.localName == 'ExceptionReport') {
            alert(data.getElementsByTagNameNS(
                'http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
      } else {
        result = settings.format.readTransactionResponse(data);
      }
      return result;
    },
    getSelect: function() {
      return settings.select;
    },
    onSelectAdd: function(evt) {
      var feature = evt.element;
      var fid = feature.getId();
      feature.on('change', function(evt) {
        settings.dirty[evt.target.getId()] = true;
      }, this);
    },
    onSelectRemove: function(evt) {
      var feature = evt.element;
      var fid = feature.getId();
      if (settings.dirty[fid]) {
        // do a WFS transaction to update the geometry
        var properties = feature.getProperties();
        console.log(properties);
        // get rid of bbox which is not a real property
        delete properties.bbox;
        var clone = new ol.Feature(properties);
        clone.setId(fid);
        var node = settings.format.writeTransaction(null, [clone], null, {
          gmlOptions: {srsName: settings.srsName},
          featureNS: settings.featureNS,
          featureType: settings.featureType
        });
        $.ajax({
          type: "POST",
          url: settings.url,
          data: settings.serializer.serializeToString(node),
          contentType: 'text/xml',
          success: function(data) {
            var result = this.readResponse(data);
            if (result && result.transactionSummary.totalUpdated === 1) {
              delete settings.dirty[fid];
            }
          },
          context: this
        });
      }
    },
    onDrawEnd: function(evt) {
      var feature = evt.feature;
      var node = settings.format.writeTransaction([feature], null, null, {
        gmlOptions: {srsName: settings.srsName},
      featureNS: settings.featureNS,
        featureType: settings.featureType
      });
      $.ajax({
        type: "POST",
        url: settings.url,
        data: settings.serializer.serializeToString(node),
        contentType: 'text/xml',
        success: function(data) {
          var result = this.readResponse(data);
          if (result) {
            var insertId = result.insertIds[0];
            if (insertId == 'new0') {
              // reload data if we're dealing with a shapefile store
              settings.source.clear();
            } else {
              feature.setId(insertId);
            }
          }
          settings.map.removeInteraction(settings.draw);
          settings.hasDraw = false;
        },
        error: function(e) {
          settings.map.removeInteraction(settings.draw);
          settings.hasDraw = false;
          var errorMsg = e? (e.status + ' ' + e.statusText) : "";
          alert('Error saving this feature to GeoServer.<br><br>'
            + errorMsg);
        },
        context: this
      });
    },
    onAttributesSave: function(feature, attributes) {
        var self = this;
        $('#o-save-button').on('click', function(e) {
          var editEl = {};
          //Read values from form
          for (var i=0; i<attributes.length; i++) {
            //Get the input container class
            var containerClass = '.' + attributes[i].elId.slice(1);
            // If hidden element it should be excluded
            if($(containerClass).hasClass('hidden') === false) {
                //Check if checkbox. If checkbox read state.
                if ($(attributes[i].elId).attr('type') == 'checkbox') {
                  editEl[attributes[i].name] = $(attributes[i].elId).is(':checked') ? 1 : 0;
                }
                //Read value from input text, textarea or select
                else {
                  editEl[attributes[i].name] = $(attributes[i].elId).val();
                }
            }
          }
          modal.closeModal();
          self.attributesSaveHandler(feature, editEl);
          $('#o-save-button').blur();
          e.preventDefault();
        });
    },
    attributesSaveHandler: function(f, el) {
      var formEl = el;
      var feature = f;
      var fid = feature.getId();
      var clone = new ol.Feature();
      clone.setId(fid);
      //get DOM values and set attribute values to cloned feature
      for (var i=0; i<settings.attributes.length; i++) {
        if (formEl.hasOwnProperty(settings.attributes[i].name)) {
          feature.set(settings.attributes[i].name, formEl[settings.attributes[i].name]);
          clone.set(settings.attributes[i].name, formEl[settings.attributes[i].name]);
        }
      }

      var node = settings.format.writeTransaction(null, [clone], null, {
        gmlOptions: {srsName: settings.srsName},
        featureNS: settings.featureNS,
        featureType: settings.featureType
      });
      $.ajax({
        type: "POST",
        url: settings.url,
        data: settings.serializer.serializeToString(node),
        contentType: 'text/xml',
        success: function(data) {
          //alert('success');
        },
        error: function(e) {
          var errorMsg = e? (e.status + ' ' + e.statusText) : "";
          alert('Error saving this feature to GeoServer.<br><br>'
            + errorMsg);
        },
        context: this
      });
    },
    removeInteractions: function() {
        if (isActive()) {
            settings.map.removeInteraction(settings.modify);
            settings.map.removeInteraction(settings.select);
        }
    },
    activateInsert: function() {
      if (settings.hasDraw !== true) {
        settings.map.addInteraction(settings.draw);
        settings.hasDraw = true;
      }
    },
    addListener: function() {
        var fn = function(obj) {
            $(obj.elDependencyId).on(obj.eventType, function(e) {
                var containerClass = '.' + obj.elId.slice(1);
                if($(obj.elDependencyId + (' option:selected')).text() === obj.requiredVal) {
                    $(containerClass).removeClass('o-hidden');
                }
                else {
                    $(containerClass).addClass('o-hidden');
                }
            });
        }
        return fn;
    },
    onAttributes: function() {
      var self = this;

      //Get attributes from selected feature and fill DOM elements with the values
      var features = settings.select.getFeatures();
      if (features.getLength() === 1) {
        var feature = features.item(0);
        if (settings.attributes.length > 0) {
          //Create an array of defined attributes and corresponding values from selected feature
          var attributeObjects = settings.attributes.map(function(attributeObject) {
              var obj = {};
              $.extend(obj, attributeObject);
              obj.val = feature.get(obj.name) || '';
              if(obj.hasOwnProperty('constraint')) {
                  var constraintProps = obj.constraint.split(':');
                  if (constraintProps.length === 3) {
                      obj.eventType = constraintProps[0];
                      obj.dependencyVal = feature.get(constraintProps[1]);
                      obj.requiredVal = constraintProps[2];
                      obj.dependencyVal === obj.requiredVal ? obj.isVisible = true : obj.isVisible = false;
                      obj.addListener = self.addListener();
                      obj.elId = '#input-' + obj.name + '-' + obj.requiredVal;
                      obj.elDependencyId = '#input-' + constraintProps[1];
                  }
                  else {
                      alert('Constraint properties are not written correct, it should written as for example change:attribute:value');
                  }
              }
              else {
                  obj.isVisible = true;
                  obj.elId = '#input-' + obj.name;
              }
              obj.formElement = self.createFormElement(obj);
              return obj;
          });

        }
        var formElement = attributeObjects.reduce(function(prev, next) {
              return prev + next.formElement;
        }, '');
        var title = settings.title;
        var form = '<form>' + formElement +'<br><div class="o-form-save"><input id="o-save-button" type="button" value="Spara"></input></div></form>';
        modal.createModal('#o-map', {title: title, content: form});
        modal.showModal();

        attributeObjects.forEach(function(obj) {
            if(obj.hasOwnProperty('addListener')) {
                obj.addListener(obj);
            }
        });

        this.onAttributesSave(feature, attributeObjects);
      }


    },
    deleteSelected: function() {
      var features = settings.select.getFeatures();
      if (features.getLength() === 1) {
        var feature = features.item(0);
          var r = confirm("Är du säker på att du vill ta bort det här objektet?");
          if (r === true) {
            var node = settings.format.writeTransaction(null, null, [feature], {
              featureNS: settings.featureNS,
              featureType: settings.featureType
            });
            $.ajax({
              type: "POST",
              url: settings.url,
              data: settings.serializer.serializeToString(node),
              contentType: 'text/xml',
              success: function(data) {
                var result = this.readResponse(data);
                if (result) {
                  if (result.transactionSummary.totalDeleted === 1) {
                    settings.select.getFeatures().clear();
                    settings.source.removeFeature(feature);
                  } else {
                    alert("There was an issue deleting the feature.");
                  }
                }
              },
              context: this
            });
          }

      }
    },
    createFormElement: function(obj) {
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
      switch(type) {
        case 'text':
          el = '<div><label>' + label +'</label><br><input type="text" id="' + id + '" value="' + val +'"' + maxLength + '></div>';
          break;
        case 'textarea':
          el = '<div><label>' + label +'</label><br><textarea id="' + id + '"' + maxLength + 'rows="3">' + val + '</textarea></div>';
          break;
        case 'checkbox':
          var checked = val == true ? ' checked' : '';
          el = '<div class="o-form-checkbox"><label>' + label + '</label><input type="checkbox" id="' + id + '" value="' + val +'"' + checked + '></div>';
          break;
        case 'dropdown':
          var firstOption;
          if (val) {
            firstOption = '<option value="' + val + '" selected>' + val + '</option>';
          }
          else {
            firstOption = '<option value="" selected>Välj</option>';
          }
          el ='<div class="' + cls + '"><label>' + label +'</label><br><select id=' + id + '>' + firstOption;
          for (var i=0; i<dropdownOptions.length; i++) {
            el += '<option value="' + dropdownOptions[i] + '">' + dropdownOptions[i] + '</option>';
          }
          el += '</select></div>';
          break;
      }
      return el;
    }
  };

  function isActive() {
      if (settings.modify === undefined || settings.select === undefined) {
          return false;
      } else {
          return true;
      }
  }

}()
