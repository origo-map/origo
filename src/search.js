'use strict';

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var wktToFeature = require('./maputils').wktToFeature;
var Popup = require('./popup');
var Awesomplete = require('awesomplete');
var getFeature = require('./getfeature');
var getAttributes = require('./getattributes');
var featureInfo = require('./featureinfo');
var mapUtils = require('./maputils');
var getCenter = require('./geometry/getcenter');
var utils = require('./utils');
var generateUUID = require('./utils/generateuuid');
var keyCodes = {
  9: 'tab',
  27: 'esc',
  37: 'left',
  39: 'right',
  13: 'enter',
  38: 'up',
  40: 'down'
};
var searchDb = {};
var map;
var name;
var northing;
var easting;
var geometryAttribute;
var idAttribute;
var layerNameAttribute;
var layerName;
var titleAttribute;
var contentAttribute;
var includeSearchableLayers;
var searchableDefault;
var maxZoomLevel;
var url;
var title;
var hintText;
var projectionCode;
var overlay;
var limit;
var minLength;
var awesomplete;

function init(options) {
  name = options.searchAttribute;
  northing = options.northing || undefined;
  easting = options.easting || undefined;
  geometryAttribute = options.geometryAttribute;

  /** idAttribute in combination with layerNameAttribute
  must be defined if search result should be selected */
  idAttribute = options.idAttribute;
  layerNameAttribute = options.layerNameAttribute || undefined;
  layerName = options.layerName || undefined;
  url = options.url;
  title = options.title || '';
  titleAttribute = options.titleAttribute || undefined;
  contentAttribute = options.contentAttribute || undefined;
  includeSearchableLayers = options.hasOwnProperty('includeSearchableLayers') ? options.includeSearchableLayers : false;
  searchableDefault = options.hasOwnProperty('searchableDefault') ? options.searchableDefault : false;
  maxZoomLevel = options.maxZoomLevel || Viewer.getResolutions().length - 2 || Viewer.getResolutions();
  limit = options.limit || 9;
  hintText = options.hintText || 'Sök...';
  minLength = options.minLength || 4;
  projectionCode = Viewer.getProjectionCode();

  map = Viewer.getMap();

  render();
  initAutocomplete();
  bindUIActions();
}

function render() {
  var el = '<div id="o-search-wrapper" class="o-search-wrapper">' +
    '<div id="o-search" class="o-search o-search-false">' +
    '<input id="hjl" class="o-search-field form-control" type="text" placeholder="' + hintText + '">' +
    '<button id="o-search-button">' +
    '<svg class="o-icon-fa-search">' +
    '<use xlink:href="#fa-search"></use>' +
    '</svg>' +
    '</button>' +
    '<button id="o-search-button-close">' +
    '<svg class="o-icon-search-fa-times">' +
    '<use xlink:href="#fa-times"></use>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '</div>';
  $('#o-map').append(el);
}

function bindUIActions() {
  document.getElementById('hjl').addEventListener("awesomplete-selectcomplete", selectHandler);

  $('#o-search .o-search-field').on('input', function() {
    if ($('#o-search .o-search-field').val() && $('#o-search').hasClass('o-search-false')) {
      $('#o-search').removeClass('o-search-false');
      $('#o-search').addClass('o-search-true');
      onClearSearch();
    } else if (!($('#o-search .o-search-field').val()) && $('#o-search').hasClass('o-search-true')) {
      $('#o-search').removeClass('o-search-true');
      $('#o-search').addClass('o-search-false');
    }
  });

  $('.o-search-field').on('blur', function(e) {
    $('.o-search-wrapper').removeClass('active');
    window.dispatchEvent(new Event('resize'));
  });
  $('.o-search-field').on('focus', function(e) {
    $('.o-search-wrapper').addClass('active');
    window.dispatchEvent(new Event('resize'));
  });

}

/*
The label property in Awesomplete is used to store the feature id. This way the properties
of each feature in the search response will be available in event handling.
The complete properties are stored in a tempory db called searchDb. This is a workaround
for a limit in Awesomplete that can only store data in the fields label and text.
The data-catogry attribute is used to make a layer division in the sugguestion list.
*/
function initAutocomplete() {
  var list;

  $.support.cors = true;

  var input = $("#o-search .o-search-field");
  awesomplete = new Awesomplete('#o-search .o-search-field', {
    minChars: minLength,
    autoFirst: false,
    sort: false,
    maxItems: limit,
    item: renderList,
    filter: function(suggestion, input) {
      return suggestion.value;
    }
  });

  var handler = function(data) {
    list = [];
    searchDb = {};
    if (data.length) {
      setSearchDb(data);
      if (name && layerNameAttribute) {
        list = groupToList(groupDb(searchDb));
      } else {
        list = dbToList(data);
      }
      awesomplete.list = list;
      awesomplete.evaluate();
    }
  };

  $(input).on("keyup", function(e) {
    var keyCode = e.keyCode;
    if (this.value.length >= minLength) {
      if (keyCode in keyCodes) {
        return;
      } else {
        makeRequest(handler, this);
      }
    }
  });
}

function dbToList() {
  var items = Object.keys(searchDb);
  return items.map(function(item) {
    return searchDb[item];
  });
}

function groupDb(data) {
  var group = {};
  var ids = Object.keys(data);
  ids.forEach(function(id) {
    var item = data[id];
    var type = item[layerNameAttribute];
    var header = false;
    if (type in group === false) {
      group[type] = [];
      item.header = Viewer.getLayer(type).get('title');
    }
    group[type].push(item);
  });
  return group;
}

