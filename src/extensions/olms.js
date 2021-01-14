import { applyStyle } from 'ol-mapbox-style';
import Style from '../style';

const Olms = function Olms() {
  const olmsStyle = function olmsStyle({
    layer,
    file,
    source
  }) {
    fetch(file).then((response) => {
      response.json().then((glStyle) => {
        applyStyle(layer, glStyle, source);
      });
    });
    return false;
  };
  Style.addStyleType('mapbox', olmsStyle);
};

export default Olms;
