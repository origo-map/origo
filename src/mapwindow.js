/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var utils = require('./utils');
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
	var tooltipText = "Visa kartan i nytt fönster";
	//Element for control
	var el = utils.createButton({
			id: 'window-button',
			cls: 'mapwindow-button',
			iconCls: 'mdk-icon-fa-expand',
			src: 'css/svg/fa-icons.svg#fa-expand',
			tooltipText: tooltipText,
			tooltipPlacement: 'east'
	});
	$('#map').append(el);
}
function openMapWindow() {
    var url = viewer.getMapUrl();
    window.open(url);
}

module.exports.init = init;
