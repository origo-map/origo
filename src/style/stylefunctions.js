"use strict";

var defaultStyle = require('./stylefunctions/default');

var customStyles = {
  default: defaultStyle
};

module.exports = function styleFunctions(customStyle, params) {
  if (customStyle in customStyles) {
    return customStyles[customStyle](params);
  } else {
    return customStyles.default(params);
  }
};
