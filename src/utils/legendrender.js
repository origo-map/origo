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
    const {
      color: fillColor
    } = fillOptions;
    const {
      color: strokeColor,
      lineDash,
      width: widthOption = 2
    } = strokeOptions;
    const {
      radius: radiusOption = circleSize / 2
    } = options;
    const width = widthOption > 4 ? 4 : widthOption;
    const radius = radiusOption - width;
    let stroke = 'stroke: none;';
    if (strokeColor) {
      const strokeDasharray = lineDash ? 'stroke-dasharray: 4 4;' : '';
      stroke = `stroke: ${strokeColor}; stroke-width: ${width}; ${strokeDasharray}`;
    }
    const fill = fillColor ? `fill: ${fillColor};` : 'fill: none;';
    const centerDistance = circleSize / 2;

    return `<circle cx="${centerDistance}" cy="${centerDistance}" r="${radius}" style="${fill} ${stroke}"/>`;
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
    return `<img class="${fit}" src="${iconStyle.src}" style="${style}"/>`;
  },
  Image(iconStyle) {
    const fit = iconStyle.fit ? 'contain' : 'cover';
    return `<img class="${fit}" src="${iconStyle.src}"/>`;
  },
  Text(color) {
    const fill = color ? `fill: ${color};` : 'fill: #000;';
    return `<path d="M5 4v3h5.5v12h3V7H19V4z" style="${fill}"/>`;
  }
};
