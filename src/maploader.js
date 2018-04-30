import $ from 'jquery';
import supports from './utils/supports';
import permalink from './permalink/permalink';
import getUrl from './utils/geturl';
import isUrl from './utils/isurl';
import trimUrl from './utils/trimurl';

const mapLoader = function mapLoader(mapOptions, config) {
  const map = {};
  let mapEl = config.target;
  const format = 'json';
  let urlParams;

  if (mapEl.substring(0, 1) !== '#') {
    mapEl = `#${mapEl}`;
  }
  map.el = mapEl;

  // Check browser support
  if (supports('browser', mapEl) === false) {
    return undefined;
  }

  // Check if authorization is required before map options is loaded
  if (config.authorizationUrl) {
    return $.ajax({
      url: config.authorizationUrl
    })
      .then(() => loadMapOptions());
  }
  return loadMapOptions();

  function loadMapOptions() {
    if (typeof(mapOptions) === 'object') {
      if (window.location.hash) {
        urlParams = permalink.parsePermalink(window.location.href);
      }
      var baseUrl = config.baseUrl || '';
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

      return $.when.apply($, loadSvgSprites(baseUrl, config))
        .then(function(sprites) {
          return map;
        });

    } else if (typeof(mapOptions) === 'string') {
      if (isUrl(mapOptions)) {
        urlParams = permalink.parsePermalink(mapOptions);
        var url = mapOptions.split('#')[0];
        var mapUrl = url;

        //remov file name if included in
        url = trimUrl(url);

        var baseUrl = config.baseUrl || url;
        var json = urlParams.map + '.json';
        url += json;
      } else {
        var json = mapOptions;
        if (window.location.hash) {
          urlParams = permalink.parsePermalink(window.location.href);
          if (urlParams.map) {
            json = urlParams.map + '.json';
          }
        }
        var baseUrl = config.baseUrl || '';
        var url = baseUrl + json;
        var mapUrl = getUrl();
      }

      return $.when.apply($, loadSvgSprites(baseUrl, config))
        .then(function(sprites) {
          return $.ajax({
              url: url,
              dataType: format
            })
            .then(function(data) {
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
            });
        });
    }
  }
}

function loadSvgSprites(baseUrl, config) {
  var svgSprites = config.svgSprites;
  var svgPath = config.svgSpritePath;
  var svgPromises = [];
  svgSprites.forEach(function(sprite) {
    var promise = $.get(baseUrl + svgPath + sprite, function(data) {
      var div = document.createElement("div");
      div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
      document.body.insertBefore(div, document.body.childNodes[0]);
    });
    svgPromises.push(promise);
    return svgPromises;
  });
}

export default mapLoader;
