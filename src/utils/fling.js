import 'babel-polyfill';

/**
 * Fetch Error Handler.
 * @param {String} error
 */

const fetchError = function fetchError(error) {
  return alert(`Fetch error: ${error}`, error);
};

/**
 * Gets data based on url and options.
 * @param {String} url
 * @param {JSON} options
 */

const get = function get(url, options) {
  return fetch(url, options).then(response => response.json()).then(json => json).catch(error => fetchError(error));
};

/**
 * Gets data based on url and options, it awaits json response.
 * @param {String} url
 * @param {JSON} options
 */
const request = async function request(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  return json;
};
/**
 *  AJAX replacer.
 * @param {*} feature 
 * @param {*} source 
 */
const translate = async (feature, source) => {
  const config = source.config;
  const options = config.fetch;
  const url = config.url;
  const value = feature.get(config.connect);
  const location = url + value;
  const response = await fetch(location, options);
  const json = response.json();
  return json;
};

export default {
  fetchError,
  get,
  request,
  translate
};
