"use strict";
var $ = require('jquery');

var modal = function() {

  var isStatic = undefined;
  var $target = undefined;
  var modalEl = undefined;
  var extLink = undefined;

  return {
    createModal: createModal,
    showModal: showModal,
    closeModal: closeModal
  };

  function render(title, content, cls, target) {
    modalEl = '<div id="o-modal" ' + 'class="' + cls + '">' +
      '<div class="o-modal-screen"></div>';
    if (target === 'iframe') {
      modalEl +=  '<div class="o-modal-full"><div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>' +
        '<div class="o-external-link-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-external-link"></use></svg></div>';
      extLink = content;
    } else {
      modalEl +=  '<div class="o-modal"><div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>';
    }
    modalEl +=  '<div class="o-modal-title">' + title + '</div>';
    if (target === 'iframe') {
      modalEl +=  '<iframe src="' + content + '" class="o-modal-content-full"></iframe>';
    } else {
      modalEl +=  '<div class="o-modal-content">' + content + '</div>';
    }
    modalEl +=  '</div>' +
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
    if(extLink){
      $('.o-external-link-button').click(function() {
        window.open(extLink, '_blank');
      });
    }
  }

  function createModal(modalTarget, options) {
    var title = options.title || '';
    var content = options.content || '';
    var cls = options.cls || '';
    var target = options.target || '';
    if (options.hasOwnProperty('static')) {
      isStatic = options.static;
    } else {
      isStatic = false;
    }
    render(title, content, cls, target);
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
