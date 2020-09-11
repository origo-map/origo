import { InputRange, Component } from '../../ui';

export default function RotationControl(options = {}) {
  const {
    rotation = 0,
    map
  } = options;

  const rotationSlider = InputRange({
    cls: 'padding-smaller o-tooltip active',
    minValue: 0,
    maxValue: 360,
    initialValue: rotation,
    step: 1,
    style: {
      'align-self': 'center'
    }
  });

  return Component({
    onInit() {
      this.addComponents([rotationSlider]);
      rotationSlider.on('change', this.onChangeRotation.bind(this));
      map.getView().on('change:rotation', this.setRotation);
    },
    onRender() {
      this.dispatch('render');
    },
    onChangeRotation(evt) {
      map.getView().setRotation((evt.value * Math.PI) / 180);
    },
    setRotation() {
      const calculateDegrees = (radians) => {
        const degrees = radians * (180 / Math.PI);
        return degrees;
      };

      const mapRotation = map.getView().getRotation();
      let degrees = Math.round(calculateDegrees(mapRotation));
      if (degrees !== 0) {
        if (degrees < 0) {
          const rev = Math.floor(degrees / -360);
          degrees = (360 * (rev + 1)) + degrees;
        }
        if (degrees > 360) {
          const rev = Math.floor(degrees / 360);
          degrees -= (360 * rev);
        }
        rotationSlider.setValue(degrees);
      }
    },
    render() {
      return `
      <div class="padding-top-large"></div>
      <h6>Rotera karta</h6>
      <div class="padding-smaller o-tooltip active">
        ${rotationSlider.render()}
      <div class="text-align-center"><span class="text-smaller float-left">0&deg;</span><span class="text-smaller float-right">360&deg;</span></div>
      </div>`;
    }
  });
}
