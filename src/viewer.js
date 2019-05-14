import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import geom from 'ol/geom/Geometry';
import { Component } from './ui';
import Map from './map';
import proj from './projection';
import getCapabilities from './getCapabilities';
import MapSize from './utils/mapsize';
import Featureinfo from './featureinfo';
import Selectionmanager from './selectionmanager';
import maputils from './maputils';
import Layer from './layer';
import Main from './components/main';
import Footer from './components/footer';
import flattenGroups from './utils/flattengroups';
import getattributes from './getattributes';
import getcenter from './geometry/getcenter';

const Viewer = function Viewer(targetOption, options = {}) {
  let map;
  let tileGrid;
  let featureinfo;
  let selectionmanager;

  let {
    projection
  } = options;

  const {
    baseUrl = '',
    breakPoints,
    breakPointsPrefix,
    clsOptions = '',
    consoleId = 'o-console',
    mapCls = 'o-map',
    controls = [],
    enableRotation = true,
    featureinfoOptions = {},
    groups: groupOptions = [],
    mapGrid = true,
    pageSettings = {},
    projectionCode,
    projectionExtent,
    extent = [],
    center: centerOption = [0, 0],
    zoom: zoomOption = 0,
    resolutions = null,
    capabilitiesURL = null,
    layers: layerOptions = [],
    map: mapName,
    params: urlParams = {},
    proj4Defs,
    styles = {},
    source = {},
    clusterOptions = {},
    tileGridOptions = {},
    url
  } = options;

  const target = targetOption;
  const center = urlParams.center || centerOption;
  const zoom = urlParams.zoom || zoomOption;
  const groups = flattenGroups(groupOptions);
  const getCapabilitiesLayers = (capabilitiesURL === null) ? null : getCapabilities(capabilitiesURL);
  const defaultTileGridOptions = {
    alignBottomLeft: true,
    extent,
    resolutions,
    tileSize: [256, 256]
  };
  const tileGridSettings = Object.assign({}, defaultTileGridOptions, tileGridOptions);
  const mapGridCls = mapGrid ? 'o-mapgrid' : '';
  const cls = `${clsOptions} ${mapGridCls} ${mapCls} o-ui`.trim();
  const footerData = pageSettings.footer || {};
  const main = Main();
  const footer = Footer({
    footerData
  });
  let mapSize;

  const addControl = function addControl(control) {
    if (control.onAdd && control.dispatch) {
      this.addComponent(control);
    } else {
      throw new Error('Valid control must have onAdd and dispatch methods');
    }
  };

  const addControls = function addControls() {
    controls.forEach((control) => {
      this.addControl(control);
    });
  };

  const getExtent = () => extent;

  const getBaseUrl = () => baseUrl;

  const getBreakPoints = function getBreakPoints(size) {
    return size && size in breakPoints ? breakPoints[size] : breakPoints;
  };

  const getFeatureinfo = () => featureinfo;

  const getSelectionManager = () => selectionmanager;

  const getMapName = () => mapName;

  const getTileGrid = () => tileGrid;

  const getTileGridSettings = () => tileGridSettings;

  const getTileSize = () => tileGridSettings.tileSize;

  const getUrl = () => url;

  const getStyle = (styleName) => {
    if (styleName in styles) {
      return styles[styleName];
    }
    return null;
  };

  const getStyles = () => styles;

  const getResolutions = () => resolutions;

  const getMapUrl = () => {
    let layerNames = '';
    let mapUrl;

    // delete search arguments if present
    if (window.location.search) {
      mapUrl = window.location.href.replace(window.location.search, '?');
    } else {
      mapUrl = `${window.location.href}?`;
    }
    const mapView = map.getView();
    const centerCoords = mapView.getCenter().map(coord => parseInt(coord, 10));
    const zoomLevel = mapView.getZoom();
    const layers = map.getLayers();

    // add layer if visible
    layers.forEach((el) => {
      if (el.getVisible() === true) {
        layerNames += `${el.get('name')};`;
      } else if (el.get('legend') === true) {
        layerNames += `${el.get('name')},1;`;
      }
    });
    return `${mapUrl}${centerCoords}&${zoomLevel}&${layerNames.slice(0, layerNames.lastIndexOf(';'))}`;
  };

  const getMap = () => map;

  const getLayers = () => map.getLayers().getArray();

  const getLayersByProperty = function getLayersByProperty(key, val, byName) {
    const layers = map.getLayers().getArray().filter(layer => layer.get(key) && layer.get(key) === val);

    if (byName) {
      return layers.map(layer => layer.get('name'));
    }
    return layers;
  };

  const getLayer = layerName => getLayers().filter(layer => layer.get('name') === layerName)[0];

  const getQueryableLayers = function getQueryableLayers() {
    const queryableLayers = getLayers().filter(layer => layer.get('queryable') && layer.getVisible());
    return queryableLayers;
  };

  const getGroupLayers = function getGroupLayers() {
    const groupLayers = getLayers().filter(layer => layer.get('type') === "GROUP");
    return groupLayers;
  };

  const getLayerGroups = () => getLayers().filter(layer => layer.get('type') === 'GROUP');

  const getSearchableLayers = function getSearchableLayers(searchableDefault) {
    const searchableLayers = [];
    map.getLayers().forEach((layer) => {
      let searchable = layer.get('searchable');
      const visible = layer.getVisible();
      searchable = searchable === undefined ? searchableDefault : searchable;
      if (searchable === 'always' || (searchable && visible)) {
        searchableLayers.push(layer.get('name'));
      }
    });
    return searchableLayers;
  };

  const getGroup = function getGroup(groupName) {
    return groups.find(group => group.name === groupName);
  };

  const getSource = function getSource(name) {
    if (name in source) {
      return source[name];
    }
    throw new Error(`There is no source with name: ${name}`);
  };

  const getGroups = () => groups;

  const getProjectionCode = () => projectionCode;

  const getProjection = () => projection;

  const getMapSource = () => source;

  const getControlByName = function getControlByName(name) {
    const components = this.getComponents();
    const control = components.find(component => component.name === name);
    if (!control) {
      return null;
    }
    return control;
  };

  const getSize = function getSize() {
    return mapSize.getSize();
  };

  const getTarget = () => target;

  const getClusterOptions = () => clusterOptions;

  const getConsoleId = () => consoleId;

  const getInitialZoom = () => zoom;

  const getFooter = () => footer;

  const getMain = () => main;

  const mergeSecuredLayer = (layerlist, capabilitiesLayers) => {
    if (capabilitiesLayers !== null) {
      layerlist.forEach((layer) => {
        if (capabilitiesLayers.indexOf(layer.name) >= 0) {
          layer.secure = false;
        } else {
          layer.secure = true;
        }
      });
    }
    return layerlist;
  };

  const mergeSavedLayerProps = (initialLayerProps, savedLayerProps, capabilitiesLayers) => {
    let mergedLayerProps;
    if (savedLayerProps) {
      mergedLayerProps = initialLayerProps.reduce((acc, initialProps) => {
        const layerName = initialProps.name.split(':').pop();
        const savedProps = savedLayerProps[layerName] || {
          visible: false,
          legend: false
        };
        savedProps.name = initialProps.name;
        const mergedProps = Object.assign({}, initialProps, savedProps);
        acc.push(mergedProps);
        return acc;
      }, []);
      return mergeSecuredLayer(mergedLayerProps, capabilitiesLayers);
    }
    return mergeSecuredLayer(initialLayerProps, capabilitiesLayers);
  };

  const removeOverlays = function removeOverlays(overlays) {
    if (overlays) {
      if (overlays.constructor === Array || overlays instanceof Collection) {
        overlays.forEach((overlay) => {
          map.removeOverlay(overlay);
        });
      } else {
        map.removeOverlay(overlays);
      }
    } else {
      map.getOverlays().clear();
    }
  };

  const setMap = function setMap(newMap) {
    map = newMap;
  };

  const setProjection = function setProjection(newProjection) {
    projection = newProjection;
  };

  const zoomToExtent = function zoomToExtent(geometry, level) {
    const view = map.getView();
    const maxZoom = level;
    const geometryExtent = geometry.getExtent();
    if (geometryExtent) {
      view.fit(geometryExtent, {
        maxZoom
      });
      return geometryExtent;
    }
    return false;
  };

  const addLayer = function addLayer(layerProps) {
    const layer = Layer(layerProps, this);
    map.addLayer(layer);
    this.dispatch('addlayer', { 
      layerName: layerProps.name 
    });
  };

  const addLayers = function addLayers(layersProps) {
    layersProps.reverse().forEach((layerProps) => {
      this.addLayer(layerProps);
    });
  };

  const addGroup = function addGroup(groupProps) {
    const defaultProps = { 
      type: 'group'
    };
    const groupDef = Object.assign({}, defaultProps, groupProps);
    const name = groupDef.name;
    if (!(groups.filter(group => group.name === name).length)) {
      groups.push(groupDef);
      this.dispatch('add:group', { 
        group: groupDef 
      });
    }
  };

  const addGroups = function addGroups(groupsProps) {
    groupsProps.forEach((groupProps) => {
      this.addGroup(groupProps);
    });
  };

  // removes group and any depending subgroups and layers
  const removeGroup = function removeGroup(groupName) {
    const group = groups.find(item => item.name === groupName);
    if (group) {
      const layers = getLayersByProperty('group', groupName);
      layers.forEach((layer) => {
        map.removeLayer(layer);
      });
      const groupIndex = groups.indexOf(group);
      groups.splice(groupIndex, 1);
      this.dispatch('remove:group', { 
        group
      });
    }
    const subgroups = groups.filter((item) => {
      if (item.parent) {
        return item.parent === groupName;
      }
      return false;
    });
    if (subgroups.length) {
      subgroups.forEach((subgroup) => {
        const name = subgroup.name;
        removeGroup(groups[name]);
      });
    }
  };

  const addSource = function addSource(sourceName, sourceProps) {
    if (!(sourceName in source)) {
      source[sourceName] = sourceProps;
    }
  };

  const addStyle = function addStyle(styleName, styleProps) {
    if (!(styleName in styles)) {
      styles[styleName] = styleProps;
    }
  };

  return Component({
    onInit() {
      this.render();

      proj.registerProjections(proj4Defs);
      setProjection(proj.Projection({
        projectionCode,
        projectionExtent
      }));

      tileGrid = maputils.tileGrid(tileGridSettings);

      setMap(Map({
        extent,
        getFeatureinfo,
        projection,
        center,
        resolutions,
        zoom,
        enableRotation,
        target: this.getId()
      }));

      const layerProps = mergeSavedLayerProps(layerOptions, urlParams.layers, getCapabilitiesLayers);
      this.addLayers(layerProps);

      mapSize = MapSize(map, {
        breakPoints,
        breakPointsPrefix,
        mapId: this.getId()
      });

      if (urlParams.feature) {
        const featureId = urlParams.feature;
        const layerName = featureId.split('.')[0];
        const layer = getLayer(layerName);
        if (layer) {
          layer.once('render', () => {
            let feature;
            const type = layer.get('type');
            feature = layer.getSource().getFeatureById(featureId);
            if (type === 'WFS') {
              feature = layer.getSource().getFeatureById(featureId);
            } else {
              const id = featureId.split('.')[1];
              let origin = layer.getSource();
              feature = origin.getFeatureById(id);
              // feature has no id it is not found it maybe a cluster, therefore try again.
              if (feature === null && type !== 'TOPOJSON') {
                origin = origin.getSource();
                feature = origin.getFeatureById(id);
              }
            }
            if (feature) {
              const obj = {};
              obj.feature = feature;
              obj.title = layer.get('title');
              obj.content = getattributes(feature, layer);
              obj.layer = layer;
              const centerGeometry = getcenter(feature.getGeometry());
              featureinfo.render([obj], 'overlay', centerGeometry);
              map.getView().animate({
                center: getcenter(feature.getGeometry()),
                zoom: getResolutions().length - 2
              });
            }
          });
        }
      }

      if (urlParams.pin) {
        featureinfoOptions.savedPin = urlParams.pin;
      } else if (urlParams.selection) {
        // This needs further development for proper handling in permalink
        featureinfoOptions.savedSelection = new Feature({
          geometry: new geom[urlParams.selection.geometryType](urlParams.selection.coordinates)
        });
      }
      featureinfoOptions.viewer = this;

      selectionmanager = Selectionmanager(featureinfoOptions);
      this.addComponent(selectionmanager);

      featureinfo = Featureinfo(featureinfoOptions);
      this.addComponent(featureinfo);

      this.addControls();
    },
    render() {
      const htmlString = `<div id="${this.getId()}" class="${cls}">
                            <div class="transparent flex column height-full width-full absolute top-left no-margin z-index-low">
                              ${main.render()}
                              ${footer.render()}
                            </div>
                          </div>`;
      const el = document.querySelector(target);
      el.innerHTML = htmlString;
      this.dispatch('render');
    },
    addControl,
    addControls,
    addGroup,
    addGroups,
    addLayer,
    addLayers,
    addSource,
    addStyle,
    getBaseUrl,
    getBreakPoints,
    getClusterOptions,
    getConsoleId,
    getControlByName,
    getExtent,
    getFeatureinfo,
    getFooter,
    getInitialZoom,
    getTileGridSettings,
    getGroup,
    getGroups,
    getMain,
    getMapSource,
    getQueryableLayers,
    getGroupLayers,
    getResolutions,
    getSearchableLayers,
    getSize,
    getLayer,
    getLayers,
    getLayerGroups,
    getLayersByProperty,
    getMap,
    getMapName,
    getMapUrl,
    getProjection,
    getProjectionCode,
    getSource,
    getStyle,
    getStyles,
    getTarget,
    getTileGrid,
    getTileSize,
    getUrl,
    removeGroup,
    removeOverlays,
    zoomToExtent,
    getSelectionManager
  });
};

export default Viewer;
