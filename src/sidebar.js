/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var sidebar;

function init() {
    var el = '<div id="o-sidebar">' +
                '<div class="o-sidebar">' +
                  '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>' +
                  '<div class="o-sidebar-title"></div>' +
                  '<div class="o-sidebar-content"></div>' +
                '</div>' +
              '</div>';
    $('#o-map').append(el);
    sidebar = $('#o-sidebar');

    bindUIActions();
    // addLegend(viewer.getGroups());
}
function bindUIActions() {
    $('#o-sidebar .o-sidebar .o-close-button').on('click', function(evt) {
        closeSidebar();
        evt.preventDefault();
    });
}
function setVisibility(visible) {
    visible == true ? $('#o-sidebar').addClass('o-sidebar-show') : $('#o-sidebar').removeClass('o-sidebar-show');
}
function setTitle(title) {
    $('#o-sidebar .o-sidebar-title').html(title);
}
function setContent(config) {
    config.title ? $('#o-sidebar .o-sidebar .o-sidebar-title').html(config.title): $('#o-sidebar .o-sidebar .o-sidebar-title').html('');
    config.content ? $('#o-sidebar .o-sidebar .o-sidebar-content').html(config.content): $('#o-sidebar .o-sidebar .o-sidebar-content').html('');
}
function closeSidebar() {
    setVisibility(false);
}

module.exports.init = init;
module.exports.setVisibility = setVisibility;
module.exports.setTitle = setTitle;
module.exports.setContent = setContent;
module.exports.closeSidebar = closeSidebar;
