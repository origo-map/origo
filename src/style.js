import Point from 'ol/geom/Point';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import $ from 'jquery';
import viewer from './viewer';
import validateurl from './utils/validateurl';
import stylefunctions from './style/stylefunctions';
import replacer from '../src/utils/replacer';
import maputils from './maputils';

let baseUrl;

const white = [255, 255, 255, 1];
const blue = [0, 153, 255, 1];
const width = 3;

// default edit style options
const editStyleOptions = {
  Point: [{
    circle: {
      radius: 1,
      stroke: {
        color: blue,
        width: 0
      },
      fill: {
        color: blue
      }
    }
  }],
  LineString: [{
    stroke: {
      color: white,
      width: width + 2
    }
  },
  {
    stroke: {
      color: blue,
      width
    }
  }
  ],
  Polygon: [{
    stroke: {
      color: white,
      width: width + 2
    }
  },
  {
    stroke: {
      color: blue,
      width
    }
  }
  ]
};

function createStyleOptions(styleParams) {
  const styleOptions = {};
  if (Object.prototype.hasOwnProperty.call(styleParams, 'geometry')) {
    switch (styleParams.geometry) {
      case 'centerPoint':
        styleOptions.geometry = function centerPoint(feature) {
          const coordinates = maputils.getCenter(feature.getGeometry());
          return new Point(coordinates);
        };
        break;
      case 'endPoint':
        styleOptions.geometry = function endPoint(feature) {
          const coordinates = feature.getGeometry().getLastCoordinate();
          return new Point(coordinates);
        };
        break;
      default:
      {
        break;
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'zIndex')) {
    styleOptions.zIndex = styleParams.zIndex;
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'fill')) {
    styleOptions.fill = new Fill(styleParams.fill);
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'stroke')) {
    styleOptions.stroke = new Stroke(styleParams.stroke);
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'text')) {
    styleOptions.text = new Text(styleParams.text);
    if (Object.prototype.hasOwnProperty.call(styleParams.text, 'fill')) {
      styleOptions.text.setFill(new Fill(styleParams.text.fill));
    }
    if (Object.prototype.hasOwnProperty.call(styleParams.text, 'stroke')) {
      styleOptions.text.setStroke(new Stroke(styleParams.text.stroke));
    }
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'icon')) {
    const styleIcon = styleParams.icon;
    if (Object.prototype.hasOwnProperty.call(styleIcon, 'src')) {
      styleIcon.src = validateurl(styleIcon.src, baseUrl);
    }
    styleOptions.image = new Icon(styleIcon);
  }
  if (Object.prototype.hasOwnProperty.call(styleParams, 'circle')) {
    styleOptions.image = new Circle({
      radius: styleParams.circle.radius,
      fill: new Fill(styleParams.circle.fill) || undefined,
      stroke: new Stroke(styleParams.circle.stroke) || undefined
    });
  }
  return styleOptions;
}

function createStyleList(styleOptions) {
  const styleList = [];
  // Create style for each rule
  for (let i = 0; i < styleOptions.length; i += 1) {
    let styleRule = [];
    let styleOption;
    // Check if rule is array, ie multiple styles for the rule
    if (styleOptions[i].constructor === Array) {
      for (let j = 0; j < styleOptions[i].length; j += 1) {
        styleOption = createStyleOptions(styleOptions[i][j]);
        styleRule.push(new Style(styleOption));
      }
    } else {
      styleOption = createStyleOptions(styleOptions[i]);
      styleRule = [new Style(styleOption)];
    }

    styleList.push(styleRule);
  }
  return styleList;
}

function checkOptions(feature, scale, styleSettings, styleList, size) {
  const s = styleSettings;
  for (let j = 0; j < s.length; j += 1) {
    let styleL;
    if (viewer.checkScale(scale, s[j][0].maxScale, s[j][0].minScale)) {
      s[j].some((element, index) => {
        if (Object.prototype.hasOwnProperty.call(element, 'text') && size) {
          styleList[j][index].getText().setText(size);
        } else if (Object.prototype.hasOwnProperty.call(element, 'text')) {
          styleList[j][index].getText().setText(replacer.replace(element.text.text, feature.getProperties()));
        }
        return null;
      });
      if (Object.prototype.hasOwnProperty.call(s[j][0], 'filter')) {
        let expr;
        // find attribute vale between [] defined in styles
        const matches = s[j][0].filter.match(/\[(.*?)\]/);
        if (matches) {
          let first = feature;
          if (feature.get('features')) {
            first = feature.get('features')[0];
          }
          const featAttr = matches[1];
          expr = s[j][0].filter.split(']')[1];
          const featMatch = first.get(featAttr);
          expr = typeof featMatch === 'number' ? featMatch + expr : `"${featMatch}"${expr}`;
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
  return null;
}

function styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList) {
  const resolutions = viewer.getResolutions();
  const fn = function fn(feature, resolution) {
    const scale = viewer.getScale(resolution);
    let styleL;
    // If size is larger than, it is a cluster
    const size = clusterStyleList ? feature.get('features').length : 1;
    if (size > 1 && resolution !== resolutions[resolutions.length + 1]) {
      styleL = checkOptions(feature, scale, clusterStyleSettings, clusterStyleList, size.toString());
      // clusterStyleList[0].setText(size);
    } else {
      styleL = checkOptions(feature, scale, styleSettings, styleList);
    }
    return styleL;
  };
  return fn;
}

function createStyle(styleName, clusterStyleName) {
  const styleSettings = viewer.getStyleSettings()[styleName];
  if ($.isEmptyObject(styleSettings)) {
    alert(`Style ${styleName} is not defined`);
  }
  if (Object.prototype.hasOwnProperty.call(styleSettings[0][0], 'custom')) {
    const style = stylefunctions(styleSettings[0][0].custom, styleSettings[0][0].params);
    return style;
  }
  const clusterStyleSettings = viewer.getStyleSettings()[clusterStyleName];
  const style = (function style() {
    // Create style for each rule
    const styleList = createStyleList(styleSettings);
    if (clusterStyleSettings) {
      const clusterStyleList = createStyleList(clusterStyleSettings);
      return styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList);
    }
    return styleFunction(styleSettings, styleList);
  }());
  return style;
}

function createStyleRule(options) {
  let styleRule = [];
  let styleOption;
  if (options.constructor === Array) {
    for (let i = 0; i < options.length; i += 1) {
      styleOption = createStyleOptions(options[i]);
      styleRule.push(new Style(styleOption));
    }
  } else {
    styleOption = createStyleOptions(options);
    styleRule = [new Style(styleOption)];
  }
  return styleRule;
}

function createGeometryStyle(geometryStyleOptions) {
  return {
    Point: createStyleRule(geometryStyleOptions.Point),
    MultiPoint: createStyleRule(geometryStyleOptions.Point),
    LineString: createStyleRule(geometryStyleOptions.LineString),
    MultiLineString: createStyleRule(geometryStyleOptions.LineString),
    Polygon: createStyleRule(geometryStyleOptions.Polygon),
    MultiPolygon: createStyleRule(geometryStyleOptions.Polygon)
  };
}

function createEditStyle() {
  return createGeometryStyle(editStyleOptions);
}

function Init() {
  baseUrl = viewer.getBaseUrl();
}

export default function () {
  return {
    init: Init,
    createStyleOptions,
    createStyleList,
    createStyleRule,
    createStyle,
    styleFunction,
    createEditStyle,
    createGeometryStyle
  };
}
