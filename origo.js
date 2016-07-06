"use strict";

window.proj4 = require('proj4');
var svg4everybody = require('svg4everybody');
global.jQuery = require("jquery");

//Adds support for linking till external svg sprites
svg4everybody();

var origo = {};
origo.map = require('./src/viewer');

module.exports = origo;
