 /* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Utils = require('./utils');
var Modal = require('./modal');

var aboutButton;
var buttonText;
var title;
var content;

function init(options) {
	buttonText = options.buttontext;
  title = options.title;
  content = options.content;

  var el = Utils.createListButton({
    id: 'o-about',
    iconCls: 'o-icon-fa-info-circle',
    src: 'css/svg/fa-icons.svg#fa-info-circle',
    text: buttonText
  });
  $('#o-menutools').append(el);
  aboutButton = $('#o-about-button');

  bindUIActions();
}

function bindUIActions() {
	aboutButton.on('click', function(e) {
		Modal.createModal('#o-map', {
      title: title,
      content: content
    });

		Modal.showModal();
		e.preventDefault();
	});
}

module.exports.init = init;
