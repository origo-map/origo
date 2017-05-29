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
