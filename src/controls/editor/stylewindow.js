import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import MultiPoint from 'ol/geom/MultiPoint';
import Point from 'ol/geom/Point';
import RegularShape from 'ol/style/RegularShape';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import styleTemplate from './styletemplate';
import { Button, Component, Element, dom } from '../../ui';
import editHandler from './edithandler';

const white = [255, 255, 255, 1];
const blue = [0, 153, 255, 1];
const blueSelect = [0, 153, 255, 0.1];
const width = 3;

const drawStyle = {
  draw: [{
    text: {
      font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'bottom',
      textAlign: 'center',
      offsetY: -4,
      fill: {
        color: [0, 153, 255, 1]
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  }, {
    stroke: {
      color: [0, 153, 255, 1],
      width: 3
    }
  }, {
    fill: {
      color: [255, 255, 255, 0]
    }
  }, {
    icon: {
      anchor: [0.5, 32],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'img/png/drop_blue.png'
    }
  }],
  select: [{
    stroke: {
      color: white,
      width: width + 2
    }
  }, {
    stroke: {
      color: blue,
      width
    },
    fill: {
      color: blueSelect
    },
    circle: {
      radius: 3,
      stroke: {
        color: blue,
        width: 0
      },
      fill: {
        color: blue
      }
    }
  }],
  text: {
    text: {
      font: '20px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'bottom',
      textAlign: 'center',
      fill: {
        color: blue
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  }
};

const selectionStyle = new Style({
  image: new Circle({
    radius: 6,
    fill: new Fill({
      color: [200, 100, 100, 0.8]
    })
  }),
  geometry(feature) {
    let coords;
    let pointGeometry;
    const type = feature.getGeometry().getType();
    if (type === 'Polygon') {
      coords = feature.getGeometry().getCoordinates()[0];
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'LineString') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'Point') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new Point(coords);
    }
    return pointGeometry;
  }
});

let annotationField;
let swStyle = {};
const swDefaults = {
  fillColor: 'rgb(0,153,255)',
  fillOpacity: 0.75,
  strokeColor: 'rgb(0,153,255)',
  strokeOpacity: 1,
  strokeWidth: 2,
  strokeType: 'line',
  pointSize: 10,
  pointType: 'circle',
  textSize: 20,
  textString: 'Text',
  textFont: '"Helvetica Neue", Helvetica, Arial, sans-serif'
};

function rgbToArray(colorString, opacity = 1) {
  const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
  colorArray[3] = opacity;
  return colorArray;
}

function rgbToRgba(colorString, opacity = 1) {
  const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
  return `rgba(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]}, ${opacity})`;
}

function createRegularShape(type, size, fill, stroke) {
  let style;
  switch (type) {
    case 'square':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          angle: Math.PI / 4
        })
      });
      break;

    case 'triangle':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 3,
          radius: size,
          rotation: 0,
          angle: 0
        })
      });
      break;

    case 'star':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 5,
          radius: size,
          radius2: size / 2.5,
          angle: 0
        })
      });
      break;

    case 'cross':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          angle: 0
        })
      });
      break;

    case 'x':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          angle: Math.PI / 4
        })
      });
      break;

    case 'circle':
      style = new Style({
        image: new Circle({
          fill,
          stroke,
          radius: size
        })
      });
      break;

    default:
      style = new Style({
        image: new Circle({
          fill,
          stroke,
          radius: size
        })
      });
  }
  return style;
}

function setFillColor(color) {
  swStyle.fillColor = rgbToRgba(color, swStyle.fillOpacity);
}

function setStrokeColor(color) {
  swStyle.strokeColor = rgbToRgba(color, swStyle.strokeOpacity);
}

function getStyleObject() {
  return Object.assign({}, swStyle);
}

function restoreStylewindow() {
  document.getElementById('o-editor-style-fill').classList.remove('hidden');
  document.getElementById('o-editor-style-stroke').classList.remove('hidden');
  document.getElementById('o-editor-style-point').classList.remove('hidden');
  document.getElementById('o-editor-style-text').classList.remove('hidden');
}

