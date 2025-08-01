import { LineString, Point, Polygon } from 'ol/geom';
import Select from 'ol/interaction/Select';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';

import * as drawStyles from './drawstyles';
import styleTemplate from './styletemplate';
import hexToRgba from './hextorgba';
import { Component, Button, Element, dom } from '../ui';
import formatLengthString from '../utils/formatlengthstring';

const Stylewindow = function Stylewindow(optOptions = {}) {
  const { localization } = optOptions;
  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'styleWindow', targetKey: key });
  }

  const {
    title = localize('title'),
    cls = 'control overflow-hidden hidden',
    css = '',
    viewer,
    closeIcon = '#ic_close_24px',
    palette = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)']
  } = optOptions;

  let annotationField;
  let swStyle = {};
  let mapProjection;
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
    selected: false,
    objRotation: 0,
    backgroundFillColor: 'rgb(255,255,255)',
    backgroundFillOpacity: 0,
    backgroundStrokeColor: 'rgb(0,0,0)',
    backgroundStrokeOpacity: 0,
    backgroundStrokeWidth: 2,
    backgroundStrokeType: 'line',
    paddingText: 3
  };

  function escapeQuotes(s) {
    return s.replace(/'/g, "''");
  }

  function rgbToArray(colorString, opacity = 1) {
    const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
    colorArray[3] = opacity;
    return colorArray;
  }

  function rgbToRgba(colorString, opacity = 1) {
    const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
    return `rgba(${colorArray[0]},${colorArray[1]},${colorArray[2]},${opacity})`;
  }

  function rgbaToRgb(colorString) {
    const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
    return `rgb(${colorArray[0]},${colorArray[1]},${colorArray[2]})`;
  }

  function rgbaToOpacity(colorString) {
    const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
    return colorArray[3];
  }

  function stringToRgba(colorString, opacity = 1) {
    if (typeof colorString === 'string') {
      if (colorString.toLowerCase().startsWith('rgba(')) { return colorString; }
      if (colorString.startsWith('#')) {
        return hexToRgba(colorString, opacity);
      } else if (colorString.toLowerCase().startsWith('rgb(')) {
        return rgbToRgba(colorString, opacity);
      }
    }
    return rgbToRgba(swDefaults.fillColor, swDefaults.fillOpacity);
  }

  function paddingToArray(padding = swDefaults.paddingText) {
    return [padding, padding, padding, padding];
  }

  function setFillColor(color) {
    swStyle.fillColor = rgbToRgba(color, swStyle.fillOpacity);
  }

  function setStrokeColor(color) {
    swStyle.strokeColor = rgbToRgba(color, swStyle.strokeOpacity);
  }

  function setBackgroundFillColor(color, opacity) {
    if (typeof opacity === 'undefined') {
      if (swStyle.backgroundFillOpacity === '0') {
        swStyle.backgroundFillColor = rgbToRgba(color, 0.7);
        swStyle.backgroundFillOpacity = 0.7;
        document.getElementById('o-draw-style-backgroundFillOpacitySlider').value = 0.7;
      } else {
        swStyle.backgroundFillColor = rgbToRgba(color, swStyle.backgroundFillOpacity);
      }
    } else {
      swStyle.backgroundFillColor = rgbToRgba(color, opacity);
    }
  }

  function setBackgroundStrokeColor(color) {
    if (swStyle.backgroundStrokeOpacity === 0) {
      swStyle.backgroundStrokeColor = rgbToRgba(color, 0.7);
      swStyle.backgroundStrokeOpacity = 0.7;
      document.getElementById('o-draw-style-backgroundStrokeOpacitySlider').value = 0.7;
    } else {
      swStyle.backgroundStrokeColor = rgbToRgba(color, swStyle.backgroundStrokeOpacity);
    }
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
          strokeColor: rgbToRgba(swStyle.strokeColor, swStyle.strokeOpacity),
          strokeWidth: swStyle.strokeWidth,
          strokeType: swStyle.strokeType,
          showMeasureSegments: swStyle.showMeasureSegments,
          showMeasure: swStyle.showMeasure,
          selected
        };
        break;
      case 'Circle':
      case 'Polygon':
      case 'MultiPolygon':
        styleObject = {
          fillColor: rgbToRgba(swStyle.fillColor, swStyle.fillOpacity),
          strokeColor: rgbToRgba(swStyle.strokeColor, swStyle.strokeOpacity),
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
          fillColor: rgbToRgba(swStyle.fillColor, swStyle.fillOpacity),
          strokeColor: rgbToRgba(swStyle.strokeColor, swStyle.strokeOpacity),
          strokeWidth: swStyle.strokeWidth,
          strokeType: swStyle.strokeType,
          pointSize: swStyle.pointSize,
          pointType: swStyle.pointType,
          objRotation: swStyle.objRotation,
          selected
        };
        break;
      case 'TextPoint':
        styleObject = {
          fillColor: rgbToRgba(swStyle.fillColor, swStyle.fillOpacity),
          textSize: swStyle.textSize,
          textString: swStyle.textString,
          textFont: swStyle.textFont,
          objRotation: swStyle.objRotation,
          backgroundFill: rgbToRgba(swStyle.backgroundFillColor, swStyle.backgroundFillOpacity),
          backgroundStrokeColor: swStyle.backgroundStrokeColor,
          backgroundStrokeOpacity: swStyle.backgroundStrokeOpacity,
          backgroundStrokeWidth: swStyle.backgroundStrokeWidth,
          backgroundStrokeType: swStyle.backgroundStrokeType,
          paddingText: swStyle.paddingText,
          selected
        };
        break;
      default:
        styleObject = swStyle;
        styleObject.fillColor = rgbToRgba(swStyle.fillColor, swStyle.fillOpacity);
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
    document.getElementById('o-draw-style-rotation').classList.remove('hidden');
    document.getElementById('o-draw-style-backgroundFill').classList.remove('hidden');
    document.getElementById('o-draw-style-backgroundStroke').classList.remove('hidden');
    document.getElementById('o-draw-style-padding').classList.remove('hidden');
  }

  function updateStylewindow(feature) {
    const featureStyle = feature.get('origostyle') || {};
    featureStyle.fillColor = stringToRgba(featureStyle.fillColor, featureStyle.fillOpacity);
    featureStyle.strokeColor = stringToRgba(featureStyle.strokeColor, featureStyle.strokeOpacity);
    let geometryType = feature.getGeometry().getType();
    swStyle = Object.assign({}, swStyle, featureStyle);
    if (feature.get(annotationField)) {
      geometryType = 'TextPoint';
    }
    switch (geometryType) {
      case 'LineString':
      case 'MultiLineString':
        document.getElementById('o-draw-style-fill').classList.add('hidden');
        document.getElementById('o-draw-style-point').classList.add('hidden');
        document.getElementById('o-draw-style-text').classList.add('hidden');
        document.getElementById('o-draw-style-rotation').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundFill').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundStroke').classList.add('hidden');
        document.getElementById('o-draw-style-padding').classList.add('hidden');
        break;
      case 'Circle':
      case 'Polygon':
      case 'MultiPolygon':
        document.getElementById('o-draw-style-point').classList.add('hidden');
        document.getElementById('o-draw-style-text').classList.add('hidden');
        document.getElementById('o-draw-style-rotation').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundFill').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundStroke').classList.add('hidden');
        document.getElementById('o-draw-style-padding').classList.add('hidden');
        break;
      case 'Point':
      case 'MultiPoint':
        document.getElementById('o-draw-style-text').classList.add('hidden');
        document.getElementById('o-draw-style-measure').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundFill').classList.add('hidden');
        document.getElementById('o-draw-style-backgroundStroke').classList.add('hidden');
        document.getElementById('o-draw-style-padding').classList.add('hidden');
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
    document.getElementById('o-draw-style-rotationSlider').value = swStyle.objRotation;
    document.getElementById('o-draw-style-padding').value = swStyle.paddingText;
    swStyle.strokeOpacity = rgbaToOpacity(swStyle.strokeColor);
    swStyle.strokeColor = rgbaToRgb(swStyle.strokeColor);
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

    swStyle.backgroundStrokeColor = rgbaToRgb(swStyle.backgroundStrokeColor);
    const bgStrokeEl = document.getElementById('o-draw-style-strokeColor');
    const bgStrokeInputEl = bgStrokeEl.querySelector(`input[value = "${swStyle.backgroundStrokeColor}"]`);
    if (bgStrokeInputEl) {
      bgStrokeInputEl.checked = true;
    } else {
      const checkedEl = document.querySelector('input[name = "backgroundStrokeColorRadio"]:checked');
      if (checkedEl) {
        checkedEl.checked = false;
      }
    }
    document.getElementById('o-draw-style-backgroundStrokeWidthSlider').value = swStyle.backgroundStrokeWidth;
    document.getElementById('o-draw-style-backgroundStrokeOpacitySlider').value = swStyle.backgroundStrokeOpacity;
    document.getElementById('o-draw-style-backgroundStrokeType').value = swStyle.backgroundStrokeType;

    const fillEl = document.getElementById('o-draw-style-fillColor');
    swStyle.fillOpacity = rgbaToOpacity(swStyle.fillColor);
    swStyle.fillColor = rgbaToRgb(swStyle.fillColor);
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

    const bgFillEl = document.getElementById('o-draw-style-backgroundFillColor');
    if (typeof swStyle.backgroundFill !== 'undefined') {
      swStyle.backgroundFillOpacity = rgbaToOpacity(swStyle.backgroundFill);
      swStyle.backgroundFillColor = rgbaToRgb(swStyle.backgroundFill);
    }
    const bgFillInputEl = bgFillEl.querySelector(`input[value = "${swStyle.backgroundFillColor}"]`);
    if (bgFillInputEl) {
      bgFillInputEl.checked = true;
    } else {
      const checkedEl = document.querySelector('input[name = "backgroundFillColorRadio"]:checked');
      if (checkedEl) {
        checkedEl.checked = false;
      }
    }
    document.getElementById('o-draw-style-backgroundFillOpacitySlider').value = swStyle.backgroundFillOpacity;
  }

  function getStyleFunction(feature, inputStyle = {}, projection = mapProjection) {
    if (!feature.get('origostyle') && feature.get('style') && typeof feature.get('style') === 'object') {
      feature.set('origostyle', feature.get('style'));
    }
    const featureStyle = feature.get('origostyle') || {};
    const styleScale = feature.get('styleScale') || 1;
    const newStyleObj = Object.assign({}, swDefaults, featureStyle, inputStyle);
    newStyleObj.fillColor = stringToRgba(newStyleObj.fillColor, newStyleObj.fillOpacity);
    newStyleObj.strokeColor = stringToRgba(newStyleObj.strokeColor, newStyleObj.strokeOpacity);
    newStyleObj.strokeWidth *= styleScale;
    newStyleObj.textSize *= styleScale;
    newStyleObj.pointSize *= styleScale;
    newStyleObj.backgroundStrokeColor = stringToRgba(newStyleObj.backgroundStrokeColor, newStyleObj.backgroundStrokeOpacity);
    newStyleObj.backgroundStrokeWidth *= styleScale;
    newStyleObj.backgroundFill = featureStyle.backgroundFill ? featureStyle.backgroundFill : stringToRgba(newStyleObj.backgroundFillColor, newStyleObj.backgroundFillOpacity);
    newStyleObj.paddingText = paddingToArray(newStyleObj.paddingText);
    const geom = feature.getGeometry();
    let geometryType = feature.getGeometry().getType();
    if (feature.get(annotationField)) {
      geometryType = 'TextPoint';
    }
    let style = [];
    let lineDash;
    if (newStyleObj.strokeType === 'dash') {
      lineDash = [3 * newStyleObj.strokeWidth, 3 * newStyleObj.strokeWidth];
    } else if (newStyleObj.strokeType === 'dash-point') {
      lineDash = [3 * newStyleObj.strokeWidth, 3 * newStyleObj.strokeWidth, 0.1, 3 * newStyleObj.strokeWidth];
    } else if (newStyleObj.strokeType === 'point') {
      lineDash = [0.1, 3 * newStyleObj.strokeWidth];
    } else {
      lineDash = false;
    }
    let bgLineDash;
    if (newStyleObj.backgroundStrokeType === 'dash') {
      bgLineDash = [3 * newStyleObj.backgroundStrokeWidth, 3 * newStyleObj.backgroundStrokeWidth];
    } else if (newStyleObj.backgroundStrokeType === 'dash-point') {
      bgLineDash = [3 * newStyleObj.backgroundStrokeWidth, 3 * newStyleObj.backgroundStrokeWidth, 0.1, 3 * newStyleObj.backgroundStrokeWidth];
    } else if (newStyleObj.backgroundStrokeType === 'point') {
      bgLineDash = [0.1, 3 * newStyleObj.backgroundStrokeWidth];
    } else {
      bgLineDash = false;
    }

    const stroke = new Stroke({
      color: newStyleObj.strokeColor,
      width: newStyleObj.strokeWidth,
      lineDash
    });
    const fill = new Fill({
      color: newStyleObj.fillColor
    });
    const bgStroke = new Stroke({
      color: rgbToArray(newStyleObj.backgroundStrokeColor, newStyleObj.backgroundStrokeOpacity),
      width: newStyleObj.backgroundStrokeWidth,
      lineDash: bgLineDash
    });
    const bgFill = new Fill({
      color: newStyleObj.backgroundFill
    });
    const font = `${newStyleObj.textSize}px ${newStyleObj.textFont}`;
    switch (geometryType) {
      case 'LineString':
        style[0] = new Style({
          stroke
        });
        if (newStyleObj.showMeasureSegments) {
          const segmentLabelStyle = drawStyles.getSegmentLabelStyle({ line: geom, projection, scale: styleScale, localization });
          style = style.concat(segmentLabelStyle);
        }
        if (newStyleObj.showMeasure) {
          const label = drawStyles.formatLength({ line: geom, projection, localization });
          const point = new Point(geom.getLastCoordinate());
          const labelStyle = drawStyles.getLabelStyle(styleScale);
          labelStyle.setGeometry(point);
          labelStyle.getText().setText(label);
          style = style.concat(labelStyle);
        }
        break;
      case 'MultiLineString':
        style[0] = new Style({
          stroke
        });
        if (newStyleObj.showMeasureSegments) {
          const featureCoords = feature.getGeometry().getCoordinates();
          featureCoords.forEach(part => {
            const line = new LineString(part);
            const segmentLabelStyle = drawStyles.getSegmentLabelStyle({ line, projection, scale: styleScale, localization });
            style = style.concat(segmentLabelStyle);
          });
        }
        if (newStyleObj.showMeasure) {
          const featureCoords = feature.getGeometry().getCoordinates();
          featureCoords.forEach(part => {
            const line = new LineString(part);
            const label = drawStyles.formatLength({ line, projection, localization });
            const point = new Point(line.getLastCoordinate());
            const labelStyle = drawStyles.getLabelStyle(styleScale);
            labelStyle.setGeometry(point);
            labelStyle.getText().setText(label);
            style = style.concat(labelStyle);
          });
        }
        break;
      case 'Circle':
        style[0] = new Style({
          fill,
          stroke
        });
        if (newStyleObj.showMeasureSegments) {
          const radius = geom.getRadius();
          const circ = radius * 2 * Math.PI;
          const label = formatLengthString(circ, { decimals: 2, localization });
          const labelStyle = drawStyles.getBufferLabelStyle(label, styleScale);
          style = style.concat(labelStyle);
        }
        if (newStyleObj.showMeasure) {
          const radius = geom.getRadius();
          const area = radius * radius * Math.PI;
          const label = drawStyles.formatArea({ useHectare: true, projection, featureArea: area, localization });
          const point = new Point(geom.getCenter());
          const labelStyle = drawStyles.getLabelStyle(styleScale);
          labelStyle.setGeometry(point);
          labelStyle.getText().setText(label);
          style = style.concat(labelStyle);
        }
        break;
      case 'Polygon':
        style[0] = new Style({
          fill,
          stroke
        });
        if (newStyleObj.showMeasureSegments) {
          const line = new LineString(geom.getCoordinates()[0]);
          const segmentLabelStyle = drawStyles.getSegmentLabelStyle({ line, projection, scale: styleScale, localization });
          style = style.concat(segmentLabelStyle);
        }
        if (newStyleObj.showMeasure) {
          const label = drawStyles.formatArea({ polygon: geom, useHectare: true, projection, localization });
          const point = geom.getInteriorPoint();
          const labelStyle = drawStyles.getLabelStyle(styleScale);
          labelStyle.setGeometry(point);
          labelStyle.getText().setText(label);
          style = style.concat(labelStyle);
        }
        break;
      case 'MultiPolygon':
        style[0] = new Style({
          fill,
          stroke
        });
        if (newStyleObj.showMeasureSegments) {
          const featureCoords = feature.getGeometry().getCoordinates();
          featureCoords.forEach(parts => {
            parts.forEach(part => {
              const line = new LineString(part);
              const segmentLabelStyle = drawStyles.getSegmentLabelStyle({ line, projection, scale: styleScale });
              style = style.concat(segmentLabelStyle);
            });
          });
        }
        if (newStyleObj.showMeasure) {
          const featureCoords = feature.getGeometry().getCoordinates();
          featureCoords.forEach(parts => {
            const polygon = new Polygon(parts);
            const label = drawStyles.formatArea({ polygon, useHectare: true, projection, localization });
            const point = polygon.getInteriorPoint();
            const labelStyle = drawStyles.getLabelStyle(styleScale);
            labelStyle.setGeometry(point);
            labelStyle.getText().setText(label);
            style = style.concat(labelStyle);
          });
        }
        break;
      case 'Point':
      case 'MultiPoint':
        style[0] = drawStyles.createRegularShape(newStyleObj.pointType, newStyleObj.pointSize, fill, stroke, newStyleObj.objRotation);
        break;
      case 'TextPoint':
        style[0] = new Style({
          text: new Text({
            text: newStyleObj.textString || 'Text',
            font,
            fill,
            rotation: (newStyleObj.objRotation / 360) * Math.PI || 0,
            backgroundFill: bgFill,
            backgroundStroke: bgStroke,
            padding: newStyleObj.paddingText
          })
        });
        feature.set(annotationField, newStyleObj.textString || 'Text');
        break;
      default:
        style[0] = drawStyles.createRegularShape(newStyleObj.pointType, newStyleObj.pointSize, fill, stroke);
        break;
    }
    if (newStyleObj.selected) {
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
    feature.set('origostyle', styleObject);
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
    const bgFillColorEl = document.getElementById('o-draw-style-backgroundFillColor');
    const bgStrokeColorEl = document.getElementById('o-draw-style-backgroundStrokeColor');

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

    matches = bgFillColorEl.querySelectorAll('span');
    for (let i = 0; i < matches.length; i += 1) {
      matches[i].addEventListener('click', function e() {
        setBackgroundFillColor(this.style.backgroundColor);
        styleSelectedFeatures();
      });
    }

    matches = bgStrokeColorEl.querySelectorAll('span');
    for (let i = 0; i < matches.length; i += 1) {
      matches[i].addEventListener('click', function e() {
        setBackgroundStrokeColor(this.style.backgroundColor);
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

    document.getElementById('o-draw-style-backgroundFillOpacitySlider').addEventListener('input', function e() {
      swStyle.backgroundFillOpacity = escapeQuotes(this.value);
      setBackgroundFillColor(swStyle.backgroundFillColor, escapeQuotes(this.value));
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

    document.getElementById('o-draw-style-backgroundStrokeWidthSlider').addEventListener('input', function e() {
      swStyle.backgroundStrokeWidth = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-backgroundStrokeType').addEventListener('change', function e() {
      swStyle.backgroundStrokeType = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-backgroundStrokeOpacitySlider').addEventListener('input', function e() {
      swStyle.backgroundStrokeOpacity = escapeQuotes(this.value);
      setBackgroundStrokeColor(swStyle.backgroundStrokeColor);
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

    document.getElementById('o-draw-style-rotationSlider').addEventListener('input', function e() {
      swStyle.objRotation = escapeQuotes(this.value);
      styleSelectedFeatures();
    });

    document.getElementById('o-draw-style-paddingSlider').addEventListener('input', function e() {
      swStyle.paddingText = escapeQuotes(this.value);
      styleSelectedFeatures();
    });
  }

  annotationField = optOptions.annotation || 'annotation';
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
      mapProjection = viewer.getProjection().getCode();
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
        innerHTML: `${styleTemplate({ palette, swStyle, localization })}`
      });

      this.addComponent(headerEl);
      this.addComponent(contentEl);

      this.on('render', this.onRender);
      const target = optOptions.target || viewer.getId();
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
