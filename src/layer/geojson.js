import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import vector from './vector';
import isurl from '../utils/isurl';

function createSource(options) {
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    loader() {
      fetch(options.url).then(response => response.json()).then(
        (data) => {
          vectorSource.addFeatures(vectorSource.getFormat().readFeatures(data));
          const numFeatures = vectorSource.getFeatures().length;
          for (let i = 0; i < numFeatures; i += 1) {
            vectorSource.forEachFeature((feature) => {
              feature.setId(i);
              i += 1;
            });
          }
        }
      ).catch(error => console.warn(error));
    },
    format: new GeoJSON()
  });
  return vectorSource;
}

const geojson = function geojson(layerOptions, viewer) {
  const baseUrl = viewer.getBaseUrl();
  const geojsonDefault = {
    layerType: 'vector'
  };
  const geojsonOptions = Object.assign(geojsonDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isurl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = baseUrl + geojsonOptions.source;
  }

  const geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource, viewer);
};

export default geojson;
