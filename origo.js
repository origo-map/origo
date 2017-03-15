"use strict";

window.proj4 = require('proj4');
global.jQuery = require("jquery");

var $ = require('jquery');
var Viewer = require('./src/viewer');
var mapLoader = require('./src/maploader');
var controlInitialiser = require('./src/controlinitialiser');

var origo = {};
origo.map = {};
origo.config = require('./conf/origoConfig');
origo.controls = require('./conf/origoControls');

origo.map.init = function(options, opt_config) {
  var config = opt_config ? $.extend(origo.config, opt_config) : origo.config;

  var map = mapLoader(options, config);
  map.then(function(config) {
    init(config);
  })
  return Viewer;
}

function init(config) {
  Viewer.init(config.el, config.options);

  //Init controls
  controlInitialiser(config.options.controls);
}

module.exports = origo;
