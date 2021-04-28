import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import vector from './vector';
import isurl from '../utils/isurl';

function createSource(options) {
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    loader() {
      fetch(options.url, { headers: options.headers }).then(response => response.json()).then((data) => {
        vectorSource.addFeatures(vectorSource.getFormat().readFeatures(data));
        const numFeatures = vectorSource.getFeatures().length;
        for (let i = 0; i < numFeatures; i += 1) {
          vectorSource.forEachFeature((feature) => {
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
      }).catch(error => console.warn(error));
    },
    format: new GeoJSON({
      dataProjection: options.dataProjection,
      featureProjection: options.projectionCode
    })
  });
  return vectorSource;
}

const geojson = function geojson(layerOptions, viewer) {
  const geojsonDefault = {
    layerType: 'vector'
  };
  const geojsonOptions = Object.assign(geojsonDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.idField = layerOptions.idField || 'id';
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
  } else {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = geojsonOptions.source;
  }
  sourceOptions.headers = layerOptions.headers;

  const geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource, viewer);
};

export default geojson;
