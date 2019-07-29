/* eslint-disable no-trailing-spaces */
/* eslint-disable no-empty */
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import Awesomplete from 'awesomplete';
import {
  Component,
  Element as El,
  Button,
  dom
} from '../ui';
import generateUUID from '../utils/generateuuid';
import getAttributes from '../getattributes';
import getCenter from '../geometry/getcenter';
import getFeature from '../getfeature';
import mapUtils from '../maputils';
import popup from '../popup';
import utils from '../utils';
import GeoJSONFormat from 'ol/format/GeoJSON';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiLineString from 'ol/geom/MultiLineString';

const Search = function Search(options = {}) {
  const keyCodes = {
    9: 'tab',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  let {
    name,
    northing,
    easting,
    idAttribute,
    layerNameAttribute,
    layerName,
    title,
    titleAttribute,
    contentAttribute,
    includeSearchableLayers,
    searchableDefault,
    maxZoomLevel,
    limit,
    hintText,
    minLength
  } = options;

  const {
    geometryAttribute,
    url
  } = options;

  let searchDb = {};
  let map;
  let projectionCode;
  let overlay;
  let awesomplete;
  let viewer;
  let featureInfo;
  let searchButton;
  let closeButton;
  let containerElement;
  let wrapperElement;
  //let geometryAttribute;


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
    obj.content = `<div class="o-identify-content">${content}</div>`;
    clear();
    featureInfo.render([obj], 'overlay', getCenter(features[0].getGeometry()));
    viewer.zoomToExtent(features[0].getGeometry(), maxZoomLevel);
  }

  function showOverlay(data, coord) {
    clear();
    const newPopup = popup(`#${viewer.getId()}`);
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
      const source = viewer.getMapSource();
      const projCode = viewer.getProjectionCode();
      const proj = viewer.getProjection();
      layer = viewer.getLayer(data[layerNameAttribute]);
      id = data[idAttribute];
      getFeatureInfoWMS(source, layer, proj,id);      
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

  function getFeatureInfoWMS(source, layer, proj, id) {
    let url = source[layer.get('sourceName')].url;
    const geometryName = layer.get('geometryName');
    const format = new GeoJSONFormat({
      geometryName
    });
    url = url.replace('wms', 'wfs');
    url += '?';
    const QueryString = ['service=WFS',
            '&version=1.1.0',
            `&request=GetFeature&typeNames=${layer.get('name')}`,
            '&outputFormat=json',
            `&filter=<ogc:Filter%20xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>sokid</ogc:PropertyName><ogc:Literal>${id}</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>`].join('');
    fetch(url + QueryString)
      .then(resp => resp.json())
      .then(json => {
        let features = format.readFeatures(json);
        if (features.length > 0) {
          let coord = features[0].getGeometry().getFirstCoordinate();
          let featureType = features[0].getGeometry();
          let resolution;

          if(featureType instanceof MultiPoint) resolution = 0.28;
          if(featureType instanceof MultiLineString) resolution = 14.0;

          if(!resolution) resolution = 2.8;

          let FeatureInfoUrl = layer.getSource().getGetFeatureInfoUrl(coord, resolution, proj, {
            'INFO_FORMAT': 'text/html',
            'feature_count': 1,
            'buffer': 1
          });

          FeatureInfoUrl += `&filter=<ogc:Filter%20xmlns:ogc="http://www.opengis.net/ogc"><ogc:PropertyIsEqualTo><ogc:PropertyName>sokid</ogc:PropertyName><ogc:Literal>${id}</ogc:Literal></ogc:PropertyIsEqualTo></ogc:Filter>`;

          fetch(FeatureInfoUrl)
            .then(res => res.text())
            .then(ftl => {
              showFeatureInfo(features, layer.get('title'), ftl);
            })
        }
      })
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
    document.getElementById(`${closeButton.getId()}`).addEventListener('click', () => {
      clearSearchResults();
      clear();
      document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-true');
      document.getElementById(`${containerElement.getId()}`).classList.add('o-search-false');
      document.getElementsByClassName('o-search-field')[0].value = '';
      document.getElementById(`${searchButton.getId()}`).blur();
    });
  }

  function bindUIActions() {
    document.getElementById('hjl').addEventListener('awesomplete-selectcomplete', selectHandler);
    document.getElementById('hjl').addEventListener("awesomplete-open", (evt) => {
      viewer.dispatch('search:open')
    });

    document.getElementsByClassName('o-search-field')[0].addEventListener('input', () => {
      if (document.getElementsByClassName('o-search-field')[0].value && document.getElementById(`${containerElement.getId()}`).classList.contains('o-search-false')) {
        document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-false');
        document.getElementById(`${containerElement.getId()}`).classList.add('o-search-true');
        onClearSearch();
      } else if (!(document.getElementsByClassName('o-search-field')[0].value) && document.getElementById(`${containerElement.getId()}`).classList.contains('o-search-true')) {
        document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-true');
        document.getElementById(`${containerElement.getId()}`).classList.add('o-search-false');
      }
    });

    document.getElementsByClassName('o-search-field')[0].addEventListener('blur', () => {
      document.getElementById(`${wrapperElement.getId()}`).classList.remove('active');
      window.dispatchEvent(new Event('resize'));
    });
    document.getElementsByClassName('o-search-field')[0].addEventListener('focus', () => {
      document.getElementById(`${wrapperElement.getId()}`).classList.add('active');
      window.dispatchEvent(new Event('resize'));
    });
  }

  function renderList(suggestion, input) {
    const item = searchDb[suggestion.label] || {};
    const header = 'header' in item ? `<div class="heading">${item.header}</div>` : '';
    let opts = {};
    let html = input === '' ? suggestion.value : suggestion.value.replace(RegExp(Awesomplete.$.regExpEscape(input), 'gi'), '<mark>$&</mark>');
    html = `${header}<div class="suggestion">${html}</div>`;
    opts = {
      innerHTML: html,
      'aria-selected': 'false'
    };
    if ('header' in item) {
      opts.className = 'header';
    }

    return Awesomplete.$.create('li', opts);
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
      if (!viewer.getLayer(type)) return;
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
        for (let i = 0; i < 3; i++) {
          if (nr < limit) {
            const item = group[type][turn + i];
            if (type in selection === false) {
              selection[type] = [];
            }
            selection[type][turn + i] = item;
            if (!group[type][turn + i + 1]) {
              types.splice(types.indexOf(type), 1);
              break;
            }
          }
          nr += 1;
        }
      });
      turn += 3;
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
  The data-category attribute is used to make a layer division in the sugguestion list.
  */

  function initAutocomplete() {
    let list;
    const input = document.getElementsByClassName('o-search-field')[0];

    awesomplete = new Awesomplete('.o-search-field', {
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

    // Change data structure to match awesomeplete
    function parseData(data) {
      let arr = [];
      data.forEach((hits) => {
        hits['hits'].forEach((obj) => {
          arr.push({
            id: obj.id,
            layername: hits['layername'],
            title: obj.title
          })
        })
      })
      return arr;
    }

    function serialize(obj) {
      let str = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
        }
      }
      return str.join("&");
    }

    function makeRequest(reqHandler, obj) {
      if (options.type === 'postgis') {
        let data = {
          searchstring: obj.value,
          layers: options.layers,
          date: new Date().getTime()
        }
        fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: serialize(data),
          })
          .then(response => response.json())
          .then((data) => {
            clearSearchResults();
            if (data) {reqHandler(parseData(data))}
          });
      } else {
        let queryUrl = `${url}?q=${encodeURI(obj.value)}`;
        if (includeSearchableLayers) {
          queryUrl += `&l=${viewer.getSearchableLayers(searchableDefault)}`;
        }
        fetch(queryUrl)
          .then(response => response.json())
          .then(reqHandler);
      }
    }

    input.addEventListener('keyup', (e) => {
      const keyCode = e.keyCode;
      if (input.value.length >= minLength) {
        if (keyCode in keyCodes) {
          // empty
        } else {
          makeRequest(handler, input);
        }
      }
    });
  }

  return Component({
    name: 'search',
    onAdd(evt) {
      viewer = evt.target;
      featureInfo = viewer.getControlByName('featureInfo');
      name = 'title'; // options.searchAttribute;
      if (!northing) northing = undefined;
      if (!easting) easting = undefined;
      /** idAttribute in combination with layerNameAttribute
     must be defined if search result should be selected */
      if (!layerNameAttribute) layerNameAttribute = undefined;
      if (!layerName) layerName = undefined;
      if (!title) title = '';
      if (!titleAttribute) titleAttribute = undefined;
      if (!contentAttribute) contentAttribute = undefined;
      includeSearchableLayers = Object.prototype.hasOwnProperty.call(options, 'includeSearchableLayers') ? options.includeSearchableLayers : false;
      searchableDefault = Object.prototype.hasOwnProperty.call(options, 'searchableDefault') ? options.searchableDefault : false;
      if (!maxZoomLevel) maxZoomLevel = viewer.getResolutions().length - 2 || viewer.getResolutions();
      if (!limit) limit = 9;
      if (!minLength) minLength = 1;
      projectionCode = viewer.getProjectionCode();
      map = viewer.getMap();

      this.addComponents([searchButton, closeButton, containerElement, wrapperElement]);
      this.render();
    },
    onInit() {
      if (!hintText) hintText = 'Sök...';
      searchButton = Button({
        cls: 'o-search-button no-shrink no-grow compact icon-small',
        icon: '#ic_search_24px',
        iconCls: 'grey'
      });

      closeButton = Button({
        cls: 'o-search-button-close no-shrink no-grow compact icon-small',
        click() {
          onClearSearch();
        },
        icon: '#ic_close_24px',
        iconCls: 'grey'
      });

      containerElement = El({
        cls: 'o-search o-search-false flex row align-center padding-right-small',
        innerHTML: `<input id="hjl" class="o-search-field form-control text-grey-darker" type="text" placeholder="${hintText}"></input>`
      });

      wrapperElement = El({
        cls: 'o-search-wrapper absolute top-center rounded box-shadow bg-white',
        style: {
          'flex-wrap': 'wrap',
          overflow: 'visible'
        }
      });
    },

    render() {
      const mapEl = document.getElementById(viewer.getMain().getId());

      let htmlString = wrapperElement.render();
      let el = dom.html(htmlString);
      mapEl.appendChild(el);

      htmlString = containerElement.render();
      el = dom.html(htmlString);
      document.getElementById(wrapperElement.getId()).appendChild(el);

      htmlString = searchButton.render();
      el = dom.html(htmlString);
      document.getElementById(containerElement.getId()).appendChild(el);

      htmlString = closeButton.render();
      el = dom.html(htmlString);
      document.getElementById(containerElement.getId()).appendChild(el);

      initAutocomplete();
      bindUIActions();

      this.dispatch('render');
    }
  });
};

export default Search;