/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */


var Editor = (function($){

  var settings = {
    layer: undefined
  }

  return {
    init: function(){

        var editLayer = Viewer.getEditLayer() || alert('There is no editable layer');
        settings.layer = Viewer.getLayer(editLayer.name);

        TransactionHandler.init({
          source: settings.layer.getSource(),
          geometryType: editLayer.geometryType,
          geometryName: settings.layer.get('geometryName'),
          srsName: Viewer.getProjectionCode(),
          featureNS: editLayer.workspace,
          featureType: settings.layer.get('featureType'),
          attributes: settings.layer.get('attributes'),
          url: Viewer.getMapSource()[settings.layer.get('mapSource')].url,
          map: Viewer.getMap()
        });

        Editor.bindUIActions();
    },
    deleteFeature: function() {
      TransactionHandler.deleteSelected();
    },
    attributeFeature: function() {
      TransactionHandler.attributeSelected();
    },
    drawFeature: function() {
      TransactionHandler.activateInsert();
      //turnOnCursor();

      //TransactionHandler.draw.on('drawend', turnOffCursor, this);
    },
    bindUIActions: function() {
      $('#edit-draw-button').on('touchend click', function(e) {
        Editor.drawFeature();
        $('#edit-draw-button button').blur();
        e.preventDefault();
      });
      $('#edit-attribute-button').on('touchend click', function(e) {
        Editor.attributeFeature();
        $('#edit-attribute-button button').blur();
        e.preventDefault();
      });
      $('#edit-delete-button').on('touchend click', function(e) {
        Editor.deleteFeature();
        $('#edit-delete-button button').blur();
        e.preventDefault();
      });
    }
  };
})(jQuery);
