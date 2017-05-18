"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var sidebar;

function init() {
    var el = '<div id="o-sidebar">' +
                '<div class="o-sidebar o-card">' +
                  '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>' +
                  '<div class="o-card-title"></div>' +
                  '<div class="o-card-content"></div>' +
                '</div>' +
              '</div>';
    $('#o-map').append(el);
    sidebar = $('#o-sidebar');

    bindUIActions();
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
    $('#o-sidebar .o-card-title').html(title);
}
function setContent(config) {
    config.title ? $('#o-sidebar .o-sidebar .o-card-title').html(config.title): $('#o-sidebar .o-sidebar .o-card-title').html('');
    config.content ? $('#o-sidebar .o-sidebar .o-card-content').html(config.content): $('#o-sidebar .o-sidebar .o-card-content').html('');
}
function closeSidebar() {
    setVisibility(false);
}

module.exports.init = init;
module.exports.setVisibility = setVisibility;
module.exports.setTitle = setTitle;
module.exports.setContent = setContent;
module.exports.closeSidebar = closeSidebar;
