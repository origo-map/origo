/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var supports = require('./utils/supports');
var permalink = require('./permalink/permalink');
var getUrl = require('./utils/geturl');
var isUrl = require('./utils/isurl');
var trimUrl = require('./utils/trimurl');

var mapLoader = function(mapOptions, config) {

  var map = {};
  var mapEl = config.target;
  var format = 'json';
  var cors = config.crossOrigin;

  var urlParams = undefined;

  if (mapEl.substring(0, 1) !== '#') {
    mapEl = '#' + mapEl;
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
      .then(function(data) {
        return loadMapOptions();
      });
  } else {
    return loadMapOptions();
  }

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

        //remov file name if included in
        url = trimUrl(url);

        var baseUrl = config.baseUrl || url;
        var json = urlParams.map + '.json';
        var mapUrl = url;
        url += json;
      } else {
        if (window.location.hash) {
          urlParams = permalink.parsePermalink(window.location.href);
        }
        var baseUrl = config.baseUrl || '';
        var json = mapOptions;
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

module.exports = mapLoader;
