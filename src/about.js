"use strict";

var $ = require('jquery');
var Utils = require('./utils');
var Modal = require('./modal');

var $aboutButton;
var buttonText;
var title;
var content;

function init(opt_options) {
  var options = opt_options || {};
  buttonText = options.buttonText || 'Om kartan';
  title = options.title || 'Om kartan';
  content = options.content || '<p></p>';

  render();
  bindUIActions();
}

function render() {
  var el = Utils.createListButton({
    id: 'o-about',
    iconCls: 'o-icon-fa-info-circle',
    src: '#fa-info-circle',
    text: buttonText
  });
  $('#o-menutools').append(el);
  $aboutButton = $('#o-about-button');
}

function bindUIActions() {
  $aboutButton.on('click', function(e) {
    Modal.createModal('#o-map', {
      title: title,
      content: content
    });

    Modal.showModal();
    e.preventDefault();
  });
}

module.exports.init = init;
