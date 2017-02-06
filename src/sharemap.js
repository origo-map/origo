/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */

/*requires Modal.js*/
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var modal = require('./modal');
var mapmenu = require('./mapmenu');
var utils = require('./utils');
var permalink = require('./permalink/permalink');

var shareButton;

function init(){
    var el = utils.createListButton({
        id: 'o-share',
        iconCls: 'o-icon-fa-share-square-o',
        src: '#fa-share-square-o',
        text: 'Dela karta'
    });
    $('#o-menutools').append(el);
    shareButton = $('#o-share-button');
    bindUIActions();
}
function bindUIActions() {
    shareButton.on('click', function(e) {
        modal.createModal('#o-map', {title: 'Länk till karta', content: createContent()});
        modal.showModal();
        createLink(); //Add link to input
        mapmenu.toggleMenu();
        e.preventDefault();
    });
}
function createContent() {
    return '<div class="o-share-link"><input type="text"></div>' +
           '<i>Kopiera och klistra in länken för att dela kartan.</i>';
}
function createLink() {
    var url = permalink.getPermalink();
    $('.o-share-link input').val(url).select();
}

module.exports.init = init;
