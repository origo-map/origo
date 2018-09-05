import 'babel-polyfill';

const get = function get(url, options) {
  return fetch(url, options).then(response => response.json()).then(json => json);
};

const request = async function request(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  return json;
};

export default {
  get,
  request
};
