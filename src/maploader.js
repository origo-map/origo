import $ from 'jquery';
import supports from './utils/supports';
import permalink from './permalink/permalink';
import getUrl from './utils/geturl';
import isUrl from './utils/isurl';
import trimUrl from './utils/trimurl';

function loadSvgSprites(baseUrl, config) {
  const svgSprites = config.svgSprites;
  const svgPath = config.svgSpritePath;
  const svgPromises = [];
  svgSprites.forEach((sprite) => {
    const promise = $.get(baseUrl + svgPath + sprite, (data) => {
      const div = document.createElement('div');
      div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
      document.body.insertBefore(div, document.body.childNodes[0]);
    });
    svgPromises.push(promise);
    return svgPromises;
  });
}

const mapLoader = function mapLoader(mapOptions, config) {
  const map = {};
  let mapEl = config.target;
  const format = 'json';
  let urlParams;
  let url;
  let mapUrl;
  let baseUrl;
  let json;


  if (mapEl.substring(0, 1) !== '#') {
    mapEl = `#${mapEl}`;
  }
  map.el = mapEl;

  // Check browser support
  if (supports('browser', mapEl) === false) {
    return undefined;
  }

  function loadMapOptions() {
    if (typeof (mapOptions) === 'object') {
      if (window.location.hash) {
        urlParams = permalink.parsePermalink(window.location.href);
      }
      baseUrl = config.baseUrl || '';
      map.options = $.extend(config, mapOptions);
      if (mapOptions.controls) {
        map.options.controls = config.defaultControls.concat(mapOptions.controls);
      } else {
        map.options.controls = config.defaultControls;
      }
      map.options.url = getUrl();
      map.options.map = undefined;
      map.options.params = urlParams;
      map.options.baseUrl = baseUrl;

      return $.when(loadSvgSprites(baseUrl, config))
        .then(() => map);
    } else if (typeof (mapOptions) === 'string') {
      if (isUrl(mapOptions)) {
        urlParams = permalink.parsePermalink(mapOptions);
        url = mapOptions.split('#')[0];
        mapUrl = url;

        // remove file name if included in
        url = trimUrl(url);

        baseUrl = config.baseUrl || url;

        json = `${urlParams.map}.json`;
        url += json;
      } else {
        json = mapOptions;
        if (window.location.hash) {
          urlParams = permalink.parsePermalink(window.location.href);
          if (urlParams.map) {
            json = `${urlParams.map}.json`;
          }
        }
        baseUrl = config.baseUrl || '';
        url = baseUrl + json;
        mapUrl = getUrl();
      }

      return $.when(loadSvgSprites(baseUrl, config))
        .then(() => $.ajax({
          url,
          dataType: format
        })
          .then((data) => {
            map.options = $.extend(config, data);
            if (data.controls) {
              map.options.controls = config.defaultControls.concat(data.controls);
            } else {
              map.options.controls = config.defaultControls;
            }
            map.options.url = mapUrl;
            map.options.map = json;
            map.options.params = urlParams;
            map.options.baseUrl = baseUrl;
            return map;
          }));
    }
    return null;
  }

  // Check if authorization is required before map options is loaded
  if (config.authorizationUrl) {
    return $.ajax({
      url: config.authorizationUrl
    })
      .then(() => loadMapOptions());
  }
  return loadMapOptions();
};

export default mapLoader;
