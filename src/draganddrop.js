"use strict";
var viewer = require('./viewer');
var legend = require('./legend');
var ol = require('openlayers');

function init(opt_options) {
  var options = opt_options || {};
  var dragAndDrop;
  var groupTitle = options.groupTitle || "Egna lager";
  var map = viewer.getMap();
  var vectorSource;
  var vectorLayer;
  var vectorLayerName;
  var group;

  dragAndDrop = new ol.interaction.DragAndDrop({
    formatConstructors: [
      ol.format.GPX,
      ol.format.GeoJSON,
      ol.format.IGC,
      ol.format.KML,
      ol.format.TopoJSON
    ]
  });

  map.addInteraction(dragAndDrop);

  dragAndDrop.on('addfeatures', function(event) {
    vectorSource = new ol.source.Vector({
      features: event.features
    });

    vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      name: event.file.name.split('.')[0].replace(/[^a-z0-9]/gi,''),
      group: "draganddrop",
      title: event.file.name.split('.')[0],
      queryable: true,
      removable: true
    });

    viewer.getSettings().layers.push(vectorLayer);
    map.addLayer(vectorLayer);
    map.getView().fit(vectorSource.getExtent());

    if (!document.getElementById("o-group-draganddrop")) {
          group = {
            name: "draganddrop",
            title: groupTitle,
            expanded: true
          };
          legend.createGroup(group, undefined, true);
        }

    vectorLayerName = vectorLayer.get('name');

    legend.createLegendItem(vectorLayerName, true);
    legend.addMapLegendItem(vectorLayer, vectorLayerName)
    legend.addCheckbox(vectorLayer, vectorLayerName);
    legend.addTickListener(vectorLayer);
    legend.addMapLegendListener(vectorLayer)
  });
}

module.exports.init = init;
