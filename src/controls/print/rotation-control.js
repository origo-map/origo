import { InputRange, Component } from '../../ui';

export default function RotationControl(options = {}) {
  const {
    rotation,
    rotationStep,
    map,
    localize
  } = options;

  const rotationSlider = InputRange({
    cls: 'padding-smaller o-tooltip active',
    minValue: 0,
    maxValue: 360,
    initialValue: rotation,
    step: rotationStep,
    style: {
      'align-self': 'center'
    },
    unit: '&deg;',
    label: localize('rotateMap')
  });

  return Component({
    onInit() {
      this.addComponents([rotationSlider]);
      rotationSlider.on('change', this.onChangeRotation.bind(this));
      map.getView().on('change:rotation', this.setRotation);
    },
    onRender() {
      this.dispatch('render');
      if (rotation) {
        map.getView().setRotation((rotation * Math.PI) / 180);
      }
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
      <div class="padding-right-small o-tooltip active">
        ${rotationSlider.render()}
      </div>`;
    }
  });
}
