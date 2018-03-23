"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var validateUrl = require('./utils/validateurl');
var styleFunctions = require('./style/stylefunctions');
var replacer = require('../src/utils/replacer');
var mapUtils = require('./maputils');

var baseUrl;

var white = [255, 255, 255, 1];
var blue = [0, 153, 255, 1];
var width = 3;

//default edit style options
var editStyleOptions = {
  'Point': [{
    "circle": {
      "radius": 1,
      "stroke": {
        "color": blue,
        "width": 0
      },
      "fill": {
        "color": blue
      }
    }
  }],
  'LineString': [{
      'stroke': {
        color: white,
        width: width + 2
      }
    },
    {
      'stroke': {
        color: blue,
        width: width
      }
    }
  ],
  'Polygon': [{
      'stroke': {
        color: white,
        width: width + 2
      }
    },
    {
      'stroke': {
        color: blue,
        width: width
      }
    }
  ]
};

module.exports = function() {

  return {
    init: Init,
    createStyleOptions: createStyleOptions,
    createStyleList: createStyleList,
    createStyleRule: createStyleRule,
    createStyle: createStyle,
    styleFunction: styleFunction,
    createEditStyle: createEditStyle,
    createGeometryStyle: createGeometryStyle
  };
};

function Init() {
  baseUrl = Viewer.getBaseUrl();
}

function createStyleOptions(styleParams) {
  var styleOptions = {};
  if (styleParams.hasOwnProperty('geometry')) {
    switch (styleParams.geometry) {
      case 'centerPoint':
        styleOptions.geometry = function(feature) {
          var coordinates = mapUtils.getCenter(feature.getGeometry());
          return new ol.geom.Point(coordinates);
        }
        break;
      case 'endPoint':
        styleOptions.geometry = function(feature) {
          var coordinates = feature.getGeometry().getLastCoordinate();
          return new ol.geom.Point(coordinates);
        }
        break;
    }
  }
  if (styleParams.hasOwnProperty('zIndex')) {
    styleOptions.zIndex = styleParams.zIndex;
  }
  if (styleParams.hasOwnProperty('fill')) {
    styleOptions.fill = new ol.style.Fill(styleParams.fill);
  }
  if (styleParams.hasOwnProperty('stroke')) {
    styleOptions.stroke = new ol.style.Stroke(styleParams.stroke);
  }
  if (styleParams.hasOwnProperty('text')) {
    styleOptions.text = new ol.style.Text(styleParams.text);
    if (styleParams.text.hasOwnProperty('fill')) {
      styleOptions.text.setFill(new ol.style.Fill(styleParams.text.fill));
    }
    if (styleParams.text.hasOwnProperty('stroke')) {
      styleOptions.text.setStroke(new ol.style.Stroke(styleParams.text.stroke));
    }
  }
  if (styleParams.hasOwnProperty('icon')) {
    if (styleParams.icon.hasOwnProperty('src')) {
      styleParams.icon.src = validateUrl(styleParams.icon.src, baseUrl);
    }
    styleOptions.image = new ol.style.Icon(styleParams.icon);
  }
  if (styleParams.hasOwnProperty('circle')) {
    styleOptions.image = new ol.style.Circle({
      radius: styleParams.circle.radius,
      fill: new ol.style.Fill(styleParams.circle.fill) || undefined,
      stroke: new ol.style.Stroke(styleParams.circle.stroke) || undefined
    });
  }
  return styleOptions;
}

function createStyleList(styleOptions) {
  var styleList = [];
  //Create style for each rule
  for (var i = 0; i < styleOptions.length; i++) {
    var styleRule = [];
    var styleOption;
    //Check if rule is array, ie multiple styles for the rule
    if (styleOptions[i].constructor === Array) {
      for (var j = 0; j < styleOptions[i].length; j++) {
        styleOption = createStyleOptions(styleOptions[i][j]);
        styleRule.push(new ol.style.Style(styleOption));
      }
    }
    //If single style for rule
    else {
      styleOption = createStyleOptions(styleOptions[i]);
      styleRule = [new ol.style.Style(styleOption)];
    }

    styleList.push(styleRule);
  }
  return styleList;
}

