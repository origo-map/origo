"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var $menuButton, $closeButton, $mapMenu;

var symbolSize = 20;
var styleSettings;
var options;
var isActive;

function init(opt_options) {
    options = opt_options || {};
    isActive = options.isActive || false;
    styleSettings = viewer.getStyleSettings();
    var el = utils.createButton({
        text: 'Meny',
        id: 'o-mapmenu-button',
        cls: 'o-mapmenu-button-true',
        iconCls: 'o-icon-fa-bars',
        src: '#fa-bars',
        tooltipText: 'Meny',
        tooltipPlacement: 'west'
    });
    $('#o-map').append(el);
    $menuButton = $('#o-mapmenu-button button');

    var menuEl = '<div id="o-mapmenu" class="o-mapmenu">' +
                    '<div class="o-block">' +
                      '<ul id="o-menutools">' +
                        '<li></li>' +
                      '</ul>'
                    '</div>' +
                  '</div>';
    $('#o-map').append(menuEl);
    $mapMenu = $('#o-mapmenu');

    var closeButton = utils.createButton({
        id: 'o-mapmenu-button-close',
        cls: 'o-no-boxshadow',
        iconCls: 'o-icon-menu-fa-times',
        src: '#fa-times',
        tooltipText: 'Stäng meny',
        tooltipPlacement: 'west'
    });
    $('#o-menutools').append(closeButton);
    $closeButton = $('#o-mapmenu-button-close');

    bindUIActions();

    if(isActive && window.innerWidth >= 768) {
      toggleMenu();
    }
}
function bindUIActions() {
    $menuButton.on('click', function(e) {
      	toggleMenu();
        $menuButton.blur();
        e.preventDefault();
    });
    $closeButton.on('click', function(e) {
      	toggleMenu();
        $closeButton.blur();
        e.preventDefault();
    });
}
function toggleMenu() {
    if($mapMenu.hasClass('o-mapmenu-show')){
      $mapMenu.removeClass('o-mapmenu-show');
    }
    else {
      $mapMenu.addClass('o-mapmenu-show');
    }
}
function getTarget() {
    return $mapMenu;
}

module.exports.init = init;
module.exports.toggleMenu = toggleMenu;
module.exports.getTarget = getTarget;
