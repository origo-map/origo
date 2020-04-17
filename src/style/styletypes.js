import pin from './pin';
import measure from './measure';
import multiselection from './multiselection';

export default function () {
  const styleTypes = {};

  styleTypes.pin = pin;
  styleTypes.measure = measure;
  styleTypes.multiselection = multiselection;

  return {
    getStyle: function getStyle(type) {
      if (type) {
        return styleTypes[type];
      }
      console.warn(`${type} is not a default style`);
      return false;
    }
  };
}
