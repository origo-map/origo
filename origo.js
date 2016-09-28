"use strict";

window.proj4 = require('proj4');;

//Adds support for linking till external svg sprites
var svg4everybody = require('svg4everybody');
svg4everybody();

global.jQuery = require("jquery");

var $ = require('jquery');
var viewer = require('./src/viewer');
var mapLoader = require('./src/maploader');
var controlInitialiser = require('./src/controlinitialiser');

var origo = {};
origo.map = {};
origo.controls = {};
origo.controls.geoposition = require('./src/geoposition');
origo.controls.mapmenu = require('./src/mapmenu');
origo.controls.print = require('./src/print');
origo.controls.sharemap = require('./src/sharemap');
origo.controls.legend = require('./src/legend');
origo.controls.search = require('./src/search');
origo.controls.editor = require('./src/editor');

origo.map.init = function(el, options) {
    var map = mapLoader(el, options);
    if (typeof map.then === 'function') {
        map.then(function(config) {
            init(config);
        })
    }
    else {
        init(map);
    }
    return viewer;
}
function init(config) {
    viewer.init(config.el, config.options);
    //Init controls
    var controls = config.options.controls || [];
    controlInitialiser(controls);
}

module.exports = origo;
