const controlInitialiser = (controls) => {
  let controlName;
  let controlOptions;
  controls.forEach((control) => {
    controlName = control.name;
    controlOptions = control.options || undefined;
    if (controlName in origo.controls) {
      if (controlOptions) {
        origo.controls[controlName].init(controlOptions);
      }
      origo.controls[controlName].init();
    }
  });
};

export default controlInitialiser;
