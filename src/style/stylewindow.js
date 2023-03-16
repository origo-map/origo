import { LineString, Point } from 'ol/geom';
import Select from 'ol/interaction/Select';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

import * as drawStyles from './drawstyles';
import styleTemplate from './styletemplate';
import { Component, Button, Element, dom } from '../ui';

const Stylewindow = function Stylewindow(optOptions = {}) {
  const {
    title = 'Anpassa stil',
    cls = 'control overflow-hidden hidden',
    css = '',
    target,
    viewer,
    closeIcon = '#ic_close_24px',
    palette = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)']
  } = optOptions;

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
    textFont: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    showMeasureSegments: false,
    showMeasure: false,
    selected: false
  };

  function escapeQuotes(s) {
    return s.replace(/'/g, "''");
  }

  function rgbToArray(colorString, opacity = 1) {
    const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
    colorArray[3] = opacity;
    return colorArray;
  }

  swDefaults.fillColorArr = rgbToArray(swDefaults.fillColor, swDefaults.fillOpacity);
  swDefaults.strokeColorArr = rgbToArray(swDefaults.strokeColor, swDefaults.strokeOpacity);

  function setFillColor(color) {
    swStyle.fillColor = color;
    swStyle.fillColorArr = rgbToArray(swStyle.fillColor, swStyle.fillOpacity);
  }

  function setStrokeColor(color) {
    swStyle.strokeColor = color;
    swStyle.strokeColorArr = rgbToArray(swStyle.strokeColor, swStyle.strokeOpacity);
  }

  function getStyleObject(feature, selected = false) {
    let geometryType = feature.getGeometry().getType();
    let styleObject = {};
    if (feature.get(annotationField)) {
      geometryType = 'TextPoint';
    }
    switch (geometryType) {
      case 'LineString':
      case 'MultiLineString':
        styleObject = {
          strokeColor: swStyle.strokeColor,
          strokeColorArr: swStyle.strokeColorArr,
          strokeOpacity: swStyle.strokeOpacity,
          strokeWidth: swStyle.strokeWidth,
          strokeType: swStyle.strokeType,
          showMeasureSegments: swStyle.showMeasureSegments,
          showMeasure: swStyle.showMeasure,
          selected
        };
        break;
      case 'Polygon':
      case 'MultiPolygon':
        styleObject = {
          fillColor: swStyle.fillColor,
          fillColorArr: swStyle.fillColorArr,
          fillOpacity: swStyle.fillOpacity,
          strokeColor: swStyle.strokeColor,
          strokeColorArr: swStyle.strokeColorArr,
          strokeOpacity: swStyle.strokeOpacity,
          strokeWidth: swStyle.strokeWidth,
          strokeType: swStyle.strokeType,
          showMeasureSegments: swStyle.showMeasureSegments,
          showMeasure: swStyle.showMeasure,
          selected
        };
        break;
      case 'Point':
      case 'MultiPoint':
        styleObject = {
          fillColor: swStyle.fillColor,
          fillColorArr: swStyle.fillColorArr,
          fillOpacity: swStyle.fillOpacity,
          strokeColor: swStyle.strokeColor,
          strokeColorArr: swStyle.strokeColorArr,
          strokeOpacity: swStyle.strokeOpacity,
          strokeWidth: swStyle.strokeWidth,
          strokeType: swStyle.strokeType,
          pointSize: swStyle.pointSize,
          pointType: swStyle.pointType,
          selected
        };
        break;
      case 'TextPoint':
        styleObject = {
          fillColor: swStyle.fillColor,
          fillColorArr: swStyle.fillColorArr,
          fillOpacity: swStyle.fillOpacity,
          textSize: swStyle.textSize,
          textString: swStyle.textString,
          textFont: swStyle.textFont,
          selected
        };
        break;
      default:
        styleObject = swStyle;
        break;
    }
    return Object.assign({}, styleObject);
  }

  function restoreStylewindow() {
    document.getElementById('o-draw-style-fill').classList.remove('hidden');
    document.getElementById('o-draw-style-stroke').classList.remove('hidden');
    document.getElementById('o-draw-style-point').classList.remove('hidden');
    document.getElementById('o-draw-style-text').classList.remove('hidden');
    document.getElementById('o-draw-style-measure').classList.remove('hidden');
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
        document.getElementById('o-draw-style-fill').classList.add('hidden');
        document.getElementById('o-draw-style-point').classList.add('hidden');
        document.getElementById('o-draw-style-text').classList.add('hidden');
        break;
      case 'Polygon':
      case 'MultiPolygon':
        document.getElementById('o-draw-style-point').classList.add('hidden');
        document.getElementById('o-draw-style-text').classList.add('hidden');
        break;
      case 'Point':
      case 'MultiPoint':
        document.getElementById('o-draw-style-text').classList.add('hidden');
        document.getElementById('o-draw-style-measure').classList.add('hidden');
        break;
      case 'TextPoint':
        document.getElementById('o-draw-style-stroke').classList.add('hidden');
        document.getElementById('o-draw-style-point').classList.add('hidden');
        document.getElementById('o-draw-style-measure').classList.add('hidden');
        break;
      default:
        break;
    }
    document.getElementById('o-draw-style-pointSizeSlider').value = swStyle.pointSize;
    document.getElementById('o-draw-style-pointType').value = swStyle.pointType;
    document.getElementById('o-draw-style-textSizeSlider').value = swStyle.textSize;
    document.getElementById('o-draw-style-textString').value = swStyle.textString;
    swStyle.strokeColor = swStyle.strokeColor.replace(/ /g, '');
    const strokeEl = document.getElementById('o-draw-style-strokeColor');
    const strokeInputEl = strokeEl.querySelector(`input[value = "${swStyle.strokeColor}"]`);
    if (strokeInputEl) {
      strokeInputEl.checked = true;
    } else {
      const checkedEl = document.querySelector('input[name = "strokeColorRadio"]:checked');
      if (checkedEl) {
        checkedEl.checked = false;
      }
    }
    document.getElementById('o-draw-style-strokeWidthSlider').value = swStyle.strokeWidth;
    document.getElementById('o-draw-style-strokeOpacitySlider').value = swStyle.strokeOpacity;
    document.getElementById('o-draw-style-strokeType').value = swStyle.strokeType;

    const fillEl = document.getElementById('o-draw-style-fillColor');
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
    document.getElementById('o-draw-style-fillOpacitySlider').value = swStyle.fillOpacity;
    document.getElementById('o-draw-style-showMeasure').checked = swStyle.showMeasure;
    document.getElementById('o-draw-style-showMeasureSegments').checked = swStyle.showMeasureSegments;
  }

  function getStyleFunction(feature, featureStyle) {
    const geom = feature.getGeometry();
    const styleObj = feature.get('style') || Object.assign(swStyle, featureStyle);
    let geometryType = feature.getGeometry().getType();
    if (feature.get(annotationField)) {
      geometryType = 'TextPoint';
    }
    let style = [];
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
      color: styleObj.strokeColorArr,
      width: styleObj.strokeWidth,
      lineDash
    });
    const fill = new Fill({
      color: styleObj.fillColorArr
    });
    const font = `${styleObj.textSize}px ${styleObj.textFont}`;
    switch (geometryType) {
      case 'LineString':
      case 'MultiLineString':
        style[0] = new Style({
          stroke
        });
        if (styleObj.showMeasureSegments) {
          const segmentLabelStyle = drawStyles.getSegmentLabelStyle(geom);
          style = style.concat(segmentLabelStyle);
        }
        if (styleObj.showMeasure) {
          const label = drawStyles.formatLength(geom, true);
          const point = new Point(geom.getLastCoordinate());

          const labelStyle = drawStyles.getLabelStyle();
          labelStyle.setGeometry(point);
          labelStyle.getText().setText(label);
          style = style.concat(labelStyle);
        }
        break;
      case 'Polygon':
      case 'MultiPolygon':
        style[0] = new Style({
          fill,
          stroke
        });
        if (styleObj.showMeasureSegments) {
          const line = new LineString(geom.getCoordinates()[0]);
          const segmentLabelStyle = drawStyles.getSegmentLabelStyle(line);
          style = style.concat(segmentLabelStyle);
        }
        if (styleObj.showMeasure) {
          const label = drawStyles.formatArea(geom, true);
          const point = geom.getInteriorPoint();
          const labelStyle = drawStyles.getLabelStyle();
          labelStyle.setGeometry(point);
          labelStyle.getText().setText(label);
          style = style.concat(labelStyle);
        }
        break;
      case 'Point':
      case 'MultiPoint':
        style[0] = drawStyles.createRegularShape(styleObj.pointType, styleObj.pointSize, fill, stroke);
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
        style[0] = drawStyles.createRegularShape(styleObj.pointType, styleObj.pointSize, fill, stroke);
        break;
    }
    if (styleObj.selected) {
      style.push(drawStyles.selectionStyle);
    }
    return style;
  }

  function getSelectedFeatures() {
    let features = [];

    viewer.getMap().getInteractions().forEach((interaction) => {
      if (interaction instanceof Select) {
        features = interaction.getFeatures();
      }
    });

    return features;
  }

  function styleFeature(feature, selected = false) {
    const styleObject = getStyleObject(feature, selected);
    feature.set('style', styleObject);
    feature.setStyle(getStyleFunction);
  }

  function styleSelectedFeatures() {
    getSelectedFeatures().forEach((feature) => {
      styleFeature(feature, true);
    });
  }

  function bindUIActions() {
    let matches;
    const fillColorEl = document.getElementById('o-draw-style-fillColor');
    const strokeColorEl = document.getElementById('o-draw-style-strokeColor');

    matches = fillColorEl.querySelectorAll('span');
    for (let i = 0; i < matches.length; i += 1) {
      matches[i].addEventListener('click', function e() {
        setFillColor(this.style.backgroundColor);
        styleSelectedFeatures();
      });
    }

    matches = strokeColorEl.querySelectorAll('span');
    for (let i = 0; i < matches.length; i += 1) {
      matches[i].addEventListener('click', function e() {
        setStrokeColor(this.style.backgroundColor);
        styleSelectedFeatures();
      });
    }

    document.getElementById('o-draw-style-fillOpacitySlider').addEventListener('input', function e() {
      swStyle.fillOpacity = escapeQuotes(this.value);
      setFillColor(swStyle.fillColor);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-strokeOpacitySlider').addEventListener('input', function e() {
      swStyle.strokeOpacity = escapeQuotes(this.value);
      setStrokeColor(swStyle.strokeColor);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-strokeWidthSlider').addEventListener('input', function e() {
      swStyle.strokeWidth = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-strokeType').addEventListener('change', function e() {
      swStyle.strokeType = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-pointType').addEventListener('change', function e() {
      swStyle.pointType = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-showMeasure').addEventListener('change', function e() {
      swStyle.showMeasure = this.checked;
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-showMeasureSegments').addEventListener('change', function e() {
      swStyle.showMeasureSegments = this.checked;
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-pointSizeSlider').addEventListener('input', function e() {
      swStyle.pointSize = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-textString').addEventListener('input', function e() {
      swStyle.textString = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-textSizeSlider').addEventListener('input', function e() {
      swStyle.textSize = escapeQuotes(this.value);
      styleSelectedFeatures();
    });
  }

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
    stylewindowEl.classList.add('hidden');
  };

  return Component({
    closeWindow,
    getStyleFunction,
    getStyleObject,
    restoreStylewindow,
    updateStylewindow,
    onInit() {
      const headerCmps = [];
      const thisComponent = this;
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
          thisComponent.dispatch('showStylewindow', false);
        }
      });
      headerCmps.push(closeButton);

      headerEl = Element({
        cls: 'flex justify-end grey-lightest',
        components: headerCmps
      });

      contentEl = Element({
        cls: 'o-draw-stylewindow-content overflow-auto',
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
      stylewindowEl = document.getElementById(this.getId());
    },
    render() {
      let addStyle;
      if (css !== '') {
        addStyle = `style="${css}"`;
      } else {
        addStyle = '';
      }
      return `<div id="${this.getId()}" class="o-draw-stylewindow ${cls} flex">
                  <div class="absolute flex column no-margin width-full height-full" ${addStyle}>
                    ${headerEl.render()}
                    ${contentEl.render()}
                  </div>
                </div>`;
    }
  });
};

export default Stylewindow;
