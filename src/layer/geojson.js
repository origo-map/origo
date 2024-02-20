import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import vector from './vector';
import isurl from '../utils/isurl';
import validate from '../utils/validate';

function createSource(options) {
  const formatOptions = {
    featureProjection: options.projectionCode,
    dataProjection: options.dataProjection
  };
  if (options.url) {
    const vectorSource = new VectorSource({
      attributions: options.attribution,
      loader(extent, resolution, projection, success) {
        fetch(options.url, { headers: options.headers }).then(response => response.json()).then((data) => {
          if (data.features) {
            vectorSource.addFeatures(vectorSource.getFormat().readFeatures(data, formatOptions));
            const numFeatures = vectorSource.getFeatures().length;
            for (let i = 0; i < numFeatures; i += 1) {
              vectorSource.forEachFeature((feature) => {
                if (!feature.getGeometry().intersectsExtent(options.customExtent)) {
                  vectorSource.removeFeature(feature);
                }
                if (!feature.getId()) {
                  if (feature.get(options.idField)) {
                    feature.setId(feature.get(options.idField));
                  } else {
                    feature.setId(1000000 + i);
                  }
                }
                i += 1;
              });
            }
          }
          success(vectorSource.getFeatures());
        }).catch(error => console.warn(error));
      },
      format: new GeoJSON()
    });
    return vectorSource;
  } else if (options.features) {
    let features = options.features;
    let featureArray = [];

    if (typeof features === 'string' && validate.json(features)) { // JSON-string
      features = JSON.parse(features);
    }

    if (typeof features === 'object' && (features.type === 'FeatureCollection' || features.type === 'Feature')) { // GeoJSON-object
      featureArray = new GeoJSON().readFeatures(features, formatOptions);
    } else if (Array.isArray(features)) {
      for (let j = features.length - 1; j >= 0; j -= 1) {
        let item = features[j];
        if (typeof item === 'string' && validate.json(item)) { // JSON-string
          item = JSON.parse(item);
        }
        if (typeof item === 'object' && (item.type === 'FeatureCollection' || item.type === 'Feature')) { // GeoJSON-object
          const readFeatures = new GeoJSON().readFeatures(item, formatOptions);
          featureArray.push(...readFeatures);
        } else if (item instanceof Feature) { // Real OpenLayers feature
          featureArray.push(item);
        }
      }
    }

    featureArray.forEach((element, index) => {
      if (!element.getId()) {
        if (element.get(options.idField)) {
          element.setId(element.get(options.idField));
        } else if (element.get('id')) {
          element.setId(element.get('id'));
        } else {
          element.setId(1000000 + index);
        }
      }
    });

    return new VectorSource({ features: featureArray });
  }
  return new VectorSource({});
}

const geojson = function geojson(layerOptions, viewer) {
  const geojsonDefault = {
    layerType: 'vector',
    styleByAttribute: false
  };
  const geojsonOptions = Object.assign(geojsonDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.customExtent = geojsonOptions.extent;
  geojsonOptions.extent = undefined;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.idField = layerOptions.idField || 'id';
  sourceOptions.styleByAttribute = geojsonOptions.styleByAttribute;
  if (geojsonOptions.projection) {
    sourceOptions.dataProjection = geojsonOptions.projection;
  }
  sourceOptions.sourceName = layerOptions.source;
  if (isurl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else if (geojsonOptions.source && viewer.getMapSource()[geojsonOptions.source]) {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = viewer.getMapSource()[geojsonOptions.source].url;
  } else if (geojsonOptions.source && geojsonOptions.source !== 'none') {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = geojsonOptions.source;
  } else if (geojsonOptions.features) {
    sourceOptions.features = geojsonOptions.features;
  }

  sourceOptions.headers = layerOptions.headers;
  const geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource, viewer);
};

export default geojson;
