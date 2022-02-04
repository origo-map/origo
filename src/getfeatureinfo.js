import EsriJSON from 'ol/format/EsriJSON';
import maputils from './maputils';
import SelectedItem from './models/SelectedItem';

function createSelectedItem(feature, layer, map, groupLayers) {
  // Above functions have no way of knowing whether the layer is part of a LayerGroup or not, therefore we need to check every layer against the groupLayers.
  const layerName = layer.get('name');
  let groupLayer;
  groupLayers.forEach((gl) => {
    const subLayers = gl.getLayers().getArray();
    const layerBelongsToGroup = subLayers.some((lyr) => lyr.get('name') === layerName);
    if (layerBelongsToGroup) {
      groupLayer = gl;
    }
  });

  let selectionGroup;
  let selectionGroupTitle;

  if (groupLayer) {
    selectionGroup = groupLayer.get('name');
    selectionGroupTitle = groupLayer.get('title');
  } else {
    selectionGroup = layer.get('name');
    selectionGroupTitle = layer.get('title');
  }

  // Add pseudo attributes to make sure they exist when the SelectedItem is created as the content is created in constructor
  // Ideally we would also populate here, but that is an async operation and will break the api.
  const attachments = layer.get('attachments');
  if (attachments) {
    attachments.groups.forEach(a => {
      if (a.linkAttribute) {
        feature.set(a.linkAttribute, '');
      }
      if (a.fileNameAttribute) {
        feature.set(a.fileNameAttribute, '');
      }
    });
  }
  const relatedLayers = layer.get('relatedLayers');
  if (relatedLayers) {
    relatedLayers.forEach(currLayer => {
      if (currLayer.promoteAttribs) {
        currLayer.promoteAttribs.forEach(currAttrib => {
          feature.set(currAttrib.parentName, '');
        });
      }
    });
  }
  return new SelectedItem(feature, layer, map, selectionGroup, selectionGroupTitle);
}

function getFeatureInfoUrl({
  coordinate,
  resolution,
  projection
}, layer) {
  const url = layer.getSource().getFeatureInfoUrl(coordinate, resolution, projection, {
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '20'
  });
  return fetch(url, { type: 'GET' }).then((res) => {
    if (res.error) {
      return [];
    }
    return res.json();
  }).then(json => maputils.geojsonToFeature(json)).catch(error => console.error(error));
}

function getAGSIdentifyUrl({ layer, coordinate }, viewer) {
  const map = viewer.getMap();
  const projectionCode = viewer.getProjectionCode();
  const esriSrs = projectionCode.split(':').pop();
  const layerId = layer.get('id');
  const source = viewer.getMapSource()[layer.get('sourceName')];
  const serverUrl = source.url;
  const esrijsonFormat = new EsriJSON();
  const size = map.getSize();
  const tolerance = 'tolerance' in source ? source.tolerance.toString() : 5;
  const extent = map.getView().calculateExtent(size);

  const url = [`${serverUrl}`,
    '/identify?f=json',
    '&returnGeometry=true',
    '&geometryType=esriGeometryPoint',
    `&sr=${esriSrs}`,
    `&geometry=${coordinate}`,
    '&outFields=*',
    '&geometryPrecision=2',
    `&tolerance=${tolerance}`,
    `&layers=all:${layerId}`,
    `&mapExtent=${extent}`,
    `&imageDisplay=${size},96`].join('');
  return fetch(url, { type: 'GET', dataType: 'jsonp' }).then((res) => {
    if (res.error) {
      return [];
    }
    return res.json();
  }).then((json) => {
    const obj = {};
    obj.features = json.results;
    const features = esrijsonFormat.readFeatures(obj, {
      featureProjection: viewer.getProjection()
    });
    return features;
  }).catch(error => console.error(error));
}

function isTainted({
  pixel,
  layerFilter,
  map
}) {
  try {
    if (layerFilter) {
      map.forEachLayerAtPixel(pixel, (layer) => layerFilter === layer);
    }

    return false;
  } catch (e) {
    console.error(e);
    return true;
  }
}

function layerAtPixel({
  pixel,
  matchLayer,
  map
}) {
  map.forEachLayerAtPixel(pixel, (layer) => matchLayer === layer);
}

