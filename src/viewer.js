"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var template = require("./templates/viewer.handlebars");
var Modal = require('./modal');
var utils = require('./utils');
var isUrl = require('./utils/isurl');
var elQuery = require('./utils/elquery');
var featureinfo = require('./featureinfo');
var maputils = require('./maputils');
var style = require('./style')();
var layerCreator = require('./layercreator');

var map;
var template;
var settings = {
  projection: '',
  projectionCode: '',
  projectionExtent: '',
  extent: [],
  center: [0, 0],
  zoom: 0,
  resolutions: null,
  source: {},
  group: [],
  layers: [],
  styles: {},
  controls: [],
  featureInfoOverlay: undefined,
  editLayer: null
};
var urlParams;
var footerTemplate = {};

function init(el, mapOptions) {
  render(el, mapOptions);

  // Read and set projection
  if (mapOptions.hasOwnProperty('proj4Defs') && window.proj4) {
    var proj = mapOptions['proj4Defs'];

    //Register proj4 projection definitions
    for (var i = 0; i < proj.length; i++) {
      proj4.defs(proj[i].code, proj[i].projection);
      if (proj[i].hasOwnProperty('alias')) {
        proj4.defs(proj[i].alias, proj4.defs(proj[i].code));
      }
    }
  }
  settings.params = urlParams = mapOptions.params || {};
  settings.map = mapOptions.map;
  settings.url = mapOptions.url;
  settings.target = mapOptions.target;
  settings.baseUrl = mapOptions.baseUrl;
  settings.extent = mapOptions.extent || undefined;
  settings.center = urlParams.center || mapOptions.center;
  settings.zoom = urlParams.zoom || mapOptions.zoom;
  mapOptions.tileGrid = mapOptions.tileGrid || {};
  settings.tileSize = mapOptions.tileGrid.tileSize ? [mapOptions.tileGrid.tileSize,mapOptions.tileGrid.tileSize] : [256,256];
  settings.alignBottomLeft = mapOptions.tileGrid.alignBottomLeft;

  if (mapOptions.hasOwnProperty('proj4Defs') || mapOptions.projectionCode=="EPSG:3857" || mapOptions.projectionCode=="EPSG:4326") {
    // Projection to be used in map
    settings.projectionCode = mapOptions.projectionCode || undefined;
    settings.projectionExtent = mapOptions.projectionExtent;
    settings.projection = new ol.proj.Projection({
      code: settings.projectionCode,
      extent: settings.projectionExtent,
      units: getUnits(settings.projectionCode)
    });
    settings.resolutions = mapOptions.resolutions || undefined;
    settings.tileGrid = maputils.tileGrid(settings);
  }

  settings.source = mapOptions.source;
  settings.groups = mapOptions.groups;
  settings.editLayer = mapOptions.editLayer;
  settings.styles = mapOptions.styles;
  settings.clusterOptions = mapOptions.clusterOptions || {};
  style.init();
  settings.controls = mapOptions.controls;
  settings.consoleId = mapOptions.consoleId || 'o-console';
  settings.featureinfoOptions = mapOptions.featureinfoOptions || {};
  settings.enableRotation = mapOptions.enableRotation === false ? false : true;

  //If url arguments, parse this settings
  if (window.location.search) {
    parseArg();
  }

  loadMap();
  settings.layers = createLayers(mapOptions.layers, urlParams.layers);
  addLayers(settings.layers);

  elQuery(map, {
    breakPoints: mapOptions.breakPoints,
    breakPointsPrefix: mapOptions.breakPointsPrefix,
  });

  if (urlParams.pin) {
    settings.featureinfoOptions.savedPin = urlParams.pin;
  }

  //This needs further development for proper handling in permalink
  else if (urlParams.selection) {
    settings.featureinfoOptions.savedSelection = new ol.Feature({
      geometry: new ol.geom[urlParams.selection.geometryType](urlParams.selection.coordinates)
    });
  }
  featureinfo.init(settings.featureinfoOptions);
}

function addLayers(layers) {
  layers.forEach(function(layer) {
    map.addLayer(layer);
  });
}

function createLayers(layerlist, savedLayers) {
  var layers = [];
  for (var i = layerlist.length - 1; i >= 0; i--) {
    var savedLayer = {};
    if (savedLayers) {
      savedLayer = savedLayers[layerlist[i].name.split(':').pop()] || {
        visible: false,
        legend: false
      };
      savedLayer.name = layerlist[i].name;
    }
    var layer = $.extend(layerlist[i], savedLayer);
    layers.push(layerCreator(layer));
  }
  return layers;
}

function loadMap() {
  map = new ol.Map({
    target: 'o-map',
    controls: [],
    view: new ol.View({
      extent: settings.extent || undefined,
      projection: settings.projection || undefined,
      center: settings.center,
      resolutions: settings.resolutions || undefined,
      zoom: settings.zoom,
      enableRotation: settings.enableRotation
    })
  });
}

