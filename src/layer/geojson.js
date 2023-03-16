import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import vector from './vector';
import isurl from '../utils/isurl';
import { getStylewindowStyle } from '../controls/editor/stylewindow';

function createSource(options, stylewindow) {
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
                if (feature.get('style') && options.styleByAttribute) {
                  const featureStyle = stylewindow.getStyleFunction(feature, feature.get('style'));
                  feature.setStyle(featureStyle);
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
      const feature = new GeoJSON().readFeature(featureProp.data);
      if (featureProp.name) {
        feature.setId(featureProp.name);
      } else if (!feature.getId()) {
        feature.setId(1000000 + j);
      }
      feature.style = featureProp.style;
      if (feature.get('style') && options.styleByAttribute) {
        const style = feature.get('style');
        const featureStyle = stylewindow.getStyleFunction(feature, style);
        feature.setStyle(featureStyle);
      } else if (feature.style && options.styleByAttribute && feature.style !== 'undefined' && JSON.parse(feature.style)) {
        const style = JSON.parse(feature.style);
        const featureStyle = stylewindow.getStyleFunction(feature, style);
        feature.setStyle(featureStyle);
      }
      features.push(feature);
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
  } else if (geojsonOptions.source) {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = geojsonOptions.source;
  } else if (geojsonOptions.features) {
    sourceOptions.features = geojsonOptions.features;
  }

  sourceOptions.headers = layerOptions.headers;
  const stylewindow = viewer.getStylewindow();
  const geojsonSource = createSource(sourceOptions, stylewindow);
  return vector(geojsonOptions, geojsonSource, viewer);
};

export default geojson;
