import cu from 'ceeu';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import geom from 'ol/geom/geometry';
import Map from './map';
import proj from './projection';
import mapSizeChanger from './utils/mapsizechanger';
import Featureinfo from './featureinfo';
import maputils from './maputils';
import Layer from './layer';
import Main from './components/main';
import Footer from './components/footer';

const Viewer = function Viewer(targetOption, options = {}) {
  let map;
  let tileGrid;
  let featureinfo;

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
    groups = [],
    mapGrid = true,
    pageSettings = {},
    projectionCode,
    projectionExtent,
    extent = [],
    center: centerOption = [0, 0],
    zoom: zoomOption = 0,
    resolutions = null,
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
  const defaultTileGridOptions = {
    alignBottomLeft: true,
    extent,
    resolutions,
    tileSize: [256, 256]
  };
  const tileGridSettings = Object.assign({}, defaultTileGridOptions, tileGridOptions);
  const mapGridCls = mapGrid ? 'o-mapgrid' : '';
  const cls = `${clsOptions} ${mapGridCls} ${mapCls} cu`.trim();
  const footerData = pageSettings.footer || {};
  const main = Main();
  const footer = Footer({
    footerData
  });

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

  const getMapName = () => mapName;

  const getTileGrid = () => tileGrid;

  const getTileGridSettings = () => tileGridSettings;

  const getTileSize = () => tileGridSettings.tileSize;

  const getUrl = () => url;

  const getStyle = (styleName) => {
    if (styleName in styles) {
      return styles[styleName];
    }
    throw new Error(`There is no style named ${styleName}`);
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

  const getGroup = function getGroup(group) {
    return getLayers().filter(obj => obj.get('group') === group);
  };

  const getSource = function getSource(name) {
    if (name in source) {
      return source[name];
    }
    throw new Error(`There is no source with name: ${name}`);
  };

  const flattenGroups = function flattenGroups(arr, parent) {
    return arr.reduce((acc, item) => {
      const group = Object.assign({}, item);
      if (parent) group.parent = parent;
      if (group.groups) {
        const parentGroup = Object.assign({}, group);
        delete parentGroup.groups;
        return acc.concat(parentGroup, flattenGroups(group.groups, parentGroup.name));
      }
      acc.push(group);
      return acc;
    }, []);
  };

  const getGroups = function getGroups(flat = true) {
    if (flat) return flattenGroups(groups);
    return groups;
  };

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

  const getTarget = () => target;

  const getClusterOptions = () => clusterOptions;

  const getConsoleId = () => consoleId;

  const getInitialZoom = () => zoom;

  const getFooter = () => footer;

  const getMain = () => main;

  const mergeSavedLayerProps = (initialLayerProps, savedLayerProps) => {
    if (savedLayerProps) {
      const mergedLayerProps = initialLayerProps.reduce((acc, initialProps) => {
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
      return mergedLayerProps;
    }
    return initialLayerProps;
  };

  const removeLayer = function removeLayer(name) {
    // getLayers.forEach((layer, i, obj) => {
    //   if (layer.get('name') === name) {
    //     obj.splice(i, 1);
    //   }
    // });

    // const $ul = $('#o-mapmenu').find(`#${name}`).closest('ul');
    // $ul.find(`#${name}`).remove();
    // if ($ul.children().length === 1) {
    //   $ul.remove();
    // }

    // $(`#o-legend-${name}`).remove();
    // map.removeLayer(getLayersByProperty('name', name)[0]);
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
    this.dispatch('addlayer', { layerName: layerProps.name });
  };

  const addLayers = function addLayers(layersProps) {
    layersProps.reverse().forEach((layerProps) => {
      this.addLayer(layerProps);
    });
  };

  const addGroup = function addGroup(groupOptions) {
    const name = groupOptions.name;
    if (!(groups.filter(group => group.name === name).length)) {
      groups.push(groupOptions);
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

  return cu.Component({
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

      const layerProps = mergeSavedLayerProps(layerOptions, urlParams.layers);
      this.addLayers(layerProps);

      mapSizeChanger(map, {
        breakPoints,
        breakPointsPrefix,
        mapId: this.getId()
      });

      if (urlParams.pin) {
        featureinfoOptions.savedPin = urlParams.pin;
      } else if (urlParams.selection) {
        // This needs further development for proper handling in permalink
        featureinfoOptions.savedSelection = new Feature({
          geometry: new geom[urlParams.selection.geometryType](urlParams.selection.coordinates)
        });
      }
      featureinfoOptions.viewer = this;
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
    getResolutions,
    getSearchableLayers,
    getLayer,
    getLayers,
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
    removeLayer,
    removeOverlays,
    zoomToExtent
  });
};

export default Viewer;
