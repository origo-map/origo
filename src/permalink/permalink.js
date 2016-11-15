/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */

/*requires Modal.js*/
"use strict";

var permalinkParser = require('./permalinkparser');
var permalinkStore = require('./permalinkstore');
var urlparser =require('../utils/urlparser');

module.exports = function() {

return {
    getPermalink: function getPermalink(options) {
        var hash = urlparser.formatUrl(permalinkStore.getState());
        var url = permalinkStore.getUrl() + "#" + hash;
        return(url);
    },
    parsePermalink: function parsePermalink(url) {
        if(url.indexOf('#') > -1) {
            var urlSearch = url.split('#')[1];
            var urlParts = urlSearch.split('&');
            var urlAsObj = {};
            urlParts.forEach(function(part) {
                var key = part.split('=')[0];
                var val = part.split('=')[1];
                if(permalinkParser.hasOwnProperty(key)) {
                    urlAsObj[key] = permalinkParser[key](val);
                }
            });
            return urlAsObj;
        }
        else {
            return false;
        }
    }
};
}();
