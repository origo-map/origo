import pin from './pin';
import measure from './measure';

export default function () {
  const styleTypes = {};

  styleTypes.pin = pin;
  styleTypes.measure = measure;

  return {
    getStyle: function getStyle(type) {
      if (type) {
        return styleTypes[type];
      }
      console.log(`${type} is not a default style`)
      return false;
    }
  };
}
