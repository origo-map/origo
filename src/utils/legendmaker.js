import { renderIcon, renderSvg } from './legendrender';

const size = 24;

const isHidden = function isHidden(arr) {
  const hiddenItem = arr.find(item => item.hidden);
  if (hiddenItem) {
    if (hiddenItem.hidden === true) {
      return true;
    }
    return false;
  }
  return false;
};

export const findCircleSize = function findCircleSize(styles) {
  const circleSize = styles.reduce((currentMaxSize, style) => {
    let maxSize;
    if ('circle' in style) {
      const circle = style.circle;
      if (circle.radius) {
        const diameter = circle.radius * 2;
        maxSize = diameter > currentMaxSize ? diameter : currentMaxSize;
      }
    }
    return maxSize;
  }, size);
  return circleSize;
};

export const findStyleType = function findStyleType(styles) {
  const styleTypes = styles.reduce((acc, style) => Object.assign({}, acc, style), {});
  if (styleTypes.stroke && styleTypes.fill) {
    return 'Polygon';
  } else if (styleTypes.stroke) {
    return 'Line';
  } else if (styleTypes.circle) {
    return 'Circle';
  } else if (styleTypes.text) {
    return 'Text';
  } else if (styleTypes.icon) {
    return 'Icon';
  }
  return null;
};

export const findHeaderStyle = function findHeaderStyle(styleRules) {
  if (styleRules.length === 1) {
    return styleRules[0];
  }
  return styleRules.reduce((prev, styleRule) => {
    if (styleRule.filter(style => style.header).length) {
      return styleRule;
    }
    return prev;
  }, null);
};

export const renderSvgIcon = function renderSvgIcon(styleRule, {
  opacity
} = {}) {
  const styleType = findStyleType(styleRule);
  if (styleType in renderIcon) {
    if (styleType === 'Polygon') {
      const polygonOptions = styleRule.find(style => style.fill);
      const icon = renderIcon.Circle({
        fill: polygonOptions.fill,
        stroke: polygonOptions.stroke
      });
      return `${renderSvg(icon, { opacity })}`;
    } else if (styleType === 'Line') {
      const icon = styleRule.reduce((prev, style) => {
        if (style.stroke) {
          return prev + renderIcon.Circle({
            stroke: style.stroke
          });
        }
        return prev;
      }, '');
      return `${renderSvg(icon, { opacity })}`;
    } else if (styleType === 'Circle') {
      const circleSize = findCircleSize(styleRule);
      const icon = styleRule.reduce((prev, style) => {
        if (style.circle) {
          return prev + renderIcon.Circle(style.circle, circleSize);
        }
        return prev;
      }, '');
      return `${renderSvg(icon, { opacity, size: circleSize })}`;
    } else if (styleType === 'Text') {
      const textOptions = styleRule.find(style => style.text);
      const icon = renderIcon.Text(textOptions.text);
      return `${renderSvg(icon, { opacity })}`;
    } else if (styleType === 'Icon') {
      const iconOption = styleRule.find(style => style.icon.src);
      const icon = renderIcon.Icon(iconOption.icon);
      return icon;
    }
    return '';
  }
  return '';
};

export const renderLegendItem = function renderLegendItem(svgIcon, label = '') {
  const style = `style="width: ${size}px; height: ${size}px;"`;
  return `<li class="flex row align-center padding-y-smallest">
            <div ${style} class="icon-small round">${svgIcon}</div>
            <div class="text-smaller padding-left-small">${label}</div>
          </li>`;
};

export const Legend = function Legend(styleRules, opacity = 1) {
  const noLegend = 'Legend saknas';
  if (Array.isArray(styleRules)) {
    const legend = styleRules.reduce((prevRule, styleRule) => {
      if (Array.isArray(styleRule)) {
        if (!isHidden(styleRule)) {
          const labelItem = styleRule.find(style => style.label) || {};
          const label = labelItem.label || '';
          return prevRule + renderLegendItem(renderSvgIcon(styleRule, { opacity }), label);
        }
      }
      return prevRule;
    }, '');
    return `<ul>${legend}</ul>`;
  }
  return `<ul><li class="padding-small">${noLegend}</li></ul>`;
};

export const HeaderIcon = function HeaderIcon(styleRules, opacity = 1) {
  if (Array.isArray(styleRules)) {
    const headerStyle = findHeaderStyle(styleRules);
    if (headerStyle) {
      return renderSvgIcon(headerStyle, { opacity, header: true });
    }
    return null;
  }
  return null;
};
