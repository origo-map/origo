/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var TransactionHandler = (function($){

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
    init: function(options){
      settings.srsName = options.srsName;
      settings.source = options.source;
      settings.geometryType = options.geometryType;
      settings.geometryName = options.geometryName;
      settings.url = options.url;
      settings.map = options.map;
      settings.featureNS = options.featureNS;
      settings.featureType = options.featureType;
      settings.attributes = options.attributes;
      settings.draw = new ol.interaction.Draw({
        source: settings.source,
        'type': settings.geometryType,
        geometryName: settings.geometryName
      });
      settings.hasDraw = false;
      settings.select = new ol.interaction.Select({layers: [Viewer.getLayer(Viewer.getEditLayer().name)]});
      settings.modify = new ol.interaction.Modify({
        features: settings.select.getFeatures()
      });
      settings.select.getFeatures().on('add', TransactionHandler.onSelectAdd, this);
      settings.select.getFeatures().on('remove', TransactionHandler.onSelectRemove, this);
      settings.dirty = {};
      settings.map.addInteraction(settings.select);
      settings.map.addInteraction(settings.modify);
      settings.format = new ol.format.WFS();
      settings.serializer = new XMLSerializer();
      settings.draw.on('drawend', TransactionHandler.onDrawEnd, this);
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
            var result = TransactionHandler.readResponse(data);
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
          var result = TransactionHandler.readResponse(data);
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
    onAttributeSave: function(f, el) {
        var formEl = el;
        var feature = f;
        var fid = feature.getId();
        var clone = new ol.Feature();
        clone.setId(fid);
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
          context: this
        });
    },
    activateInsert: function() {
      if (settings.hasDraw !== true) {
        settings.map.addInteraction(settings.draw);
        settings.hasDraw = true;
      }
    },
    attributeSelected: function() {
      var field = '', formElement= '', val = '', type = '';

      var features = settings.select.getFeatures();
      if (features.getLength() === 1) {
        var feature = features.item(0);
        if (settings.attributes.length > 0) {
          for(var i=0; i<settings.attributes.length; i++) {
            label = settings.attributes[i].title;
            field = settings.attributes[i].name;
            val = feature.get(settings.attributes[i].name) || '';
            type = settings.attributes[i].type;
            options = settings.attributes[i].options || [];
            formElement += TransactionHandler.createFormElement(label, field, val, type, options);
          }
        }
        var form = '<form>' + formElement +'<br><div class="mdk-form-save"><input id="mdk-save-button" type="button" value="Spara"></input></div></form>';
        var modal = Modal('#map', {title: 'Information', content: form});
        modal.showModal();

        $('#mdk-save-button').on('touchend click', function(e) {
          var editEl = {};
          //Read values from form
          for (var i=0; i<settings.attributes.length; i++) {
            //Check if checkbox. If checkbox read state.
            if ($('#input-' + settings.attributes[i].name).attr('type') == 'checkbox') {
              editEl[settings.attributes[i].name] = $('#input-' + settings.attributes[i].name).is(':checked') ? 1 : 0;
            }
            //Read value from input text, textarea or select
            else {
              editEl[settings.attributes[i].name] = $('#input-' + settings.attributes[i].name).val();
            }
          }
          modal.closeModal();
          TransactionHandler.onAttributeSave(feature, editEl);
          $('#mdk-save-button').blur();
          e.preventDefault();
        });
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
                var result = TransactionHandler.readResponse(data);
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
    createFormElement: function(label, field, val, type, options) {
      var el;
      switch(type) {
        case 'text':
          el = '<div><label>' + label +'</label><br><input type="text" id="input-' + field + '" value="' + val +'"></div>';
          break;
        case 'textarea':
          el = '<div><label>' + label +'</label><br><textarea id="input-' + field + '" rows="3">' + val + '</textarea></div>';
          break;
        case 'checkbox':
          var checked = val == true ? ' checked' : '';
          el = '<div class="mdk-form-checkbox"><label>' + label + '</label><input type="checkbox" id="input-' + field + '" value="' + val +'"' + checked + '></div>';
          break;
        case 'dropdown':
          var firstOption;
          if (val) {
            firstOption = '<option value="' + val + ' " selected>' + val + '</option>';
          }
          else {
            firstOption = '<option value="" selected>Välj</option>';
          }
          el ='<div><label>' + label +'</label><br><select id="input-' + field + '">' + firstOption;
          for (var i=0; i<options.length; i++) {
            el += '<option value="' + options[i] + ' ">' + options[i] + '</option>';
          }
          el += '</select></div>';
          break;
      }
      return el;
    }
  };
})(jQuery);
