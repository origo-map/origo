"use strict";

module.exports = function getUrl() {
    return location.protocol +'//'+
            location.hostname +
            (location.port?":"+location.port:"") +
            location.pathname;
}
