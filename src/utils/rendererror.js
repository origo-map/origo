/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var utils = require('../utils');

module.exports = function renderError(type, el) {
  if (type === 'browser') {
    renderBrowserError(el);
  }

  function renderBrowserError(el) {
    var message = 'Det ser ut som att du använder en föråldrad webbläsare. Prova att uppgradera din webbläsare för att visa kartan.'
    var elMessage = utils.createElement('div', message, {
      cls: 'o-no-map-message'
    });
    var container = utils.createElement('div', elMessage, {
      cls: 'o-no-map'
    });
    $(function() {
      $(el).append(container);
    });
  }
}
