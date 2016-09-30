/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var $ = require('jquery');

module.exports = function(target) {
    render(target);
    bindUIActions();
    return {
        getEl: getEl,
        setVisibility: setVisibility,
        setTitle: setTitle,
        setContent: setContent,
        closePopup: closePopup
    }
}
function render(target) {
    var pop = '<div id="popup">' +
                '<div class="popup">' +
                '<div class="mdk-close-button"><svg class="mdk-icon-fa-times"><use xlink:href="css/svg/fa-icons.svg#fa-times"></use></svg></div>' +
                '<div class="popup-title"></div>' +
                '<div class="popup-content"></div>' +
                '</div>' +
              '</div>';
    $(target).append(pop);
}
function bindUIActions() {
    $('#popup .popup .mdk-close-button').on('touchend click', function(evt) {
        closePopup();
        evt.preventDefault();
    });
}
function getEl() {
    return $("#popup").get(0);
}
function setVisibility(visible) {
    visible == true ? $('#popup .popup').css('display', 'block') : $('#popup .popup').css('display', 'none');
}
function setTitle(title) {
    $('#popup .popup-title').html(title);
}
function setContent(config) {
    config.title ? $('#popup .popup .popup-title').html(config.title): $('#popup .popup .popup-title').html('');
    config.content ? $('#popup .popup .popup-content').html(config.content): $('#popup .popup .popup-content').html('');
}
function closePopup() {
    setVisibility(false);
}
