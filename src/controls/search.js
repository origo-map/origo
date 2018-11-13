import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import Awesomplete from 'awesomplete';
import $ from 'jquery';
import featureInfo from '../featureinfo';
import generateUUID from '../utils/generateuuid';
import getAttributes from '../getattributes';
import getCenter from '../geometry/getcenter';
import getFeature from '../getfeature';
import mapUtils from '../maputils';
import popup from '../popup';
import viewer from '../viewer';
import utils from '../utils';

const keyCodes = {
  9: 'tab',
  27: 'esc',
  37: 'left',
  39: 'right',
  13: 'enter',
  38: 'up',
  40: 'down'
};

let searchDb = {};
let map;
let name;
let northing;
let easting;
let geometryAttribute;
let idAttribute;
let layerNameAttribute;
let layerName;
let titleAttribute;
let contentAttribute;
let includeSearchableLayers;
let searchableDefault;
let maxZoomLevel;
let url;
let title;
let hintText;
let projectionCode;
let overlay;
let limit;
let minLength;
let awesomplete;

function render() {
  const el = `<div id="o-search-wrapper" class="o-search-wrapper">
    <div id="o-search" class="o-search o-search-false">
    <input id="hjl" class="o-search-field form-control" type="text" placeholder="${hintText}"><button id="o-search-button">
    <svg class="o-icon-fa-search"><use xlink:href="#fa-search"></use></svg>
    </button><button id="o-search-button-close">
    <svg class="o-icon-search-fa-times"><use xlink:href="#fa-times"></use></svg>
    </button>
    </div>
    </div>`;
  $('#o-map').append(el);
}

function clear() {
  featureInfo.clear();
  if (overlay) {
    viewer.removeOverlays(overlay);
  }
}

function showFeatureInfo(features, objTitle, content) {
  const obj = {};
  obj.feature = features[0];
  obj.title = objTitle;
  obj.content = content;
  clear();
  featureInfo.identify([obj], 'overlay', getCenter(features[0].getGeometry()));
  mapUtils.zoomToExent(features[0].getGeometry(), maxZoomLevel);
}

function showOverlay(data, coord) {
  clear();
  const newPopup = popup('#o-map');
  overlay = new Overlay({
    element: newPopup.getEl()
  });

  map.addOverlay(overlay);

  overlay.setPosition(coord);
  const content = data[name];
  newPopup.setContent({
    content,
    title
  });
  newPopup.setVisibility(true);
  mapUtils.zoomToExent(new Point(coord), maxZoomLevel);
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
  let id = evt.text.label;
  const data = searchDb[id];
  let layer;
  let feature;
  let content;
  let coord;
  if (layerNameAttribute && idAttribute) {
    layer = viewer.getLayer(data[layerNameAttribute]);
    id = data[idAttribute];
    getFeature(id, layer)
      .done((res) => {
        let featureWkt;
        let coordWkt;
        if (res.length > 0) {
          showFeatureInfo(res, layer.get('title'), getAttributes(res[0], layer));
        } else if (geometryAttribute) {
          // Fallback if no geometry in response
          featureWkt = mapUtils.wktToFeature(data[geometryAttribute], projectionCode);
          coordWkt = featureWkt.getGeometry().getCoordinates();
          showOverlay(data, coordWkt);
        }
      });
  } else if (geometryAttribute && layerName) {
    feature = mapUtils.wktToFeature(data[geometryAttribute], projectionCode);
    layer = viewer.getLayer(data[layerName]);
    showFeatureInfo([feature], layer.get('title'), getAttributes(feature, layer));
  } else if (titleAttribute && contentAttribute && geometryAttribute) {
    feature = mapUtils.wktToFeature(data[geometryAttribute], projectionCode);

    // Make sure the response is wrapped in a html element
    content = utils.createElement('div', data[contentAttribute]);
    showFeatureInfo([feature], data[titleAttribute], content);
  } else if (geometryAttribute && title) {
    feature = mapUtils.wktToFeature(data[geometryAttribute], projectionCode);
    content = utils.createElement('div', data[name]);
    showFeatureInfo([feature], title, content);
  } else if (easting && northing && title) {
    coord = [data[easting], data[northing]];
    showOverlay(data, coord);
  } else {
    console.log('Search options are missing');
  }
}

function setSearchDb(data) {
  data.forEach((item) => {
    const dataItem = item;
    const id = generateUUID();
    dataItem.label = id;
    dataItem.value = item[name];
    searchDb[id] = dataItem;
  });
}

function clearSearchResults() {
  awesomplete.list = [];
  setSearchDb([]);
}

function onClearSearch() {
  $('#o-search-button-close').on('click', (e) => {
    clearSearchResults();
    clear();
    $('#o-search').removeClass('o-search-true');
    $('#o-search').addClass('o-search-false');
    $('#o-search .o-search-field').val('');
    $('#o-search-button').blur();
    e.preventDefault();
  });
}

