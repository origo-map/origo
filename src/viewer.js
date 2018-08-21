import cu from 'codesketch';
import Collection from 'ol/collection';
import Feature from 'ol/feature';
import geom from 'ol/geom/geometry';
import Map from './map';
import proj from './projection';
import viewerTemplate from './templates/viewertemplate';
import mapSizeChanger from './utils/mapsizechanger';
import Featureinfo from './featureinfo';
import maputils from './maputils';
import Layer from './layer';

const Viewer = function Viewer(targetOption, options = {}) {
  let map;
  let tileGrid;
  let featureinfo;

  let {
    projection
  } = options;

  const {
    baseUrl,
    breakPoints,
    breakPointsPrefix,
    clsOptions = '',
    consoleId = 'o-console',
    mapTarget = 'o-map',
    controls = [],
    enableRotation = true,
    featureinfoOptions = {},
    groups = [],
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

  let pageSettings;
  const target = targetOption;
  const pageTemplate = {};
  const center = urlParams.center || centerOption;
  const zoom = urlParams.zoom || zoomOption;
  const defaultTileGridOptions = {
    alignBottomLeft: true,
    extent,
    resolutions,
    tileSize: [256, 256]
  };
  const tileGridSettings = Object.assign({}, defaultTileGridOptions, tileGridOptions);
  const cls = `${clsOptions} ${mapTarget} cu`.trim();

  const addLayer = function addLayer(layerProps) {
    const layer = Layer(layerProps, this);
    map.addLayer(layer);
  };

  const addLayers = function addLayers(layersProps) {
    layersProps.reverse().forEach((layerProps) => {
      this.addLayer(layerProps);
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

  const getStyleSettings = () => styles;

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

  const getSubGroups = function getSubgroups() {
    const subgroups = [];

    function findSubgroups(targetGroups, n) {
      if (n >= targetGroups.length) {
        return;
      }

      if (targetGroups[n].groups) {
        targetGroups[n].groups.forEach((subgroup) => {
          subgroups.push(subgroup);
        });

        findSubgroups(targetGroups[n].groups, 0);
      }

      findSubgroups(targetGroups, n + 1);
    }

    findSubgroups(groups, 0);
    return subgroups;
  };

  const getGroups = function getGroups(opt) {
    if (opt === 'top') {
      return groups;
    } else if (opt === 'sub') {
      return getSubGroups();
    }
    return groups.concat(getSubGroups());
  };

  const getProjectionCode = () => projectionCode;

  const getProjection = () => projection;

  const getMapSource = () => source;

  const getMapTarget = () => mapTarget;

  const getControlNames = () => controls.map(obj => obj.name);

  const getTarget = () => target;

  const getClusterOptions = () => clusterOptions;

  const getConsoleId = () => consoleId;

  const getInitialZoom = () => zoom;

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
        target: mapTarget
      }));

      const layerProps = mergeSavedLayerProps(layerOptions, urlParams.layers);
      this.addLayers(layerProps);

      mapSizeChanger(map, {
        breakPoints,
        breakPointsPrefix,
        mapTarget
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
    },
    render() {
      pageTemplate.mapClass = cls;

      if (pageSettings) {
        if (pageSettings.footer) {
          if ('img' in pageSettings.footer) {
            pageTemplate.img = pageSettings.footer.img;
          }
          if ('text' in pageSettings.footer) {
            pageTemplate.text = pageSettings.footer.text;
          }
          if ('url' in pageSettings.footer) {
            pageTemplate.url = pageSettings.footer.url;
          }
          if ('urlText' in pageSettings.footer) {
            pageTemplate.urlText = pageSettings.footer.urlText;
          }
        }
        if (pageSettings.mapGrid) {
          if ('visible' in pageSettings.mapGrid && pageSettings.mapGrid.visible === true) {
            pageTemplate.mapClass = 'o-map o-map-grid';
          }
        }
      }
      const htmlString = viewerTemplate(pageTemplate);
      const el = document.querySelector(target);
      el.innerHTML = htmlString;
      this.dispatch('render');
    },
    addLayer,
    addLayers,
    getBaseUrl,
    getBreakPoints,
    getClusterOptions,
    getConsoleId,
    getControlNames,
    getExtent,
    getInitialZoom,
    getTileGridSettings,
    getGroup,
    getGroups,
    getMapSource,
    getMapTarget,
    getQueryableLayers,
    getResolutions,
    getSearchableLayers,
    getSubGroups,
    getLayer,
    getLayers,
    getLayersByProperty,
    getMap,
    getMapName,
    getMapUrl,
    getProjection,
    getProjectionCode,
    getStyleSettings,
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
