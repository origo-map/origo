/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */


var $ = require('jquery');

var settings = {
  target: undefined,
  modal: undefined
};

function init() {

}
function bindUIActions() {
    $('.o-modal-screen, .o-close-button').click(function() {
        closeModal();
    });
}
function createModal(modalTarget, options) {
    var title = options.title || undefined;
    var content = options.content || undefined;
    var footer = options.footer || undefined;
    settings.target = $(modalTarget);

    settings.modal = '<div id="o-modal">' +
              '<div class="o-modal-screen"></div>' +
              '<div class="o-modal">' +
              '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="css/svg/fa-icons.svg#fa-times"></use></svg></div>' +
              '<div class="o-modal-title">' + title + '</div>' +
              '<div class="o-modal-content">' + content +'</div>' +
              '</div>' +
            '</div>';
}
function showModal() {
    settings.target.prepend(settings.modal);
    bindUIActions();
}
function closeModal() {
    $('#o-modal').remove();
}

module.exports.init = init;
module.exports.createModal = createModal;
module.exports.showModal = showModal;
module.exports.closeModal = closeModal;
