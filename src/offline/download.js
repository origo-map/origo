/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var layerCreator = require('../layercreator');
var dispatcher = require('./offlinedispatcher');

var sources = {};
sources.WFS = require('./wfs');

var downloadSources = function downloadSources(layer) {
  var type = layer.get('type');
  if (sources.hasOwnProperty(type)) {
    sources[type](layer)
      .done(function(result) {
        var source;
        var options = layer.getProperties();
        options.type = 'FEATURE';
        options.features = result;
        options.style = options.styleName;
        source = layerCreator(options).getSource();
        layer.setSource(source);
        dispatcher.emitChangeOffline(layer.get('name'), 'download');
      });
  }
}

module.exports = downloadSources;