function getGetFeatureInfoRequest({ layer, coordinate }, viewer) {
  const layerType = layer.get('type');
  const obj = {};
  const projection = viewer.getProjection();
  const resolution = viewer.getMap().getView().getResolution();
  obj.layer = layer.get('name');

  switch (layerType) {
    case 'WMTS':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest({ layer: featureinfoLayer, coordinate }, viewer);
      }
      break;
    case 'WMS':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest({ layer: featureinfoLayer, coordinate }, viewer);
      }
      obj.cb = 'GEOJSON';
      obj.fn = getFeatureInfoUrl({ coordinate, resolution, projection }, layer);
      return obj;
    case 'AGS_TILE':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest({ layer: featureinfoLayer, coordinate }, viewer);
      }
      obj.fn = getAGSIdentifyUrl({ layer, coordinate }, viewer);
      return obj;
    default:
      return null;
  }

  return null;
}

function getFeatureInfoRequests({
  coordinate,
  layers,
  map,
  pixel
}, viewer) {
  const requests = [];
  // Check for support of crossOrigin in image, absent in IE 8 and 9
  if ('crossOrigin' in new (Image)()) {
    map.forEachLayerAtPixel(pixel, (layer) => {
      if (layer.get('queryable')) {
        const item = getGetFeatureInfoRequest({ layer, coordinate }, viewer);
        if (item) {
          requests.push(item);
        }
      }
    });
  } else if (isTainted({ map, pixel })) { // If canvas is tainted
    layers.forEach((layer) => {
      if (layer.get('queryable')) {
        // If layer is tainted, then create request for layer
        if (isTainted({ pixel, layer, map })) {
          const item = getGetFeatureInfoRequest({ layer, coordinate }, viewer);
          if (item) {
            requests.push(item);
          }
        } else if (layerAtPixel({ pixel, layer, map })) { // If layer is not tainted, test if layer hit at pixel
          const item = getGetFeatureInfoRequest({ layer, coordinate }, viewer);
          if (item) {
            requests.push(item);
          }
        }
      }
    });
  } else { // If crossOrigin is not supported and canvas not tainted
    map.forEachLayerAtPixel(pixel, (layer) => {
      if (layer.get('queryable') === true) {
        const item = getGetFeatureInfoRequest({ layer, coordinate }, viewer);
        if (item) {
          requests.push(item);
        }
      }
    });
  }
  return requests;
}

function getFeaturesFromRemote(requestOptions, viewer) {
  const requestResult = [];

  const requestPromises = getFeatureInfoRequests(requestOptions, viewer).map((request) => request.fn.then((features) => {
    const layer = viewer.getLayer(request.layer);
    const groupLayers = viewer.getGroupLayers();
    const map = viewer.getMap();
    if (features) {
      features.forEach((feature) => {
        const si = createSelectedItem(feature, layer, map, groupLayers);
        requestResult.push(si);
      });
      return requestResult;
    }

    return false;
  }));
  return Promise.all([...requestPromises]).then(() => requestResult).catch(error => console.log(error));
}

function getFeaturesAtPixel({
  clusterFeatureinfoLevel,
  coordinate,
  hitTolerance,
  map,
  pixel
}, viewer) {
  const result = [];
  let cluster = false;
  const resolutions = map.getView().getResolutions();
  const groupLayers = viewer.getGroupLayers();
  map.forEachFeatureAtPixel(pixel, (feature, layer) => {
    let queryable = false;
    if (layer) {
      queryable = layer.get('queryable');
    }
    if (feature.get('features') && queryable) {
      // If cluster
      const collection = feature.get('features');
      if (collection.length > 1) {
        const zoom = map.getView().getZoom();
        const zoomLimit = clusterFeatureinfoLevel === -1 ? resolutions.length : zoom + clusterFeatureinfoLevel;
        if (zoomLimit < resolutions.length) {
          map.getView().setCenter(coordinate);
          map.getView().setZoom(zoom + 1);
          cluster = true;
          return true;
        }
        collection.forEach((f) => {
          const si = createSelectedItem(f, layer, map, groupLayers);
          result.push(si);
        });
      } else if (collection.length === 1 && queryable) {
        const si = createSelectedItem(collection[0], layer, map, groupLayers);
        result.push(si);
      }
    } else if (queryable) {
      const si = createSelectedItem(feature, layer, map, groupLayers);
      result.push(si);
    }

    return false;
  }, {
    hitTolerance
  });

  if (cluster) {
    return false;
  }
  return result;
}

export default {
  createSelectedItem,
  getFeaturesFromRemote,
  getFeaturesAtPixel
};
