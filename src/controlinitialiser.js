/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var controlInitialiser = function(controls) {
    var controlName, controlOptions;
    controls.forEach(function(control) {
        controlName = control.name;
        controlOptions = control.options || undefined;
        if (origo.controls.hasOwnProperty(controlName)) {
            controlOptions ? origo.controls[controlName].init(controlOptions) : origo.controls[controlName].init();
        }
    });
}


module.exports = controlInitialiser;