function parseArg() {
  var str = window.location.search.substring(1);
  var elements = str.split("&");

  for (var i = 0; i < elements.length; i++) {

    //center coordinates
    if (i == 0) {
      var z = elements[i].split(",");
      settings.center[0] = parseInt(z[0]);
      settings.center[1] = parseInt(z[1]);
    } else if (i == 1) {
      settings.zoom = parseInt(elements[i]);
    } else if (i == 2) {
      var l = elements[i].split(";");
      var layers = settings.layers;
      var la, match;
      for (var j = 0; j < layers.length; j++) {
        match = 0;
        $.each(l, function(index, el) {
          la = el.split(",");
          if (layers[j].get('group')) {
            if ((layers[j].get('group') == 'background') && (la[0] == layers[j].get('name'))) {
              layers[j].setVisible(true);
              match = 1;
            } else if ((layers[j].get('group') == 'background') && (match == 0)) {
              layers[j].setVisible(false);
            } else if (la[0] == layers[j].get('name')) {
              if (la[1] == 1) {
                layers[j].set('legend', true);
                layers[j].setVisible(false);
              } else {
                layers[j].set('legend', true);
                layers[j].setVisible(true);
              }
            }
          }
        })
      }
    }
  }

}

function getSettings() {
  return settings;
}

function getExtent() {
  return settings.extent;
}

function getBaseUrl() {
  return settings.baseUrl;
}

function getMapName() {
  return settings.map;
}

function getTileGrid() {
  return settings.tileGrid;
}

function getTileSize() {
  return settings.tileSize;
}

function getUrl() {
  return settings.url;
}

function getStyleSettings() {
  return settings.styles;
}

function getResolutions() {
  return settings.resolutions;
}

function getMapUrl() {
  var layerNames = '';
  var url;

  //delete search arguments if present
  if (window.location.search) {
    url = window.location.href.replace(window.location.search, '?');
  } else {
    url = window.location.href + '?';
  }
  var mapView = map.getView();
  var center = mapView.getCenter();
  for (var i = 0; i < 2; i++) {
    center[i] = parseInt(center[i]); //coordinates in integers
  }
  var zoom = mapView.getZoom();
  var layers = map.getLayers();

  //add layer if visible
  layers.forEach(function(el) {
    if (el.getVisible() == true) {
      layerNames += el.get('name') + ';';
    } else if (el.get('legend') == true) {
      layerNames += el.get('name') + ',1;';
    }
  })
  return url + center + '&' + zoom + '&' + layerNames.slice(0, layerNames.lastIndexOf(";"));
}

function getMap() {
  return map;
}

function getLayers() {
  return settings.layers;
}

function getLayersByProperty(key, val, byName) {
  var layers = map.getLayers().getArray().filter(function(layer) {
    if (layer.get(key)) {
      if (layer.get(key) === val) {
        return layer;
      }
    }
  });

  if (byName) {
    return layers.map(function(layer) {
      return layer.get('name');
    });
  } else {
    return layers;
  }
}

function getLayer(layername) {
  var layer = $.grep(settings.layers, function(obj) {
    return (obj.get('name') == layername);
  });
  return layer[0];
}

function getQueryableLayers() {
  var queryableLayers = settings.layers.filter(function(layer) {
    if (layer.get('queryable') && layer.getVisible()) {
      return layer;
    }
  });
  return queryableLayers;
}

function getGroup(group) {
  var group = $.grep(settings.layers, function(obj) {
    return (obj.get('group') == group);
  });
  return group;
}

function getGroups(opt) {
  if(opt == 'top') {
    return settings.groups;
  } else if (opt == 'sub') {
    return getSubgroups();
  } else {
    return settings.groups.concat(getSubgroups());
  }
}

function getSubgroups() {
  var subgroups = [];

  function findSubgroups(groups, n) {
    if (n >= groups.length) {
      return;
    }

    if (groups[n].groups) {
      groups[n].groups.forEach(function(subgroup) {
        subgroups.push(subgroup);
      });

      findSubgroups(groups[n].groups, 0);
    }

    findSubgroups(groups, n+1);
  }

  findSubgroups(settings.groups, 0);
  return subgroups;
}

function getProjectionCode() {
  return settings.projectionCode;
}

function getProjection() {
  return settings.projection;
}

function getMapSource() {
  return settings.source;
}

function getControlNames() {
  var controlNames = settings.controls.map(function(obj) {
    return obj.name;
  });
  return controlNames;
}

function getTarget() {
  return settings.target;
}

function getClusterOptions(){
  return settings.clusterOptions;
}

function checkScale(scale, maxScale, minScale) {
  if (maxScale || minScale) {

    // Alter 1: maxscale and minscale
    if (maxScale && minScale) {
      if ((scale > maxScale) && (scale < minScale)) {
        return true;
      }
    }

    // Alter 2: only maxscale
    else if (maxScale) {
      if (scale > maxScale) {
        return true;
      }
    }

    // Alter 3: only minscale
    else if (minScale) {
      if (scale < minScale) {
        return true;
      }
    }
  }

  // Alter 4: no scale limit
  else {
    return true;
  }
}

