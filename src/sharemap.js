/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

/*requires Modal.js*/
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var modal = require('./modal');
var mapmenu = require('./mapmenu');
var utils = require('./utils');

var shareButton;

function init(){
    var el = utils.createListButton({
        id: 'share',
        iconCls: 'mdk-icon-fa-share-square-o',
        src: 'css/svg/fa-icons.svg#fa-share-square-o',
        text: 'Dela karta'
    });
    $('#menutools').append(el);
    shareButton = $('#share-button');
    bindUIActions();
}
function bindUIActions() {
    shareButton.on('touchend click', function(e) {
        modal.createModal('#map', {title: 'Länk till karta', content: createContent()});
        modal.showModal();
        createLink(); //Add link to input
        mapmenu.toggleMenu();
        e.preventDefault();
    });
}
function createContent() {
    return '<div class="share-link"><input type="text"></div>' +
           '<i>Kopiera och klistra in länken för att dela kartan.</i>';
}
function createLink() {
    $('.share-link input').val(viewer.getMapUrl());
}

module.exports.init = init;
