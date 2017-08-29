"use strict";
var $ = require('jquery');

var modal = function() {

  var isStatic = undefined;
  var $target = undefined;
  var modalEl = undefined;

  return {
    createModal: createModal,
    showModal: showModal,
    closeModal: closeModal
  };

  function render(title, content, cls) {
    modalEl = '<div id="o-modal" ' + 'class="' + cls + '">' +
      '<div class="o-modal-screen"></div>' +
      '<div class="o-modal">' +
      '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>' +
      '<div class="o-modal-title">' + title + '</div>' +
      '<div class="o-modal-content">' + content + '</div>' +
      '</div>' +
      '</div>';
  }

  function bindUIActions() {
    if (isStatic === false) {
      $('.o-modal-screen, .o-close-button').click(function() {
        closeModal();
      });
    } else {
      $('.o-close-button').click(function() {
        closeModal();
      });
    }
  }

  function createModal(modalTarget, options) {
    var title = options.title || '';
    var content = options.content || '';
    var cls = options.cls || '';
    if (options.hasOwnProperty('static')) {
      isStatic = options.static;
    } else {
      isStatic = false;
    }
    render(title, content, cls);
    $target = $(modalTarget);

  }

  function showModal() {
    $target.prepend(modalEl);
    bindUIActions();
  }

  function closeModal() {
    $('#o-modal').remove();
  }
}

module.exports = modal();