function getConsoleId() {
  return settings.consoleId;
}

function getScale(resolution) {
  var dpi = 25.4 / 0.28;
  var mpu = settings.projection.getMetersPerUnit();
  var scale = resolution * mpu * 39.37 * dpi;
  scale = Math.round(scale);
  return scale;
}

function getUnits(proj) {
  var units;
  switch(proj) {
    case 'EPSG:3857':
      units = 'm';
      break;
    case 'EPSG:4326':
      units = 'degrees';
      break;
    default:
      units = proj4.defs(proj) ? proj4.defs(proj).units : undefined;
  }
  return units;
}

function autoPan() {
  /*Workaround to remove when autopan implemented for overlays */
  var el = $('.o-popup');
  var center = map.getView().getCenter();
  var popupOffset = $(el).offset();
  var mapOffset = $('#' + map.getTarget()).offset();
  var offsetY = popupOffset.top - mapOffset.top;
  var mapSize = map.getSize();
  var offsetX = (mapOffset.left + mapSize[0]) - (popupOffset.left + $(el).outerWidth(true));

  // Check if mapmenu widget is used and opened
  var menuSize = 0;
  if (settings.controls.hasOwnProperty('mapmenu')) {
    menuSize = settings.controls.mapmenu.getTarget().offset().left > 0 ? mapSize[0] - settings.controls.mapmenu.getTarget().offset().left : menuSize = 0;
  }
  if (offsetY < 0 || offsetX < 0 + menuSize || offsetX > (mapSize[0] - $(el).outerWidth(true))) {
    var dx = 0,
      dy = 0;
    if (offsetX < 0 + menuSize) {
      dx = (-offsetX + menuSize) * map.getView().getResolution();
    }
    if (offsetX > (mapSize[0] - $(el).outerWidth(true))) {
      dx = -($(el).outerWidth(true) - (mapSize[0] - offsetX)) * map.getView().getResolution();
    }
    if (offsetY < 0) {
      dy = (-offsetY) * map.getView().getResolution();
    }
    map.getView().animate({
      center: ([center[0] + dx, center[1] + dy]),
	  duration:300
    });
  }
  /*End workaround*/
}
function removeLayer(name) {
  var $ul;

  settings.layers.forEach(function(layer, i, obj) {
    if (layer.get('name') === name) {
      obj.splice(i, 1)
    }
  });

  $ul = $("#o-mapmenu").find("#" + name).closest('ul');
  $ul.find('#' + name).remove();
  if ($ul.children().length === 1) {
    $ul.remove();
  }

  $('#o-legend-' + name).remove();
}

function removeOverlays(overlays) {
  if (overlays) {
    if (overlays.constructor === Array || overlays instanceof ol.Collection) {
      overlays.forEach(function(overlay) {
        map.removeOverlay(overlay);
      })
    } else {
      map.removeOverlay(overlays);
    }
  } else {
    map.getOverlays().clear();
  }
}

function render(el, mapOptions) {
    if (mapOptions.hasOwnProperty('footer')) {
      if (mapOptions.footer[0].hasOwnProperty('img')) {
        footerTemplate.img = mapOptions.footer[0].img;
      }
      if (mapOptions.footer[0].hasOwnProperty('text')) {
        footerTemplate.text = mapOptions.footer[0].text;
      }
      if (mapOptions.footer[0].hasOwnProperty('url')) {
        footerTemplate.url = mapOptions.footer[0].url;
      }
      if (mapOptions.footer[0].hasOwnProperty('urlText')) {
        footerTemplate.urlText = mapOptions.footer[0].urlText;
      }
    }

    $(el).html(template(footerTemplate));
}

module.exports.init = init;
module.exports.createLayers = createLayers;
module.exports.getBaseUrl = getBaseUrl;
module.exports.getExtent = getExtent;
module.exports.getSettings = getSettings;
module.exports.getStyleSettings = getStyleSettings;
module.exports.getMapUrl = getMapUrl;
module.exports.getMap = getMap;
module.exports.getLayers = getLayers;
module.exports.getLayersByProperty = getLayersByProperty;
module.exports.getLayer = getLayer;
module.exports.getControlNames = getControlNames;
module.exports.getQueryableLayers = getQueryableLayers;
module.exports.getGroup = getGroup;
module.exports.getGroups = getGroups;
module.exports.getProjectionCode = getProjectionCode;
module.exports.getProjection = getProjection;
module.exports.getMapSource = getMapSource;
module.exports.getResolutions = getResolutions;
module.exports.getScale = getScale;
module.exports.getTarget = getTarget;
module.exports.getClusterOptions = getClusterOptions;
module.exports.getTileGrid = getTileGrid;
module.exports.getTileSize = getTileSize;
module.exports.autoPan = autoPan;
module.exports.removeLayer = removeLayer;
module.exports.removeOverlays = removeOverlays;
module.exports.checkScale= checkScale;
module.exports.getMapName = getMapName;
module.exports.getConsoleId = getConsoleId;
module.exports.getUrl = getUrl;
