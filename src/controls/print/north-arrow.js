import { Component } from '../../ui';

export default function NorthArrow(options = {}) {
  const {
    baseUrl,
    northArrow,
    map
  } = options;

  let {
    cls = 'padding-right-small printmap-north-arrow',
    src = 'css/png/north_arrow_print.png',
    style = {
      height: '5rem'
    }
  } = options;
  if ('cls' in northArrow) {
    cls = northArrow.cls;
  }
  if ('src' in northArrow) {
    src = northArrow.src;
  }
  if ('style' in northArrow) {
    style = northArrow.style;
  }
  let styleString = '';
  Object.entries(style).forEach(([key, value]) => { styleString += `${key}:${value};`; });

  const calculateDegrees = (radians) => {
    const degrees = radians * (180 / Math.PI);
    return degrees;
  };

  const rotateLogo = (degrees) => {
    const target = document.getElementsByClassName('printmap-north-arrow')[0];
    if (target !== undefined) {
      target.style.transform = `rotate(${degrees}deg)`;
    }
  };

  const setVisible = (display) => {
    if (typeof document.getElementsByClassName('printmap-north-arrow')[0] !== 'undefined') {
      if (display.showNorthArrow === false) {
        document.getElementsByClassName('printmap-north-arrow')[0].style.display = 'none';
      } else {
        document.getElementsByClassName('printmap-north-arrow')[0].style.display = 'block';
      }
    }
  };

  return Component({
    onInit() {
      map.getView().on('change:rotation', this.onRotationChanged);
    },
    onRotationChanged() {
      const rotation = map.getView().getRotation();
      const degrees = calculateDegrees(rotation);
      rotateLogo(degrees);
    },
    setVisible(display) {
      setVisible(display);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return `<img src="${baseUrl}${src}" class="${cls}" style="${styleString}" id="${this.getId()}" alt="NorthArrow" />`;
    }
  });
}
