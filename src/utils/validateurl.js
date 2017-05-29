"use strict";
var isUrl = require('./isurl');

//Checks if str is a valid url. If not append str to baseUrl
module.exports = function validateUrl(str, baseUrl) {
   var url = isUrl(str) ? str : baseUrl + str;
   return url;
}
