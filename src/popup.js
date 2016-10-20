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
  var pop = '<div id="o-popup">' +
      '<div class="o-popup">' +
        '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="css/svg/fa-icons.svg#fa-times"></use></svg></div>' +
        '<div class="o-popup-title"></div>' +
        '<div class="o-popup-content"></div>' +
      '</div>' +
    '</div>';
  $(target).append(pop);
}
function bindUIActions() {
    $('#o-popup .o-popup .o-close-button').on('click', function(evt) {
        closePopup();
        evt.preventDefault();
    });
}
function getEl() {
    return $("#o-popup").get(0);
}
function setVisibility(visible) {
    visible == true ? $('#o-popup .o-popup').css('display', 'block') : $('#o-popup .o-popup').css('display', 'none');
}
function setTitle(title) {
    $('#o-popup .o-popup-title').html(title);
}
function setContent(config) {
    config.title ? $('#o-popup .o-popup .o-popup-title').html(config.title): $('#o-popup .o-popup .o-popup-title').html('');
    config.content ? $('#o-popup .o-popup .o-popup-content').html(config.content): $('#o-popup .o-popup .o-popup-content').html('');
}
function closePopup() {
    setVisibility(false);
}
