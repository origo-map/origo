import { dom } from '../ui';

const size = 24;

export const renderSvg = function renderSvg(content, {
  opacityOption,
  size: sizeOption = size
} = {}) {
  const style = `style="height:${size}px; width: ${size}px"`;
  const opacity = opacityOption ? `opacity="${opacityOption}"` : '';
  return `<svg ${style} height="${sizeOption}" width="${sizeOption}" ${opacity} viewBox="0 0 ${sizeOption} ${sizeOption}">${content}</svg>`;
};

export const renderIcon = {
  Line({
    color,
    lineDash,
    width: widthOption = 2
  } = {}) {
    const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
    const width = widthOption > 7 ? 7 : widthOption;
    const margin = 4;
    const stroke = `stroke: ${color}; stroke-width: ${width}; ${strokeDasharray}`;
    return `<line x1 ="${margin}" y1="${(size - margin)}" x2="${(size - margin)}" y2="${margin}" style="${stroke}"/>`;
  },
  Polygon(
    {
      color: fillColor
    } = {},
    {
      color: strokeColor,
      lineDash
    } = {}
  ) {
    const r = 2;
    const strokeWidth = 2;
    const margin = 2;
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    let stroke = 'stroke: none;';
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${strokeWidth}; ${strokeDasharray}`;
    }
    return `<rect x="${strokeWidth + margin}" y="${strokeWidth + margin}" height="${size - (strokeWidth * 2) - (margin * 2)}" width="${size - (strokeWidth * 2) - (margin * 2)}" rx="${r}" style="${fill} ${stroke}"/>`;
  },
  Circle(options = {}, circleSize = size) {
    const fillOptions = options.fill || {};
    const strokeOptions = options.stroke || {};
    let {
      color: fillColor
    } = fillOptions;
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const {
      radius: radiusOption = circleSize / 2
    } = options;
    const width = widthOption > 4 ? 4 : widthOption;
    const radius = radiusOption - width;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    if (typeof fillColor === 'object') {
      fillColor = `rgba(${fillColor[0]},${fillColor[1]},${fillColor[2]},${fillColor[3] || 1})`;
    }
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    const centerDistance = circleSize / 2;

    return `<circle cx="${centerDistance}" cy="${centerDistance}" r="${radius}" style="${fill} ${stroke}"/>`;
  },
  Square(options = {}) {
    const fillOptions = options.fill || {};
    const strokeOptions = options.stroke || {};
    let {
      color: fillColor
    } = fillOptions;
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const width = widthOption > 4 ? 4 : widthOption;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    if (typeof fillColor === 'object') {
      fillColor = `rgba(${fillColor[0]},${fillColor[1]},${fillColor[2]},${fillColor[3] || 1})`;
    }
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    return `<rect x="3" y="5" height="12" width="12" style="${fill} ${stroke}"/>`;
  },
  Triangle(options = {}) {
    const fillOptions = options.fill || {};
    const strokeOptions = options.stroke || {};
    let {
      color: fillColor
    } = fillOptions;
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const width = widthOption > 4 ? 4 : widthOption;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    if (typeof fillColor === 'object') {
      fillColor = `rgba(${fillColor[0]},${fillColor[1]},${fillColor[2]},${fillColor[3] || 1})`;
    }
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    return `<polygon points="10,2 2,18 18,18" style="${fill} ${stroke}"/>`;
  },
  Star(options = {}) {
    const fillOptions = options.fill || {};
    const strokeOptions = options.stroke || {};
    let {
      color: fillColor
    } = fillOptions;
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const width = widthOption > 4 ? 4 : widthOption;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    if (typeof fillColor === 'object') {
      fillColor = `rgba(${fillColor[0]},${fillColor[1]},${fillColor[2]},${fillColor[3] || 1})`;
    }
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    return `<polygon points="10,1 12,7 18,7 13,11 15,18 10,14 5,18 7,11 2,7 8,7" style="${fill} ${stroke}"/>`;
  },
  Cross(options = {}) {
    const strokeOptions = options.stroke || {};
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const width = widthOption > 4 ? 4 : widthOption;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    return `<line x1="12" y1="0" x2="12" y2="24" style="${stroke}" /><line x1="0" y1="12" x2="24" y2="12" style="${stroke}" />`;
  },
  X(options = {}) {
    const strokeOptions = options.stroke || {};
    let {
      color: strokeColor
    } = strokeOptions;
    const {
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const width = widthOption > 4 ? 4 : widthOption;
    let stroke = 'stroke: none;';
    if (strokeColor && typeof strokeColor === 'object') {
      strokeColor = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${strokeColor[3] || 1})`;
    }
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    return `<line x1="2" y1="2" x2="18" y2="18" style="${stroke}" stroke-width="4" /><line x1="2" y1="18" x2="18" y2="2" style="${stroke}" stroke-width="4" />`;
  },
  Icon(iconStyle) {
    const fit = iconStyle.fit ? 'contain' : 'cover';
    const iconSize = iconStyle.size || iconStyle.imgSize || [size, size];

    // if imgSize is set, svg is assumed
    const isSvg = 'imgSize' in iconSize;
    let style = '';
    if (isSvg) {
      const marginTop = !iconStyle.fit && iconSize[1] > size ? `${-(iconSize[1] - size) / 2}px` : 0;
      style = dom.createStyle({
        height: `${iconSize[0]}px`,
        width: `${iconSize[1]}px`,
        'margin-top': marginTop
      });
    }
    return `<img class="${fit}" src="${iconStyle.src}" style="${style}" alt="Lager ikon"/>`;
  },
  Image(iconStyle) {
    const fit = iconStyle.fit ? 'contain' : 'cover';
    return `<img class="${fit}" src="${iconStyle.src}" alt="Lager ikon"/>`;
  },
  Text(color) {
    const fill = color ? `fill: ${color};` : 'fill: #000;';
    return `<path d="M5 4v3h5.5v12h3V7H19V4z" style="${fill}"/>`;
  }
};
