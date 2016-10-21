/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var utils = require('./utils');
var viewer = require('./viewer');

var settings = {
		windowButton: $('#o-window-button button')
};

function init(){
    createButton();
    bindUIActions();
}
function bindUIActions() {
    $('#o-window-button button').click(function() {
        $('#o-window-button button').blur();
      	openMapWindow();
    })
}
function createButton() {
	var tooltipText = "Visa kartan i nytt fönster";
	//Element for control
	var el = utils.createButton({
			id: 'o-window-button',
			cls: 'o-mapwindow-button',
			iconCls: 'o-icon-fa-expand',
			src: 'css/svg/fa-icons.svg#fa-expand',
			tooltipText: tooltipText,
			tooltipPlacement: 'east'
	});
	$('#o-map').append(el);
}
function openMapWindow() {
    var url = viewer.getMapUrl();
    window.open(url);
}

module.exports.init = init;
