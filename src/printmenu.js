"use strict";

var $ = require('jquery');
var utils = require('./utils');
var options = require('./../conf/printSettings');

var $printMenu, $printButton;

function init() {
    var menuEl = '<form type="submit">' + 
                    '<div id="o-printmenu" class="o-printmenu">' +
                        '<h5 id="o-main-setting-heading">Skriv ut karta</h5>' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Format</span>' +
                            utils.createRadioButtons(options.formats, 1) +
                        '</div>' +
                        '<br />' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Orientering</span>' +
                            utils.createRadioButtons(options.orientation, 2) +
                        '</div>' +
                        '</br>' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Storlek</span>' +
                            '<select id="o-size-dd" class="o-dd-input">' +
                            utils.createDdOptions(options.sizes) +                            
                            '</select>' +
                        '</div>' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Mall</span>' +
                            '<select id="o-template-dd" class="o-dd-input">' +
                            utils.createDdOptions(options.templates) +
                            '</select>' +
                        '</div>' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Skala</span>' +
                            '<select id="o-scale-dd" class="o-dd-input">' +
                            utils.createDdOptions(options.scales) +
                            '</select>' +
                        '</div>' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Upplösning</span>' +
                            '<select id="o-resolution-dd" class="o-dd-input">' +
                            utils.createDdOptions(options.resolutions) + 
                            '</select>' +
                        '</div>' +
                        '<br />' +
                        '<div class="o-block">' +
                            '<span class="o-setting-heading">Titel<span><br />' +
                            '<input id="o-title-input" class="o-text-input" type="text" />' +
                        '</div>' +
                        '<br />' +
                        '<div class="o-block">' +
                            '<input type="checkbox" id="o-legend-input" />' +
                            '<label for="o-legend-input">Teckenförklaring</label>' +
                        '</div>' +
                        '<br />' +
                        '<div class="o-block">' +
                            '<button id="o-print-create-button" class="btn" type="submit">Skapa</button>' +
                        '</div>' +
                    '</div>' +
                  '</form>';

    $('#o-map').append(menuEl);
    $printButton = $('#o-print-create-button')
    $printMenu = $('o-printmenu');

    $printButton.on('click', function(e) {
        e.preventDefault();
    });
}

module.exports.init = init;