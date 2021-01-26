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

    return fetch(url, {
      cache: false,
      method: 'GET'
    })
      .then(res => res.json())
      .then((response) => {
        let features = format.readFeatures(response);
        features = verifyFeatureIds(features);
        return features;
      })
      .catch(error => console.error(error));
  }
};

export default topoJson;
