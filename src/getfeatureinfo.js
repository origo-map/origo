import EsriJSON from 'ol/format/EsriJSON';
import $ from 'jquery';
import viewer from './viewer';
import maputils from './maputils';
import getAttributes from './getattributes';
import featureInfo from './featureinfo';

let map;

function getGetFeatureInfoUrl(layer, coordinate) {
  const resolution = map.getView().getResolution();
  const projection = viewer.getProjection();
  const url = layer.getSource().getGetFeatureInfoUrl(coordinate, resolution, projection, {
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '20'
  });

  return $.ajax(url, {
    type: 'post'
  })
    .then((response) => {
      if (response.error) {
        return [];
      }
      return maputils.geojsonToFeature(response);
    });
}

function getAGSIdentifyUrl(layer, coordinate) {
  const projectionCode = viewer.getProjectionCode();
  const esriSrs = projectionCode.split(':').pop();
  const layerId = layer.get('id');
  const source = viewer.getMapSource()[layer.get('sourceName')];
  const serverUrl = source.url;
  const esrijsonFormat = new EsriJSON();
  const size = map.getSize();
  const tolerance = Object.prototype.hasOwnProperty.call(source, 'tolerance') ? source.tolerance.toString() : 5;
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

  return $.ajax({
    url,
    dataType: 'jsonp'
  })
    .then((response) => {
      if (response.error) {
        return [];
      }
      const obj = {};
      obj.features = response.results;
      const features = esrijsonFormat.readFeatures(obj, {
        featureProjection: viewer.getProjection()
      });
      return features;
    });
}

function isTainted(pixel, layerFilter) {
  try {
    if (layerFilter) {
      map.forEachLayerAtPixel(pixel, layer => layerFilter === layer);
    }

    return false;
  } catch (e) {
    console.log(e);
    return true;
  }
}

function layerAtPixel(pixel, matchLayer) {
  map.forEachLayerAtPixel(pixel, layer => matchLayer === layer);
}

function getGetFeatureInfoRequest(layer, coordinate) {
  const layerType = layer.get('type');
  const obj = {};
  obj.layer = layer.get('name');

  switch (layerType) {
    case 'WMTS':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
      }
      break;
    case 'WMS':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
      }
      obj.cb = 'GEOJSON';
      obj.fn = getGetFeatureInfoUrl(layer, coordinate);
      return obj;
    case 'AGS_TILE':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest(featureinfoLayer, coordinate);
      }
      obj.fn = getAGSIdentifyUrl(layer, coordinate);
      return obj;
    default:
      return null;
  }

  return null;
}

function getFeatureInfoRequests(evt) {
  const requests = [];
  // Check for support of crossOrigin in image, absent in IE 8 and 9
  if ('crossOrigin' in new (Image)()) {
    map.forEachLayerAtPixel(evt.pixel, (layer) => {
      if (layer.get('queryable')) {
        const item = getGetFeatureInfoRequest(layer, evt.coordinate);
        if (item) {
          requests.push(item);
        }
      }
    });
  } else if (isTainted(evt.pixel)) { // If canvas is tainted
    const layers = viewer.getQueryableLayers();
    layers.forEach((layer) => {
      if (layer.get('queryable')) {
        // If layer is tainted, then create request for layer
        if (isTainted(evt.pixel, layer)) {
          const item = getGetFeatureInfoRequest(layer, evt.coordinate);
          if (item) {
            requests.push(item);
          }
        } else if (layerAtPixel(evt.pixel, layer)) { // If layer is not tainted, test if layer hit at pixel
          const item = getGetFeatureInfoRequest(layer, evt.coordinate);
          if (item) {
            requests.push(item);
          }
        }
      }
    });
  } else { // If crossOrigin is not supported and canvas not tainted
    map.forEachLayerAtPixel(evt.pixel, (layer) => {
      if (layer.get('queryable') === true) {
        const item = getGetFeatureInfoRequest(layer, evt.coordinate);
        if (item) {
          requests.push(item);
        }
      }
    });
  }
  return requests;
}

function getFeaturesFromRemote(evt) {
  map = viewer.getMap();
  const requestResult = [];
  const requestPromises = getFeatureInfoRequests(evt).map(request => request.fn.then((features) => {
    const layer = viewer.getLayer(request.layer);
    if (features) {
      features.forEach((feature) => {
        requestResult.push({
          title: layer.get('title'),
          feature,
          content: getAttributes(feature, layer),
          layer: layer.get('name')
        });
      });
      return requestResult;
    }

    return false;
  }));
  return $.when(...requestPromises).then(() => requestResult);
}

function getFeaturesAtPixel(evt, clusterFeatureinfoLevel) {
  map = viewer.getMap();
  const result = [];
  let cluster = false;
  map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    const l = layer;
    let queryable = false;
    if (layer) {
      queryable = layer.get('queryable');
    }
    if (feature.get('features') && queryable) {
      // If cluster
      const collection = feature.get('features');
      if (collection.length > 1) {
        const zoom = map.getView().getZoom();
        const zoomLimit = clusterFeatureinfoLevel === -1 ? viewer.getResolutions().length : zoom + clusterFeatureinfoLevel;
        if (zoomLimit < viewer.getResolutions().length) {
          map.getView().setCenter(evt.coordinate);
          map.getView().setZoom(zoom + 1);
          cluster = true;
          return true;
        }
        collection.forEach((f) => {
          const item = {};
          item.title = l.get('title');
          item.feature = f;
          item.content = getAttributes(f, l);
          item.name = l.get('name');
          result.push(item);
        });
      } else if (collection.length === 1 && queryable) {
        const item = {};
        item.title = l.get('title');
        item.feature = collection[0];
        item.content = getAttributes(collection[0], l);
        item.name = l.get('name');
        item.layer = l;
        result.push(item);
      }
    } else if (queryable) {
      const item = {};
      item.title = l.get('title');
      item.feature = feature;
      item.content = getAttributes(feature, l);
      item.name = l.get('name');
      item.layer = l;
      result.push(item);
    }

    return false;
  }, {
    hitTolerance: featureInfo.getHitTolerance()
  });

  if (cluster) {
    return false;
  }
  return result;
}

export default {
  getFeaturesFromRemote,
  getFeaturesAtPixel
};
