import isEmpty from './isEmpty';
import deep from './deep';
import meld from './meld';
import fling from './fling';

const update = function update(feature, more) {
  if (isEmpty(more)) {
    return feature;
  }
  more.forEach((source) => {
    const config = source.config;
    const options = source.config.fetch;
    const attributes = config.attributes || {};
    const url = config.url;
    const value = feature.get(config.connect);
    const location = url + value;
    fling.request(location, options).then((responses) => {
      responses.forEach((response) => {
        if (isEmpty(attributes)) {
          // BUG: http://localhost:9966/#select=layer:bebyggelse/attributes:OBJEKTNR:54240
          // WORKS: http://localhost:9966/#select=layer:bebyggelse/attributes:OBJEKTNR:67453
          feature.setProperties(response);
        } else {
          // pick attributes;
          attributes.forEach((attribute) => {
            console.log(response);
            const name = attribute.name;
            const title = attribute.title;
            const o = {};
            o[title] = response[name];
            feature.setProperties(o);
          });
        }
      });
    });
  });
  return feature;
};

const find = function find(sources, feature, query) {
  return sources + feature + query;
};

const sources = {
  update,
  find
};

export default sources;
