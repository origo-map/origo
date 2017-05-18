"use strict";

module.exports = function isUrl(s) {
   var regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
   return regexp.test(s);
}
