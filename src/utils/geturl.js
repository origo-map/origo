/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

module.exports = function getUrl() {
    return location.protocol +'//'+
            location.hostname +
            (location.port?":"+location.port:"") +
            location.pathname;
}
