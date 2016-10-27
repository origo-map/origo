/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
 "use strict";

var $ = require('jquery');
var utils = require('./utils');
var editortoolbar = require('./editortoolbar');


module.exports = function() {

var $editorButton;

function bindUIActions() {
    $editorButton.on('click', function(e) {
        $('.o-map').trigger({
            type: 'enableInteraction',
            interaction: 'editor'
        });
        this.blur();
        e.preventDefault();
    });
}
function render() {
    var el = utils.createListButton({
        id: 'o-editor',
        iconCls: 'o-icon-fa-pencil',
        src: 'css/svg/fa-icons.svg#fa-pencil',
        text: 'Redigera'
    });
    $('#o-menutools').append(el);
}

return {
    init: function init(options) {
        render();
        $editorButton = $('#o-editor-button');
        bindUIActions();
        editortoolbar.init(options);
    }
}

}();
