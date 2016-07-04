/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

module.exports = function getUrl() {
    return location.protocol +'//'+
            location.hostname +
            (location.port?":"+location.port:"") +
            location.pathname;
}