function updateStylewindow(feature) {
  let geometryType = feature.getGeometry().getType();
  swStyle = Object.assign(swStyle, feature.get('style'));
  if (feature.get(annotationField)) {
    geometryType = 'TextPoint';
  }
  switch (geometryType) {
    case 'LineString':
    case 'MultiLineString':
      document.getElementById('o-editor-style-fill').classList.add('hidden');
      document.getElementById('o-editor-style-point').classList.add('hidden');
      document.getElementById('o-editor-style-text').classList.add('hidden');
      break;
    case 'Polygon':
    case 'MultiPolygon':
      document.getElementById('o-editor-style-point').classList.add('hidden');
      document.getElementById('o-editor-style-text').classList.add('hidden');
      break;
    case 'Point':
    case 'MultiPoint':
      document.getElementById('o-editor-style-text').classList.add('hidden');
      break;
    case 'TextPoint':
      document.getElementById('o-editor-style-stroke').classList.add('hidden');
      document.getElementById('o-editor-style-point').classList.add('hidden');
      break;
    default:
      break;
  }
  document.getElementById('o-editor-style-pointSizeSlider').value = swStyle.pointSize;
  document.getElementById('o-editor-style-pointType').value = swStyle.pointType;
  document.getElementById('o-editor-style-textSizeSlider').value = swStyle.textSize;
  document.getElementById('o-editor-style-textString').value = swStyle.textString;
  swStyle.strokeColor = swStyle.strokeColor.replace(/ /g, '');
  const strokeEl = document.getElementById('o-editor-style-strokeColor');
  const strokeInputEl = strokeEl.querySelector(`input[value = "${swStyle.strokeColor}"]`);
  if (strokeInputEl) {
    strokeInputEl.checked = true;
  } else {
    const checkedEl = document.querySelector('input[name = "strokeColorRadio"]:checked');
    if (checkedEl) {
      checkedEl.checked = false;
    }
  }
  document.getElementById('o-editor-style-strokeWidthSlider').value = swStyle.strokeWidth;
  document.getElementById('o-editor-style-strokeOpacitySlider').value = swStyle.strokeOpacity;
  document.getElementById('o-editor-style-strokeType').value = swStyle.strokeType;

  const fillEl = document.getElementById('o-editor-style-fillColor');
  swStyle.fillColor = swStyle.fillColor.replace(/ /g, '');
  const fillInputEl = fillEl.querySelector(`input[value = "${swStyle.fillColor}"]`);
  if (fillInputEl) {
    fillInputEl.checked = true;
  } else {
    const checkedEl = document.querySelector('input[name = "fillColorRadio"]:checked');
    if (checkedEl) {
      checkedEl.checked = false;
    }
  }
  document.getElementById('o-editor-style-fillOpacitySlider').value = swStyle.fillOpacity;
}

function getStylewindowStyle(feature, featureStyle) {
  const styleObj = Object.assign(swStyle, featureStyle);

  let geometryType = feature.getGeometry().getType();
  if (feature.get(annotationField)) {
    geometryType = 'TextPoint';
  }
  const style = [];
  let lineDash;
  if (styleObj.strokeType === 'dash') {
    lineDash = [3 * styleObj.strokeWidth, 3 * styleObj.strokeWidth];
  } else if (styleObj.strokeType === 'dash-point') {
    lineDash = [3 * styleObj.strokeWidth, 3 * styleObj.strokeWidth, 0.1, 3 * styleObj.strokeWidth];
  } else if (styleObj.strokeType === 'point') {
    lineDash = [0.1, 3 * styleObj.strokeWidth];
  } else {
    lineDash = false;
  }

  const stroke = new Stroke({
    color: styleObj.strokeColor,
    width: styleObj.strokeWidth,
    lineDash
  });
  const fill = new Fill({
    color: styleObj.fillColor
  });
  const font = `${styleObj.textSize}px ${styleObj.textFont}`;
  switch (geometryType) {
    case 'LineString':
    case 'MultiLineString':
      style[0] = new Style({
        stroke
      });
      break;
    case 'Polygon':
    case 'MultiPolygon':
      style[0] = new Style({
        fill,
        stroke,
        text: new Text({
          text: styleObj.textString || 'Text',
          font,
          fill
        })
      });
      break;
    case 'Point':
    case 'MultiPoint':
      style[0] = createRegularShape(styleObj.pointType, styleObj.pointSize, fill, stroke);
      break;
    case 'TextPoint':
      style[0] = new Style({
        text: new Text({
          text: styleObj.textString || 'Text',
          font,
          fill
        })
      });
      feature.set(annotationField, styleObj.textString || 'Text');
      break;
    default:
      style[0] = createRegularShape(styleObj.pointType, styleObj.pointSize, fill, stroke);
      break;
  }
  return style;
}

function styleFeature(feature) {
  if (feature) {
    const style = feature.getStyle() || [];
    style[0] = getStylewindowStyle(feature)[0];
    feature.set('style', getStyleObject());
    feature.setStyle(style);
  } else {
    editHandler.getSelection().forEach((selectedFeature) => {
      const style = selectedFeature.getStyle();
      style[0] = getStylewindowStyle(selectedFeature)[0];
      selectedFeature.set('style', getStyleObject());
      selectedFeature.setStyle(style);
    });
  }
}

