/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var permalink = require('./permalink/permalink');
var getUrl = require('./utils/geturl');
var isUrl = require('./utils/isurl');

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
      map.options = mapOptions;
      map.options.url = getUrl();
      map.options.map = undefined;
      map.options.params = urlParams;
      map.options.baseUrl = baseUrl;
      return map;
    } else if (typeof(mapOptions) === 'string') {
      if (isUrl(mapOptions)) {
        urlParams = permalink.parsePermalink(mapOptions);
        var url = mapOptions.split('#')[0];

        //Check if file name in path
        if (url.substring(url.lastIndexOf('/')).indexOf('.htm') !== -1) {
          url = url.substring(0, url.lastIndexOf('/') + 1);
        } else if (url.substr(url.length - 1) !== '/') {
          url += '/';
        }

        var baseUrl = config.baseUrl || url;
        var json = urlParams.map + '.json';
        url += json;
        return $.ajax({
            url: url,
            dataType: format
          })
          .then(function(data) {
            map.options = data;
            map.options.url = url;
            map.options.map = json;
            map.options.params = urlParams;
            map.options.baseUrl = baseUrl;
            return map;
          });
      } else {
        if (window.location.hash) {
          urlParams = permalink.parsePermalink(window.location.href);
        }

        var baseUrl = config.baseUrl || '';
        var url = mapOptions;
        return $.ajax({
            url: url,
            dataType: format
          })
          .then(function(data) {
            map.options = data;
            map.options.url = getUrl();
            map.options.map = mapOptions;
            map.options.params = urlParams;
            map.options.baseUrl = baseUrl;
            return map;
          });
      }
    }
  }
}

module.exports = mapLoader;
