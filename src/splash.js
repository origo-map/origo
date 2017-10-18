"use strict";

var $ = require('jquery');
var Modal = require('./modal');
var viewer = require('./viewer');

var defaultTitle = 'Om kartan';
var defaultContent = '<p></p>';
var cls = 'o-splash';
var title;
var content;

function init(opt_options) {
  var options = opt_options || {};
  var url;
  title = options.title || defaultTitle;
  if (options.url) {
    url = viewer.getBaseUrl() + options.url;
    getContent(url)
      .done(function(data) {
        content = data;
        openModal();
      });
  } else {
    content = options.content || defaultContent;
    openModal();
  }
}

function getContent(url) {
  return $.get(url);
}

function openModal() {
  Modal.createModal('#o-map', {
    title: title,
    content: content,
    cls: cls
  });
  Modal.showModal();
}

module.exports.init = init;
