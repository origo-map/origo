/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var utils = require('../utils');

module.exports = function textForm(options) {
  var input = utils.createElement('input', '', {
    id: 'o-draw-input-text',
    type: 'text',
    value: options.value || '',
    placeholder: options.placeHolder
  });
  var saveButton = utils.createElement('input', '', {
    id: 'o-draw-save-text',
    type: 'button',
    value: 'Ok'
  });
  var saveWrapper = utils.createElement('div', saveButton, {
    cls: 'o-form-save'
  });
  var content = input + '<br><br>' + saveWrapper;
  var form = utils.createElement('form', content);
  return form;
}
