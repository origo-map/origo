import Point from 'ol/geom/Point';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Text from 'ol/style/Text';
import stylefunctions from './style/stylefunctions';
import replacer from './utils/replacer';
import maputils from './maputils';

const white = [255, 255, 255, 1];
const blue = [0, 153, 255, 1];
const width = 3;

const styleTypes = {
  stylefunction({ name, params }) {
    return stylefunctions(name, params);
  }
};
const addStyleType = function addStyleType(styleType, fn) {
  styleTypes[styleType] = fn;
  return styleTypes;
};

function getCustomStyle(type, options = {}) {
  if (styleTypes[type]) {
    return styleTypes[type](options);
  }
  return false;
}

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

// Will become an issue if 150 dpi is no longer the "standard" dpi setting
function multiplyByFactor(value, scaleToDpi = 150) {
  return value * (scaleToDpi / 150);
}

function createStyleOptions(orgStyleParams, scaleToDpi) {
  const styleParams = JSON.parse(JSON.stringify(orgStyleParams));
  const styleScale = scaleToDpi ? multiplyByFactor(1.5, scaleToDpi) : undefined;
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
  if ('zIndex' in styleParams) {
    styleOptions.zIndex = styleParams.zIndex;
  }
  if ('fill' in styleParams) {
    styleOptions.fill = new Fill(styleParams.fill);
  }
  if ('stroke' in styleParams) {
    if (scaleToDpi && styleParams.stroke.width) {
      styleParams.stroke.width = multiplyByFactor(styleParams.stroke.width, scaleToDpi);
    }
    styleOptions.stroke = new Stroke(styleParams.stroke);
  }
  if ('text' in styleParams) {
    if (scaleToDpi && styleParams.text.offsetX) {
      styleParams.text.offsetX = multiplyByFactor(styleParams.text.offsetX, scaleToDpi * 1.5);
    }
    if (scaleToDpi && styleParams.text.offsetY) {
      styleParams.text.offsetY = multiplyByFactor(styleParams.text.offsetY, scaleToDpi * 1.3);
    }
    styleOptions.text = new Text(styleParams.text);
    if (scaleToDpi) {
      const textScale = styleParams.text.scale ? multiplyByFactor(styleParams.text.scale, scaleToDpi) : styleScale;
      styleOptions.text.setScale(textScale);
    }
    if ('fill' in styleParams.text) {
      styleOptions.text.setFill(new Fill(styleParams.text.fill));
    }
    if ('stroke' in styleParams.text) {
      if (scaleToDpi && styleParams.text.stroke.width) {
        styleParams.text.stroke.width = multiplyByFactor(styleParams.text.stroke.width, scaleToDpi);
      }
      styleOptions.text.setStroke(new Stroke(styleParams.text.stroke));
    }
  }
  if ('icon' in styleParams) {
    const styleIcon = styleParams.icon;
    styleOptions.image = new Icon(styleIcon);
    if (scaleToDpi) {
      const imageScale = styleParams.icon.scale ? multiplyByFactor(styleParams.icon.scale, scaleToDpi) : styleScale;
      styleOptions.image.setScale(imageScale);
    }
  }
  if ('circle' in styleParams) {
    styleOptions.image = new Circle({
      radius: styleParams.circle.radius,
      scale: styleParams.circle.scale || undefined,
      fill: new Fill(styleParams.circle.fill) || undefined,
      stroke: new Stroke(styleParams.circle.stroke) || undefined
    });
    if (scaleToDpi) {
      const imageScale = styleParams.circle.scale ? multiplyByFactor(styleParams.circle.scale, scaleToDpi) : styleScale;
      styleOptions.image.setScale(imageScale);
    }
  }
  return styleOptions;
}