function bindUIActions() {
  let matches;
  const fillColorEl = document.getElementById('o-editor-style-fillColor');
  const strokeColorEl = document.getElementById('o-editor-style-strokeColor');

  matches = fillColorEl.querySelectorAll('span');
  for (let i = 0; i < matches.length; i += 1) {
    matches[i].addEventListener('click', function e() {
      setFillColor(this.style.backgroundColor);
      styleFeature();
    });
  }

  matches = strokeColorEl.querySelectorAll('span');
  for (let i = 0; i < matches.length; i += 1) {
    matches[i].addEventListener('click', function e() {
      setStrokeColor(this.style.backgroundColor);
      styleFeature();
    });
  }

  document.getElementById('o-editor-style-fillOpacitySlider').addEventListener('input', function e() {
    swStyle.fillOpacity = this.value;
    setFillColor(swStyle.fillColor);
    styleFeature();
  });

  document.getElementById('o-editor-style-strokeOpacitySlider').addEventListener('input', function e() {
    swStyle.strokeOpacity = this.value;
    setStrokeColor(swStyle.strokeColor);
    styleFeature();
  });

  document.getElementById('o-editor-style-strokeWidthSlider').addEventListener('input', function e() {
    swStyle.strokeWidth = this.value;
    styleFeature();
  });

  document.getElementById('o-editor-style-strokeType').addEventListener('change', function e() {
    swStyle.strokeType = this.value;
    styleFeature();
  });

  document.getElementById('o-editor-style-pointType').addEventListener('change', function e() {
    swStyle.pointType = this.value;
    styleFeature();
  });

  document.getElementById('o-editor-style-pointSizeSlider').addEventListener('input', function e() {
    swStyle.pointSize = this.value;
    styleFeature();
  });

  document.getElementById('o-editor-style-textString').addEventListener('input', function e() {
    swStyle.textString = this.value;
    styleFeature();
  });

  document.getElementById('o-editor-style-textSizeSlider').addEventListener('input', function e() {
    swStyle.textSize = this.value;
    styleFeature();
  });
}

function Stylewindow(optOptions = {}) {
  const {
    title = 'Anpassa stil',
    cls = 'control overflow-hidden hidden',
    target,
    closeIcon = '#ic_close_24px',
    style = '',
    palette = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)']
  } = optOptions;

  annotationField = optOptions.annotation || 'annonation';
  swStyle = Object.assign(swDefaults, optOptions.swDefaults);

  let stylewindowEl;
  let titleEl;
  let headerEl;
  let contentEl;
  let closeButton;

  palette.forEach((item, index) => {
    const colorArr = rgbToArray(palette[index]);
    palette[index] = `rgb(${colorArr[0]},${colorArr[1]},${colorArr[2]})`;
  });

  const closeWindow = function closeWindow() {
    stylewindowEl.classList.toggle('hidden');
  };

  return Component({
    closeWindow,
    onInit() {
      const headerCmps = [];

      titleEl = Element({
        cls: 'flex row justify-start margin-y-small margin-left text-weight-bold',
        style: 'width: 100%;',
        innerHTML: `${title}`
      });
      headerCmps.push(titleEl);

      closeButton = Button({
        cls: 'small round margin-top-small margin-right-small margin-bottom-auto margin-right icon-smaller grey-lightest no-shrink',
        icon: closeIcon,
        validStates: ['initial', 'hidden'],
        click() {
          closeWindow();
        }
      });
      headerCmps.push(closeButton);

      headerEl = Element({
        cls: 'flex justify-end grey-lightest',
        components: headerCmps
      });

      contentEl = Element({
        cls: 'o-editor-stylewindow-content overflow-auto',
        innerHTML: `${styleTemplate(palette, swStyle)}`
      });

      this.addComponent(headerEl);
      this.addComponent(contentEl);

      this.on('render', this.onRender);
      document.getElementById(target).appendChild(dom.html(this.render()));
      this.dispatch('render');
      bindUIActions();
    },
    onRender() {
      stylewindowEl = document.getElementById('o-editor-stylewindow');
    },
    render() {
      let addStyle;
      if (style !== '') {
        addStyle = `style="${style}"`;
      } else {
        addStyle = '';
      }
      return `<div id="o-editor-stylewindow" class="${cls} flex">
                  <div class="absolute flex column no-margin width-full height-full" ${addStyle}>
                    ${headerEl.render()}
                    ${contentEl.render()}
                  </div>
                </div>`;
    }
  });
}

export {
  drawStyle,
  selectionStyle,
  Stylewindow,
  restoreStylewindow,
  updateStylewindow,
  getStylewindowStyle,
  styleFeature
};
