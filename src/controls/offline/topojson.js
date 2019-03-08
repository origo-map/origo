import $ from 'jquery';
import TopoJSONFormat from 'ol/format/TopoJSON';
import verifyFeatureIds from './verifyfeatureids';

const topoJson = {};
topoJson.request = function request(layer) {
  const source = layer.get('sourceName');
  const req = createRequest(source);
  return req;

  function createRequest(source) {
    const format = new TopoJSONFormat();
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

export default topoJson;