function createStyleList(styleOptions, scaleToDpi) {
  const styleList = [];
  // Create style for each rule
  for (let i = 0; i < styleOptions.length; i += 1) {
    let styleRule = [];
    let styleOption;
    // Check if rule is array, ie multiple styles for the rule
    if (styleOptions[i].constructor === Array) {
      for (let j = 0; j < styleOptions[i].length; j += 1) {
        styleOption = createStyleOptions(styleOptions[i][j], scaleToDpi);
        styleRule.push(new Style(styleOption));
      }
    } else {
      styleOption = createStyleOptions(styleOptions[i], scaleToDpi);
      styleRule = [new Style(styleOption)];
    }

    styleList.push(styleRule);
  }
  return styleList;
}

function checkOptions(options = {}) {
  const {
    feature, scale, styleSettings, styleList, size
  } = options;
  const s = styleSettings;
  for (let j = 0; j < s.length; j += 1) {
    let styleL;
    if (maputils.isWithinVisibleScales(scale, s[j][0].maxScale, s[j][0].minScale)) {
      s[j].some((element, index) => {
        if (Object.prototype.hasOwnProperty.call(element, 'text') && size) {
          styleList[j][index].getText().setText(size);
        } else if (Object.prototype.hasOwnProperty.call(element, 'text') && feature) {
          styleList[j][index].getText().setText(replacer.replace(element.text.text, feature.getProperties()));
        }
        if (element.icon && Object.prototype.hasOwnProperty.call(element.icon, 'rotation')) {
          const degrees = replacer.replace(element.icon.rotation, feature.getProperties());
          const radians = degrees * (Math.PI / 180);
          styleList[j][index].getImage().setRotation(radians);
        }
        return null;
      });
      if (Object.prototype.hasOwnProperty.call(s[j][0], 'filter')) {
        let expr;
        const exprArr = [];
        // find attribute vale between [] defined in styles
        let regexExpr;
        let regexFilter;
        let featMatch;
        let filters = [];
        let filtering = '';
        // Check for filtering on AND or OR
        if (s[j][0].filter.search(' AND ') > 0) {
          filters = s[j][0].filter.split(' AND ');
          filtering = 'AND';
        } else if (s[j][0].filter.search(' OR ') > 0) {
          filters = s[j][0].filter.split(' OR ');
          filtering = 'OR';
        } else {
          // Remove AND or OR filtering in the case it matched the one or other
          filters = s[j][0].filter.split(' AND ');
          filters = filters[0].split(' OR ');
        }
        // eslint-disable-next-line consistent-return
        filters.forEach((item) => {
          const matches = item.match(/\[(.*?)\]/);
          if (matches) {
            let first = feature;
            if (feature.get('features')) {
              first = feature.get('features')[0];
            }
            const featAttr = matches[1];
            expr = item.split(']')[1];
            featMatch = first.get(featAttr);
            regexFilter = item.match(/\/(.*)\/([a-zA-Z]+)?/);
            expr = typeof featMatch === 'number' ? featMatch + expr : `"${featMatch}"${expr}`;
          }
          if (regexFilter) {
            regexExpr = new RegExp(regexFilter[1], regexFilter[2]);
            filtering = 'RegExp';
          }
          exprArr.push(expr);
        });
        let filterMatch = true;
        let filterMatchOR = false;
        // Check for true/false depending on if it is AND, OR, RegExp or single filtering
        exprArr.forEach((exp) => {
          if (filtering === 'AND') {
            // eslint-disable-next-line no-eval
            if (eval(exp) && filterMatch) {
              filterMatch = true;
            } else {
              filterMatch = false;
            }
          } else if (filtering === 'OR') {
            // eslint-disable-next-line no-eval
            if ((eval(exp) || filterMatchOR)) {
              filterMatch = true;
            } else {
              filterMatch = false;
            }
            filterMatchOR = filterMatch;
          } else if (filtering === 'RegExp') {
            // eslint-disable-next-line no-eval
            if (regexExpr.test(featMatch)) {
              filterMatch = true;
            } else {
              filterMatch = false;
            }
          } else if (filtering === '') {
            // eslint-disable-next-line no-eval
            if (eval(exp)) {
              filterMatch = true;
            } else {
              filterMatch = false;
            }
          }
        });
        if (filterMatch) {
          if (s[j][0].visible !== false) {
            styleL = styleList[j];
            return styleL;
          }
          return null;
        }
      } else if (s[j][0].visible !== false) {
        styleL = styleList[j];
        return styleL;
      }
    }
  }
  return null;
}

