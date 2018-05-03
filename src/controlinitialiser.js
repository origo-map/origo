const controlInitialiser = (controls) => {
  let controlName;
  let controlOptions;
  controls.forEach((control) => {
    controlName = control.name;
    controlOptions = control.options || undefined;
    if (Object.prototype.hasOwnProperty.call(origo.controls, controlName)) {
      controlOptions ? origo.controls[controlName].init(controlOptions) : origo.controls[controlName].init();
    }
  });
};

export default controlInitialiser;
