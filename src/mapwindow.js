/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');

var settings = {
		windowButton: $('#window-button button')
};

function init(){
    createButton();
    bindUIActions();
}
function bindUIActions() {
    $('#window-button button').click(function() {
        $('#window-button button').blur();
      	openMapWindow();
    })
}
function createButton() {
    var button = '<div id="window-button" class="mdk-button"><button class="window-button"></button></div>';
    $('#map').append(button);
}
function openMapWindow() {
    var url = viewer.getMapUrl();
    window.open(url);
}

module.exports.init = init;