function bindUIActions() {
  document.getElementById('hjl').addEventListener('awesomplete-selectcomplete', selectHandler);

  $('#o-search .o-search-field').on('input', () => {
    if ($('#o-search .o-search-field').val() && $('#o-search').hasClass('o-search-false')) {
      $('#o-search').removeClass('o-search-false');
      $('#o-search').addClass('o-search-true');
      onClearSearch();
    } else if (!($('#o-search .o-search-field').val()) && $('#o-search').hasClass('o-search-true')) {
      $('#o-search').removeClass('o-search-true');
      $('#o-search').addClass('o-search-false');
    }
  });

  $('.o-search-field').on('blur', () => {
    $('.o-search-wrapper').removeClass('active');
    window.dispatchEvent(new Event('resize'));
  });
  $('.o-search-field').on('focus', () => {
    $('.o-search-wrapper').addClass('active');
    window.dispatchEvent(new Event('resize'));
  });
}

function renderList(suggestion, input) {
  const item = searchDb[suggestion.label] || {};
  const header = 'header' in item ? `<div class="heading">${item.header}</div>` : '';
  let options = {};
  let html = input === '' ? suggestion.value : suggestion.value.replace(RegExp(Awesomplete.$.regExpEscape(input), 'gi'), '<mark>$&</mark>');
  html = `${header}<div class="suggestion">${html}</div>`;
  options = {
    innerHTML: html,
    'aria-selected': 'false'
  };
  if ('header' in item) {
    options.className = 'header';
  }

  return Awesomplete.$.create('li', options);
}

function dbToList() {
  const items = Object.keys(searchDb);
  return items.map(item => searchDb[item]);
}

function groupDb(data) {
  const group = {};
  const ids = Object.keys(data);
  ids.forEach((id) => {
    const item = data[id];
    const type = item[layerNameAttribute];
    if (type in group === false) {
      group[type] = [];
      item.header = viewer.getLayer(type).get('title');
    }
    group[type].push(item);
  });
  return group;
}

function groupToList(group) {
  const types = Object.keys(group);
  let list = [];
  const selection = {};
  let nr = 0;
  let turn = 0;

  const groupList = () => {
    types.slice().forEach((type) => {
      if (nr < limit) {
        const item = group[type][turn];
        if (type in selection === false) {
          selection[type] = [];
        }
        selection[type][turn] = item;
        if (!group[type][turn + 1]) {
          types.splice(types.indexOf(type), 1);
        }
      }
      nr += 1;
    });
    turn += 1;
  };

  while (nr < limit && types.length) {
    groupList();
  }
  list = Object.keys(selection).reduce((previous, currentGroup) => previous.concat(selection[currentGroup]), []);
  return list;
}

/*
The label property in Awesomplete is used to store the feature id. This way the properties
of each feature in the search response will be available in event handling.
The complete properties are stored in a tempory db called searchDb. This is a workaround
for a limit in Awesomplete that can only store data in the fields label and text.
The data-catogry attribute is used to make a layer division in the sugguestion list.
*/

function initAutocomplete() {
  let list;

  $.support.cors = true;

  const input = $('#o-search .o-search-field');
  awesomplete = new Awesomplete('#o-search .o-search-field', {
    minChars: minLength,
    autoFirst: false,
    sort: false,
    maxItems: limit,
    item: renderList,
    filter(suggestion) {
      return suggestion.value;
    }
  });

  const handler = function func(data) {
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

  function makeRequest(reqHandler, obj) {
    let queryUrl = `${url}?q=${encodeURI(obj.value)}`;
    if (includeSearchableLayers) {
      queryUrl += `&l=${viewer.getSearchableLayers(searchableDefault)}`;
    }
    $.ajax({
      url: queryUrl,
      type: 'GET',
      dataType: 'json'
    }).then(reqHandler);
  }

  $(input).on('keyup', function func(e) {
    const keyCode = e.keyCode;
    if (this.value.length >= minLength) {
      if (keyCode in keyCodes) {
        // empty
      } else {
        makeRequest(handler, this);
      }
    }
  });
}

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
  includeSearchableLayers = Object.prototype.hasOwnProperty.call(options, 'includeSearchableLayers') ? options.includeSearchableLayers : false;
  searchableDefault = Object.prototype.hasOwnProperty.call(options, 'searchableDefault') ? options.searchableDefault : false;
  maxZoomLevel = options.maxZoomLevel || viewer.getResolutions().length - 2 || viewer.getResolutions();
  limit = options.limit || 9;
  hintText = options.hintText || 'Sök...';
  minLength = options.minLength || 4;
  projectionCode = viewer.getProjectionCode();

  map = viewer.getMap();

  render();
  initAutocomplete();
  bindUIActions();
}

export default {
  init,
  showFeatureInfo
};
