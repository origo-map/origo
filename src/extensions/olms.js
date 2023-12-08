import { applyStyle } from 'ol-mapbox-style';
import Style from '../style';

let baseStyle = null;
const dpiStyles = {};

const Olms = function Olms(options = {}) {
  const {
    resolutions = [
      { label: 'Låg', value: 75 },
      { label: 'Mellan', value: 150 },
      { label: 'Hög', value: 300 }
    ]
  } = options;

  function scaleStyleToDpi(style, dpi) {
    const layers = style.layers;
    const scaledLayers = layers.map((layer) => {
      const paint = layer.paint;
      const layout = layer.layout;
      if (paint) {
        const lineWidth = paint['line-width'];
        if (lineWidth) {
          paint['line-width'] = Style.multiplyByFactor(lineWidth, dpi);
        }
        const circleRadius = paint['circle-radius'];
        if (circleRadius) {
          paint['circle-radius'] = Style.multiplyByFactor(circleRadius, dpi);
        }
        const circleStrokeWidth = paint['circle-stroke-width'];
        if (circleStrokeWidth) {
          paint['circle-stroke-width'] = Style.multiplyByFactor(circleStrokeWidth, dpi);
        }
      }
      if (layout) {
        const textSize = layout['text-size'];
        if (textSize) {
          layout['text-size'] = Style.multiplyByFactor(textSize, dpi);
        }
        const iconSize = layout['icon-size'];
        if (iconSize) {
          layout['icon-size'] = Style.multiplyByFactor(iconSize, dpi);
        }
      }
      return { ...layer, paint, layout };
    });
    const scaledStyle = { ...style, layers: scaledLayers };
    return scaledStyle;
  }

  const olmsStyle = function olmsStyle({
    layer,
    file,
    source,
    scaleToDpi = 150
  }) {
    if (baseStyle == null) {
      fetch(file).then((response) => {
        response.json().then((glStyle) => {
          baseStyle = glStyle;
          applyStyle(layer, baseStyle, source);
          resolutions.forEach((resolution) => {
            let scaledStyle = JSON.parse(JSON.stringify(glStyle));
            scaledStyle = scaleStyleToDpi(scaledStyle, resolution.value);
            dpiStyles[resolution.value] = scaledStyle;
          });
        });
      });
    } else {
      applyStyle(layer, dpiStyles[scaleToDpi], source);
    }
    return false;
  };
  Style.addStyleType('mapbox', olmsStyle);
};

export default Olms;
