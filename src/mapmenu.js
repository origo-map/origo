/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var menuButton, mapMenu;

var symbolSize = 20;
var styleSettings;

function init() {
    styleSettings = viewer.getStyleSettings();
    var el = utils.createButton({
        text: 'Meny',
        id: 'mapmenu-button',
        cls: 'mapmenu-button-true',
        iconCls: 'mdk-icon-fa-bars',
        src: 'css/svg/fa-icons.svg#fa-bars',
        tooltipText: 'Meny',
        tooltipPlacement: 'west'
    });
    $('#map').append(el);
    menuButton = $('#mapmenu-button button');

    var menuEl = '<div id="mapmenu">' +
                    '<div class="block">' +
                      '<ul id="menutools">' +
                        '<li></li>' +
                      '</ul>'
                    '</div>' +
                  '</div>';
    $('#map').append(menuEl);
    mapMenu = $('#mapmenu');

    bindUIActions();
    // addLegend(viewer.getGroups());
}
function bindUIActions() {
    menuButton.on('touchend click', function(e) {
      	toggleMenu();
        menuButton.blur();
        e.preventDefault();
    });
}
function toggleMenu() {
    if(mapMenu.hasClass('mapmenu-show')){
      mapMenu.removeClass('mapmenu-show');
      menuButton.removeClass('mapmenu-button-false');
      menuButton.addClass('mapmenu-button-true');
    }
    else {
      mapMenu.addClass('mapmenu-show');
      menuButton.removeClass('mapmenu-button-true');
      menuButton.addClass('mapmenu-button-false');
    }
}
function getTarget() {
    return mapMenu;
}

module.exports.init = init;
module.exports.toggleMenu = toggleMenu;
module.exports.getTarget = getTarget;
