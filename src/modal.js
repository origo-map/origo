/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */


var $ = require('jquery');

var settings = {
  target: undefined,
  modal: undefined
};

function init() {

}
function bindUIActions() {
    $('.mdk-modal-screen, .mdk-close-button').click(function() {
        closeModal();
    });
}
function createModal(modalTarget, options) {
    var title = options.title || undefined;
    var content = options.content || undefined;
    var footer = options.footer || undefined;
    settings.target = $(modalTarget);

    settings.modal = '<div id="mdk-modal">' +
              '<div class="mdk-modal-screen"></div>' +
              '<div class="mdk-modal">' +
              '<div class="mdk-close-button"><svg class="mdk-icon-fa-times"><use xlink:href="css/svg/fa-icons.svg#fa-times"></use></svg></div>' +
              '<div class="mdk-modal-title">' + title + '</div>' +
              '<div class="mdk-modal-content">' + content +'</div>' +
              '</div>' +
            '</div>';
}
function showModal() {
    settings.target.prepend(settings.modal);
    bindUIActions();
}
function closeModal() {
    $('#mdk-modal').remove();
}

module.exports.init = init;
module.exports.createModal = createModal;
module.exports.showModal = showModal;
module.exports.closeModal = closeModal;
