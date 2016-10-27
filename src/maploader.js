/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var permalink = require('./permalink/permalink');
var getUrl = require('./utils/geturl');
var isUrl = require('./utils/isurl');

var mapLoader = function(el, mapOptions) {

    var map = {};
    var mapEl = "#app-wrapper";
    var urlParams = undefined;

    if (!mapOptions) {
        mapOptions = el;
    } else if (mapEl.substring(0, 0) !== '#') {
        mapEl = '#' + el;
    } else if (mapEl.substring(0, 0) === '#') {
        mapEl = el;
    }
    map.el = mapEl;

    if (typeof(mapOptions) === 'object') {
        if (window.location.hash) {
            urlParams = permalink.parsePermalink(window.location.href);
        }
        map.options = mapOptions;
        map.options.url = getUrl();
        map.options.map = undefined;
        map.options.params = urlParams;
        return map;
    } else if (typeof(mapOptions) === 'string') {
        if (isUrl(mapOptions)) {
            urlParams = permalink.parsePermalink(mapOptions);
            var url = mapOptions.split('#')[0];
            if (url.substring(url.lastIndexOf('/')).indexOf('.htm') !== -1) {
                url = url.substring(0, url.lastIndexOf('/') + 1);
            } else if (url.substr(url.length - 1) !== '/') {
                url += '/';
            }
            var json = urlParams.map + '.json';
            url += json;
            return $.getJSON(url)
                .then(function(data) {
                    map.options = data;
                    map.options.url = url;
                    map.options.map = json;
                    map.options.params = urlParams;
                    return map;
                });
        } else {
            if (window.location.hash) {
                urlParams = permalink.parsePermalink(window.location.href);
            }
            return $.getJSON(mapOptions)
                .then(function(data) {
                    map.options = data;
                    map.options.url = getUrl();
                    map.options.map = mapOptions;
                    map.options.params = urlParams;
                    return map;
                });
        }
    }

}

module.exports = mapLoader;