function createStyle(styleName, clusterStyleName) {
  var styleSettings = Viewer.getStyleSettings()[styleName];
  if ($.isEmptyObject(styleSettings)) {
    alert('Style ' + styleName + ' is not defined');
  }
  if (styleSettings[0][0].hasOwnProperty("custom")) {
    var style = styleFunctions(styleSettings[0][0].custom, styleSettings[0][0].params);
    return style;
  } else {
    var clusterStyleSettings = Viewer.getStyleSettings()[clusterStyleName];
    var style = (function() {
      //Create style for each rule
      var styleList = createStyleList(styleSettings);
      if (clusterStyleSettings) {
        var clusterStyleList = createStyleList(clusterStyleSettings);
        return styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList);
      } else {
        return styleFunction(styleSettings, styleList);
      }

    })()
    return style;
  }
}

function createStyleRule(options) {
  var styleRule = [],
    styleOption;
  if (options.constructor === Array) {
    for (var i = 0; i < options.length; i++) {
      var styleOption = createStyleOptions(options[i]);
      styleRule.push(new ol.style.Style(styleOption));
    }
  }
  //If single style for rule
  else {
    styleOption = createStyleOptions(options);
    styleRule = [new ol.style.Style(styleOption)];
  }
  return styleRule;
}

function styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList) {
  var s = styleSettings;
  var resolutions = Viewer.getResolutions();
  var fn = function(feature, resolution) {
    var scale = Viewer.getScale(resolution);
    var styleL;
    //If size is larger than, it is a cluster
    var size = clusterStyleList ? feature.get('features').length : 1;
    if (size > 1 && resolution != resolutions[resolutions.length + 1]) {
      styleL = checkOptions(feature, scale, clusterStyleSettings, clusterStyleList, size.toString());
      // clusterStyleList[0].setText(size);
    } else {
      styleL = checkOptions(feature, scale, styleSettings, styleList);
    }
    return styleL;
  }
  return fn;
}

function createEditStyle() {
  return createGeometryStyle(editStyleOptions);
}

function createGeometryStyle(geometryStyleOptions) {
  return {
    'Point': createStyleRule(geometryStyleOptions.Point),
    'MultiPoint': createStyleRule(geometryStyleOptions.Point),
    'LineString': createStyleRule(geometryStyleOptions.LineString),
    'MultiLineString': createStyleRule(geometryStyleOptions.LineString),
    'Polygon': createStyleRule(geometryStyleOptions.Polygon),
    'MultiPolygon': createStyleRule(geometryStyleOptions.Polygon)
  };
}

function checkOptions(feature, scale, styleSettings, styleList, size) {
  var s = styleSettings;
  for (var j = 0; j < s.length; j++) {
    var styleL;
    if (Viewer.checkScale(scale, s[j][0].maxScale, s[j][0].minScale)) {
      s[j].some(function(element, index, array) {
        if (element.hasOwnProperty('text') && size) {
          styleList[j][index].getText().setText(size);
        } else if (element.hasOwnProperty('text')) {
          styleList[j][index].getText().setText(replacer.replace(element.text.text, feature.getProperties()));
        }
      });
      if (s[j][0].hasOwnProperty('filter')) {
        //find attribute vale between [] defined in styles
        var featAttr, expr, featMatch;
        var matches = s[j][0].filter.match(/\[(.*?)\]/);
        if (matches) {
          if (feature.get('features')) {
            feature = feature.get('features')[0];
          }
          featAttr = matches[1];
          expr = s[j][0].filter.split(']')[1];
          featMatch = feature.get(featAttr);
          expr = typeof featMatch == 'number' ? featMatch + expr : '"' + featMatch + '"' + expr;
        }
        if (eval(expr)) {
          styleL = styleList[j];
          return styleL;
        }
      } else {
        styleL = styleList[j];
        return styleL;
      }
    }
  }
}