function styleFunction({
  styleSettings,
  styleList,
  clusterStyleSettings,
  clusterStyleList,
  projection,
  resolutions,
  scaleToDpi
} = {}) {
  const fn = function fn(feature, resolution) {
    const scale = maputils.resolutionToScale(resolution, projection);
    let styleL;
    // If size is larger than 1, it is a cluster
    const size = clusterStyleList ? feature.get('features').length : 1;
    if (size > 1 && resolution !== resolutions[resolutions.length + 1]) {
      styleL = checkOptions({ feature, scale, styleSettings: clusterStyleSettings, styleList: clusterStyleList, size: size.toString(), scaleToDpi });
    } else {
      styleL = checkOptions({ feature, scale, styleSettings, styleList, scaleToDpi });
    }
    return styleL;
  };
  return fn;
}

function createStyle({
  style: styleName,
  clusterStyleName,
  viewer,
  layer,
  file,
  source,
  type,
  name,
  scaleToDpi
} = {}) {
  const resolutions = viewer.getResolutions();
  const projection = viewer.getProjection();
  const styleSettings = viewer.getStyle(styleName);

  if (!styleSettings || Object.keys(styleSettings).length === 0) {
    const style = getCustomStyle('stylefunction', { name: 'default' });
    return style;
  }
  if ('custom' in styleSettings[0][0]) {
    let style;
    if (typeof styleSettings[0][0].custom === 'string') {
      style = getCustomStyle('stylefunction', { name: styleSettings[0][0].custom, params: styleSettings[0][0].params });
    } else if (typeof styleSettings[0][0].custom === 'object') {
      style = getCustomStyle(type, {
        layer, file, source, name
      });
    }
    return style || stylefunctions('default');
  }
  const clusterStyleSettings = clusterStyleName ? viewer.getStyle(clusterStyleName) : null;

  const style = (function style() {
    // Create style for each rule
    const styleList = createStyleList(styleSettings, scaleToDpi);
    if (clusterStyleSettings) {
      const clusterStyleList = createStyleList(clusterStyleSettings, scaleToDpi);
      return styleFunction({
        styleSettings,
        styleList,
        clusterStyleSettings,
        clusterStyleList,
        projection,
        resolutions,
        scaleToDpi
      });
    }
    return styleFunction({
      styleSettings,
      styleList,
      projection,
      resolutions,
      scaleToDpi
    });
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
function createGeometryCollectionStyle(options) {
  const styleRule = [];

  createStyleRule(options.Point).forEach((item) => {
    styleRule.push(item);
  });
  createStyleRule(options.LineString).forEach((item) => {
    styleRule.push(item);
  });
  createStyleRule(options.Polygon).forEach((item) => {
    styleRule.push(item);
  });
  return styleRule;
}

function createGeometryStyle(geometryStyleOptions) {
  return {
    Point: createStyleRule(geometryStyleOptions.Point),
    MultiPoint: createStyleRule(geometryStyleOptions.Point),
    LineString: createStyleRule(geometryStyleOptions.LineString),
    MultiLineString: createStyleRule(geometryStyleOptions.LineString),
    Polygon: createStyleRule(geometryStyleOptions.Polygon),
    MultiPolygon: createStyleRule(geometryStyleOptions.Polygon),
    GeometryCollection: createGeometryCollectionStyle(geometryStyleOptions)
  };
}

function createEditStyle() {
  return createGeometryStyle(editStyleOptions);
}

export default {
  createStyleOptions,
  createStyleList,
  createStyleRule,
  createStyle,
  styleFunction,
  createEditStyle,
  createGeometryStyle,
  addStyleType
};
