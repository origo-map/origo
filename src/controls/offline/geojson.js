import $ from 'jquery';
import GeoJSONFormat from 'ol/format/GeoJSON';
import verifyFeatureIds from './verifyfeatureids';

const geojson = {};
geojson.request = function request(layer) {
  const source = layer.get('sourceName');
  const req = createRequest(source);
  return req;

  function createRequest(source) {
    const format = new GeoJSONFormat();
    const url = source;

    return $.ajax({
      url,
      cache: false
    })
      .then((response) => {
        let features = format.readFeatures(response);
        features = verifyFeatureIds(features);
        return features;
      });
  }
};

export default geojson;
