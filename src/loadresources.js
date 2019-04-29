import $ from 'jquery';
import permalink from './permalink/permalink';
import getUrl from './utils/geturl';
import isUrl from './utils/isurl';
import trimUrl from './utils/trimurl';

const loadSvgSprites = function loadSvgSprites(baseUrl, config) {
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
};

const loadResources = async function loadResources(mapOptions, config) {
  const map = {};
  const mapEl = config.target;
  const format = 'json';
  let urlParams;
  let url;
  let mapUrl;
  let baseUrl;
  let json;

  map.el = mapEl;

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

            /* We need to find the setting from sharemap to get the serviceEndPoint 
                but it will not have been initialized yet when we need to restore
                from permalink.
                Typical bootstrap problem. This solutions works but not very clean. Lets talk about it :)
                Lukas Bergliden Decerno
            */
            for (var i = 0; i < map.options.controls.length; i++) {
              if (map.options.controls[i].name == "sharemap") {
                if (map.options.controls[i].options) {
                  var options = map.options.controls[i].options;
                  if (options.storeMethod && options.storeMethod == "saveStateToServer") {
                    permalink.setSaveOnServerServiceEndpoint(map.options.controls[i].options.serviceEndpoint);
                  }
                }
              }
            }
            return restorePermalink().then(function (urlParams) {
              if (urlParams) {
                map.options.params = urlParams;
              }
              return map;
            });
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


function restorePermalink() {

  var mapStateId = getQueryVariable("mapStateId");
  if (mapStateId) {
    return permalink.readStateFromServer(mapStateId);
  }
  return Promise.resolve();
}

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
  console.log('Query variable %s not found', variable);
  return undefined;
};



export default loadResources;
