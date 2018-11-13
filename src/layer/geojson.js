import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import $ from 'jquery';
import viewer from '../viewer';
import vector from './vector';
import isUrl from '../utils/isurl';

function createSource(options) {
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    loader() {
      $.ajax({
        url: options.url,
        cache: false
      })
        .done((response) => {
          vectorSource.addFeatures(vectorSource.getFormat().readFeatures(response));
          const numFeatures = vectorSource.getFeatures().length;
          for (let i = 0; i < numFeatures; i += 1) {
            vectorSource.forEachFeature((feature) => {
              feature.setId(i);
              i += 1;
            });
          }
        });
    },
    format: new GeoJSON()
  });
  return vectorSource;
}

const geojson = function geojson(layerOptions) {
  const baseUrl = viewer.getBaseUrl();
  const geojsonDefault = {
    layerType: 'vector'
  };
  const geojsonOptions = $.extend(geojsonDefault, layerOptions);
  const sourceOptions = {};
  sourceOptions.attribution = geojsonOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.sourceName = layerOptions.source;
  if (isUrl(geojsonOptions.source)) {
    sourceOptions.url = geojsonOptions.source;
  } else {
    geojsonOptions.sourceName = geojsonOptions.source;
    sourceOptions.url = baseUrl + geojsonOptions.source;
  }

  const geojsonSource = createSource(sourceOptions);
  return vector(geojsonOptions, geojsonSource);
};

export default geojson;