function groupToList(group) {
  var types = Object.keys(group);
  var list = [];
  var selection = {};
  var nr = 0;
  var turn = 0;
  while (nr < limit && types.length) {
    types.slice().forEach(function(type) {
      if (nr < limit) {
        var item = group[type][turn];
        if (type in selection === false) {
          selection[type] = [];
        }
        selection[type][turn] = item;
        if (!group[type][turn + 1]) {
          types.splice(types.indexOf(type), 1);
        }
      }
      nr++;
    });
    turn++;
  }
  list = Object.keys(selection).reduce(function(previous, group) {
    return previous.concat(selection[group]);
  }, []);
  return list;
}

function setSearchDb(data) {
  data.forEach(function(item) {
    var id = generateUUID();
    item.label = id;
    item.value = item[name];
    searchDb[id] = item;
  });
}

function renderList(suggestion, input) {
  var item = searchDb[suggestion.label] || {};
  var header = 'header' in item ? '<div class="heading">' + item.header + '</div>' : '';
  var options = {};
  var html = input === '' ? suggestion.value : suggestion.value.replace(RegExp(Awesomplete.$.regExpEscape(input), "gi"), "<mark>$&</mark>");
  html = header + '<div class="suggestion">' + html + '</div>';
  options = {
    innerHTML: html,
    'aria-selected': 'false'
  };
  if ('header' in item) {
    options.className = 'header';
  }

  return Awesomplete.$.create("li", options);
}

function makeRequest(handler, obj) {
  var queryUrl = url + '?q=' + encodeURI(obj.value);
  if (includeSearchableLayers) {
    queryUrl += '&l=' + Viewer.getSearchableLayers(searchableDefault);
  }
  $.ajax({
    url: queryUrl,
    type: 'GET',
    dataType: 'json'
  }).then(handler);
}

function onClearSearch() {
  $('#o-search-button-close').on('click', function(e) {
    clearSearchResults();
    clear();
    $('#o-search').removeClass('o-search-true');
    $('#o-search').addClass('o-search-false');
    $('#o-search .o-search-field').val('');
    $('#o-search-button').blur();
    e.preventDefault();
  });
}

function showOverlay(data, coord) {
  var popup;
  var content;
  clear();
  popup = Popup('#o-map');
  overlay = new ol.Overlay({
    element: popup.getEl()
  });

  map.addOverlay(overlay);

  overlay.setPosition(coord);
  content = data[name];
  popup.setContent({
    content: content,
    title: title
  });
  popup.setVisibility(true);
  mapUtils.zoomToExent(new ol.geom.Point(coord), maxZoomLevel);
}

function showFeatureInfo(features, title, content) {
  var obj = {};
  obj.feature = features[0];
  obj.title = title;
  obj.content = content;
  clear();
  featureInfo.identify([obj], 'overlay', getCenter(features[0].getGeometry()));
  mapUtils.zoomToExent(features[0].getGeometry(), maxZoomLevel);
}

function clear() {
  featureInfo.clear();
  if (overlay) {
    Viewer.removeOverlays(overlay);
  }
}

function clearSearchResults() {
  awesomplete.list = [];
  setSearchDb([]);
}

/** There are several different ways to handle selected search result.
 * Option 1. Feature info is requested from a map service.
 * In this case idAttribute and layerNameAttribute must be provided.
 * A map service is used to get the geometry and attributes. The layer is defined
 * as an ordinary layer in the layer config section.
 * Option 2. Same as option 1 but for single layer search. layerName is defined
 * as an option and is not included in the search response.
 * In this case geometryAttribute and layerName must be provided.
 * Option 3. Complete feature info is included in the search result.
 * In this case titleAttribute, contentAttribute and geometryAttribute must be provided.
 * Option 4. This is a single table search. No layer is defined.
 * In this case geometryAttribute and title must be defined.
 * Option 5. Feature info is shown without selection in the map.
 * This is a simple single table search. In this case title, northing and easting
 * must be defined. */

function selectHandler(evt) {
  var id = evt.text.label;
  var data = searchDb[id];
  var layer;
  var id;
  var feature;
  var content;
  var coord;
  if (layerNameAttribute && idAttribute) {
    layer = Viewer.getLayer(data[layerNameAttribute]);
    id = data[idAttribute];
    getFeature(id, layer)
      .done(function(res) {
        var featureWkt;
        var coordWkt;
        if (res.length > 0) {
          showFeatureInfo(res, layer.get('title'), getAttributes(res[0], layer));
        }

        // Fallback if no geometry in response
        else if (geometryAttribute) {
          featureWkt = wktToFeature(data[geometryAttribute], projectionCode);
          coordWkt = featureWkt.getGeometry().getCoordinates();
          showOverlay(data, coordWkt);
        }
      });
  } else if (geometryAttribute && layerName) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);
    layer = Viewer.getLayer(data[layerName]);
    showFeatureInfo([feature], layer.get('title'), getAttributes(feature, layer));
  } else if (titleAttribute && contentAttribute && geometryAttribute) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);

    // Make sure the response is wrapped in a html element
    content = utils.createElement('div', data[contentAttribute]);
    showFeatureInfo([feature], data[titleAttribute], content);
  } else if (geometryAttribute && title) {
    feature = wktToFeature(data[geometryAttribute], projectionCode);
    content = utils.createElement('div', data[name]);
    showFeatureInfo([feature], title, content);
  } else if (easting && northing && title) {
    coord = [data[easting], data[northing]];
    showOverlay(data, coord);
  } else {
    console.log('Search options are missing');
  }
}

module.exports.init = init;
