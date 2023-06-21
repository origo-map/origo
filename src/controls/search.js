import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import Awesomplete from 'awesomplete';
import { Component, Element as El, Button, Collapse, CollapseHeader, dom } from '../ui';
import generateUUID from '../utils/generateuuid';
import getAttributes from '../getattributes';
import getCenter from '../geometry/getcenter';
import getFeature from '../getfeature';
import mapUtils from '../maputils';
import popup from '../popup';
import utils from '../utils';
import Infowindow from '../components/infowindow';
import { listExportHandler } from '../infowindow_exporthandler';

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
    groupSuggestions,
    includeSearchableLayers,
    searchableDefault,
    maxZoomLevel,
    limit,
    hintText,
    minLength
  } = options;

  const {
    geometryAttribute,
    url,
    queryParameterName = 'q',
    autocompletePlacement,
    searchlistOptions = {}
  } = options;

  const searchlistPlacement = searchlistOptions.placement;
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
  let infowindow;

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
    featureInfo.render([obj], 'overlay', getCenter(features[0].getGeometry()), { ignorePan: true });
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
    viewer.zoomToExtent(new Point(coord), maxZoomLevel);
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
      getFeature(id, layer, source, projCode, proj)
        .then((res) => {
          let featureWkt;
          let coordWkt;
          if (res.length > 0) {
            showFeatureInfo(res, layer.get('title'), getAttributes(res[0], layer, map));
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
      showFeatureInfo([feature], layer.get('title'), getAttributes(feature, layer, map));
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
      console.error('Search options are missing');
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

  function clearAll() {
    clearSearchResults();
    clear();
    document.getElementById(`${containerElement.getId()}`).classList.remove('o-search-true');
    document.getElementById(`${containerElement.getId()}`).classList.add('o-search-false');
    document.getElementsByClassName('o-search-field')[0].value = '';
    document.getElementById(`${searchButton.getId()}`).blur();
    document.getElementsByClassName('o-search-field')[0].blur();
  }

  function onClearSearch() {
    document.getElementById(`${closeButton.getId()}`).addEventListener('click', () => {
      clearAll();
    });
  }

  function bindUIActions() {
    document.getElementById('hjl').addEventListener('awesomplete-selectcomplete', selectHandler);

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
      window.dispatchEvent(new CustomEvent('resize'));
    });
    document.getElementsByClassName('o-search-field')[0].addEventListener('focus', () => {
      document.getElementById(`${wrapperElement.getId()}`).classList.add('active');
      if (awesomplete.suggestions && awesomplete.suggestions.length > 0) {
        awesomplete.open();
      }
      window.dispatchEvent(new CustomEvent('resize'));
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
      let typeTitle;
      if (layerNameAttribute && idAttribute) {
        typeTitle = viewer.getLayer(item[layerNameAttribute]).get('title');
      } else if (geometryAttribute && layerName) {
        typeTitle = viewer.getLayer(item[layerName]).get('title');
      } else if (titleAttribute && contentAttribute && geometryAttribute) {
        typeTitle = item[titleAttribute];
      } else if (geometryAttribute && title) {
        typeTitle = title;
      } else if (easting && northing && title) {
        typeTitle = title;
      }
      if (typeTitle && typeTitle in group === false) {
        group[typeTitle] = [];
        item.header = typeTitle;
      }
      if (typeTitle) {
        group[typeTitle].push(item);
      } else if (id === 0) {
        console.error('Search options are missing');
      }
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
  The data-category attribute is used to make a layer division in the sugguestion list.
  */

  function initAutocomplete() {
    const input = document.getElementsByClassName('o-search-field')[0];

    awesomplete = new Awesomplete('.o-search-field', {
      minChars: minLength,
      autoFirst: false,
      sort: false,
      maxItems: limit,
      item: renderList,
      filter(suggestion, userInput) {
        const { value: suggestionValue } = suggestion;
        return suggestionValue.toLowerCase().includes(userInput.toLowerCase()) ? suggestionValue : false;
      }
    });

    const handler = function func(list) {
      awesomplete.list = list;
      awesomplete.evaluate();
    };

    const infowindowHandler = function func(list, searchVal) {
      const result = list.reduce((r, a) => {
        /* eslint-disable-next-line no-param-reassign */
        r[a[layerNameAttribute]] = r[a[layerNameAttribute]] || [];
        r[a[layerNameAttribute]].push(a);
        return r;
      }, Object.create(null));
      const groups = [];
      Object.keys(result).forEach((layername) => {
        const resultArray = result[layername];
        if (viewer.getLayer(layername)) {
          const layertitle = `${viewer.getLayer(layername).get('title')} (${resultArray.length})`;
          const rows = [];
          resultArray.forEach((element) => {
            const row = Component({
              addClick() {
                document.getElementById(this.getId()).addEventListener('click', () => {
                  const source = viewer.getMapSource();
                  const projCode = viewer.getProjectionCode();
                  const proj = viewer.getProjection();
                  const layer = viewer.getLayer(layername);
                  const id = element[idAttribute];
                  getFeature(id, layer, source, projCode, proj)
                    .then((res) => {
                      if (res.length > 0) {
                        const featureLayerName = layer.get('name');
                        const feature = res[0];
                        featureInfo.showFeatureInfo({ feature, layerName: featureLayerName });
                      }
                    });
                });
              },
              onInit() {
                this.addComponent(El({
                  cls: 'flex row align-center padding-left padding-right item',
                  tagName: 'div',
                  innerHTML: `${element[name]}`
                }));
              },
              render() {
                const content = this.getComponents().reduce((acc, item) => {
                  const rendered = item.render();
                  return acc + rendered;
                }, '');
                return `<li class="flex row text-smaller align-center padding-x padding-y-smaller hover pointer" id="${this.getId()}">${content}</li>`;
              }
            });
            rows.push(row);
          });

          const contentComponent = Component({
            onInit() {
              this.addComponents(rows);
            },
            onRender() {
              this.getComponents().forEach((comp) => {
                comp.addClick();
              });
            },
            render() {
              const content = this.getComponents().reduce((acc, item) => {
                const rendered = item.render();
                return acc + rendered;
              }, '');
              this.dispatch('render');
              return `<ul id="${this.getId()}">${content}</ul>`;
            }
          });

          const groupCmp = Collapse({
            cls: '',
            expanded: false,
            headerComponent: CollapseHeader({
              cls: 'hover padding-x padding-y-small grey-lightest border-bottom text-small',
              icon: '#ic_chevron_right_24px',
              title: layertitle
            }),
            contentComponent,
            collapseX: false
          });
          groups.push(groupCmp);
        }
      });

      let exportButton;
      if (Object.keys(result).length > 0 && searchlistOptions.export && searchlistOptions.exportUrl) {
        const roundButton = searchlistOptions.roundButton;
        const buttonIcon = searchlistOptions.roundButtonIcon || '#fa-download';
        const buttonText = searchlistOptions.exportButtonText || 'Export';
        const exportFileName = searchlistOptions.exportFilename || 'export.xlsx';

        exportButton = Button({
          cls: roundButton ? 'padding-small margin-bottom-smaller icon-smaller round light box-shadow o-tooltip margin-right-small' : 'export-button',
          style: roundButton ? 'position:absolute; bottom:0.2rem; left:0.75rem' : 'position:absolute; bottom:0.75rem; left:0.75rem',
          text: roundButton ? '' : buttonText,
          tooltipText: roundButton ? buttonText : '',
          icon: roundButton ? buttonIcon : '',
          click() {
            listExportHandler(
              searchlistOptions.exportUrl,
              result,
              exportFileName
            )
              .catch((err) => {
                console.error(err);
              });
          }
        });
      }

      const listcomponent = Component({
        name: 'searchlist',
        onInit() {
          this.addComponents(groups);
          if (exportButton) {
            this.addComponent(exportButton);
          }
        },
        onAdd() {
          this.render();
        },
        render() {
          const content = this.getComponents().reduce((acc, item) => acc + item.render(), '');
          return `${content}`;
        }
      });
      infowindow.changeContent(listcomponent, `Sökresultat för "${searchVal}"`);
    };

    function makeRequest(reqHandler, obj, opt, ignoreGroup = false) {
      const searchVal = obj.value;
      let queryUrl = `${url}${url.indexOf('?') !== -1 ? '&' : '?'}${queryParameterName}=${encodeURI(obj.value)}`;
      if (includeSearchableLayers) {
        queryUrl += `&l=${viewer.getSearchableLayers(searchableDefault)}`;
      }
      fetch(queryUrl)
        .then(response => response.json())
        .then((data) => {
          let list = [];
          searchDb = {};
          if (data.length) {
            setSearchDb(data);
            if (name && groupSuggestions && !ignoreGroup) {
              list = groupToList(groupDb(searchDb));
            } else {
              list = dbToList(data);
            }
          }
          reqHandler(list, searchVal, opt);
        });
    }

    input.addEventListener('keyup', (e) => {
      if (input.value.length >= minLength) {
        const keyCode = e.keyCode;
        if (keyCode === 13) {
          switch (searchlistPlacement) {
            case 'floating':
            case 'left':
              makeRequest(infowindowHandler, input, {}, true);
              clearAll();
              break;
            default:
              makeRequest(handler, input);
          }
        } else if (keyCode in keyCodes) {
          // empty
        } else {
          switch (autocompletePlacement) {
            case 'floating':
            case 'left':
              makeRequest(infowindowHandler, input);
              break;
            default:
              makeRequest(handler, input);
          }
        }
      }
    });
  }

  return Component({
    name: 'search',
    onAdd(evt) {
      viewer = evt.target;
      featureInfo = viewer.getControlByName('featureInfo');
      name = options.searchAttribute;
      if (!northing) northing = undefined;
      if (!easting) easting = undefined;
      /** idAttribute in combination with layerNameAttribute
     must be defined if search result should be selected */
      idAttribute = options.idAttribute;
      if (!layerNameAttribute) layerNameAttribute = undefined;
      if (!layerName) layerName = undefined;
      if (!title) title = '';
      if (!titleAttribute) titleAttribute = undefined;
      if (!contentAttribute) contentAttribute = undefined;
      groupSuggestions = Object.prototype.hasOwnProperty.call(options, 'groupSuggestions') ? options.groupSuggestions : false;
      includeSearchableLayers = Object.prototype.hasOwnProperty.call(options, 'includeSearchableLayers') ? options.includeSearchableLayers : false;
      searchableDefault = Object.prototype.hasOwnProperty.call(options, 'searchableDefault') ? options.searchableDefault : false;
      if (!maxZoomLevel) maxZoomLevel = viewer.getResolutions().length - 2 || viewer.getResolutions();
      if (!limit) limit = 9;
      if (!minLength) minLength = 4;
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
        cls: 'o-search-wrapper absolute top-center rounded-larger box-shadow bg-white',
        style: {
          'flex-wrap': 'wrap',
          overflow: 'visible'
        }
      });
    },
    hide() {
      document.getElementById(wrapperElement.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(wrapperElement.getId()).classList.remove('hidden');
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

      if (autocompletePlacement === 'floating' || searchlistPlacement === 'floating') {
        infowindow = Infowindow({ viewer,
          type: 'floating',
          contentComponent: El({
            tagName: 'div',
            cls: 'padding-y-small overflow-auto text-small',
            style: (searchlistOptions.export && searchlistOptions.exportUrl) ? 'margin-bottom:2.7rem' : ''
          })
        });
        this.addComponent(infowindow);
      } else if (autocompletePlacement === 'left' || searchlistPlacement === 'left') {
        infowindow = Infowindow({ viewer,
          type: 'left',
          contentComponent: El({
            tagName: 'div',
            cls: 'padding-y-small overflow-auto text-small',
            style: (searchlistOptions.export && searchlistOptions.exportUrl) ? 'margin-bottom:2.7rem' : ''
          })
        });
        this.addComponent(infowindow);
      }

      this.dispatch('render');
    }
  });
};

export default Search;
