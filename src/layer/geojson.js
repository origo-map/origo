import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import vector from './vector';
import isurl from '../utils/isurl';

function createSource(options) {
  console.log(options);
  if (options.url) {
    const vectorSource = new VectorSource({
      attributions: options.attribution,
      loader() {
        fetch(options.url, { headers: options.headers }).then(response => response.json()).then((data) => {
          if (data.features) {
            vectorSource.addFeatures(vectorSource.getFormat().readFeatures(data));
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
        }).catch(error => console.warn(error));
      },
      format: new GeoJSON({
        dataProjection: options.dataProjection,
        featureProjection: options.projectionCode
      })
    });
    return vectorSource;
  } else if (options.features) {
    const features = [];
    for (let j = options.features.length - 1; j >= 0; j -= 1) {
      const featureProp = options.features[j];
      if (featureProp instanceof Feature) { // Real OpenLayers feature
        const feature = featureProp;
        if (!feature.getId()) {
          feature.setId(1000000 + j);
        }
        features.push(feature);
      } else if (typeof featureProp === 'object') {
        let feature;
        if (Object.prototype.hasOwnProperty.call(featureProp, 'geometry')) { // Probably true GeoJSON-object
          feature = new GeoJSON().readFeature(featureProp);
        } else if (Object.prototype.hasOwnProperty.call(featureProp, 'data')) { // Custom GeoJSON-object
          feature = new GeoJSON().readFeature(featureProp.data);
          if (!feature.getId() && featureProp.name) {
            feature.setId(featureProp.name);
          }
        } else break;
        if (!feature.getId()) {
          feature.setId(1000000 + j);
        }
        features.push(feature);
      }
    }
    return new VectorSource({ features });
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
  } else if (sourceOptions.projection) {
    sourceOptions.dataProjection = sourceOptions.projection;
  } else {
    sourceOptions.dataProjection = viewer.getProjectionCode();
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
