import EsriJSON from 'ol/format/EsriJSON';
import $ from 'jquery';
import maputils from './maputils';
import getAttributes from './getattributes';

function getGetFeatureInfoUrl({
  coordinate,
  resolution,
  projection
}, layer) {

  const infoFormat = layer.getProperties().infoFormat || 'application/json';
  const url = layer.getSource().getFeatureInfoUrl(coordinate, resolution, projection, {
    INFO_FORMAT: infoFormat,
    FEATURE_COUNT: '1'
  });

  /*Separate case for formats, need to handle response differently*/
  if(infoFormat === 'text/html'){
    return fetch(url)
      .then(Resp => Resp.text())
      .then(FTL => {
        return [FTL];
      }) 
  }

  return fetch(url)
    .then(Resp => Resp.json())
    .then(json => {
      return maputils.geojsonToFeature(json);
    })
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

function isTainted({
  pixel,
  layerFilter,
  map
}) {
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

function layerAtPixel({
  pixel,
  matchLayer,
  map
}) {
  map.forEachLayerAtPixel(pixel, layer => matchLayer === layer);
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
        return getGetFeatureInfoRequest({ featureinfoLayer, coordinate }, viewer);
      }
      break;
    case 'WMS':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest({ featureinfoLayer, coordinate }, viewer);
      }
      obj.cb = 'GEOJSON';
      obj.fn = getGetFeatureInfoUrl({ coordinate, resolution, projection }, layer);
      return obj;
    case 'AGS_TILE':
      if (layer.get('featureinfoLayer')) {
        const featureinfoLayerName = layer.get('featureinfoLayer');
        const featureinfoLayer = viewer.getLayer(featureinfoLayerName);
        return getGetFeatureInfoRequest({ featureinfoLayer, coordinate }, viewer);
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

  const requestPromises = getFeatureInfoRequests(requestOptions, viewer).map(request => request.fn.then((features) => {
    const layer = viewer.getLayer(request.layer);
    const map = viewer.getMap();
    if (features) {
      /*if type is string, then we are dealing with FTL*/
      if(typeof features[0] === 'string'){
        if(features[0].indexOf("<body>\n  </body>") > 0) return false;
        features.forEach((feature) => {
          requestResult.push({
            title: layer.get('title'),
            content: `<div class="o-identify-content">${feature}</div>`,
            layer: layer.get('name')
          });
        });
      }
      else{
        features.forEach((feature) => {
          requestResult.push({
            title: layer.get('title'),
            feature,
            content: getAttributes(feature, layer, map),
            layer: layer.get('name')
          });
        });
      }
      
      return requestResult;
    }

    return false;
  }));
  return $.when(...requestPromises).then(() => requestResult);
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
  map.forEachFeatureAtPixel(pixel, (feature, layer) => {
    const l = layer;
    const map = viewer.getMap();
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
          const item = {};
          item.title = l.get('title');
          item.feature = f;
          item.content = getAttributes(f, l, map);
          item.name = l.get('name');
          result.push(item);
        });
      } else if (collection.length === 1 && queryable) {
        const item = {};
        item.title = l.get('title');
        item.feature = collection[0];
        item.content = getAttributes(collection[0], l,map);
        item.name = l.get('name');
        item.layer = l;
        result.push(item);
      }
    } else if (queryable) {
      const item = {};
      item.title = l.get('title');
      item.feature = feature;
      item.content = getAttributes(feature, l,map);
      item.name = l.get('name');
      item.layer = l;
      result.push(item);
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
  getFeaturesFromRemote,
  getFeaturesAtPixel
};
