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
  } else if (styleTypes.icon) {
    return 'Icon';
  } else if (styleTypes.image) {
    return 'Image';
  } else if (styleTypes.text) {
    return 'Text';
  }
  return null;
};

// If there is only one styleRule that will be used as header icon, but not if that is extendedLegend. In latter case null is returned  meaning that list_icon will be set as header icon.
// If there are more than one styleRule the last styleRule flagged as header will be returned. In other words, if there are for example 3 styleRules
// an all of them have header=true, then the last one will be returned and set on the icon legend.
// If there are more than one styleRule but none of them has header flag, then null is returned meaning that list_icon will be set as header icon.
export const findHeaderStyle = function findHeaderStyle(styleRules) {
  if (styleRules.length === 1) {
    const icons = styleRules[0].filter(sr => sr.icon);
    if (icons && icons.length && icons[0].extendedLegend) {
      return null;
    }
    return styleRules[0];
  }
  return styleRules.reduce((prev, styleRule) => {
    const headerItems = styleRule.filter(style => style.header);
    if (headerItems.length) {
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
    } else if (styleType === 'Image') {
      const iconOption = styleRule.find(style => style.image.src);
      const icon = renderIcon.Icon(iconOption.image);
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

export const renderExtendedLegendItem = function renderExtendedLegendItem(extendedLegendItem) {
  return `<li class="flex row align-center padding-y-smallest">
            <img class="extendedlegend pointer" src=${extendedLegendItem.icon.src} />
          </li>`;
};

export const Legend = function Legend(styleRules, opacity = 1) {
  const noLegend = 'Legend saknas';
  if (Array.isArray(styleRules)) {
    const legend = styleRules.reduce((prevRule, styleRule) => {
      if (Array.isArray(styleRule)) {
        if (!isHidden(styleRule)) {
          const labelItem = styleRule.find(style => style.label) || {};
          const extendedLegendItem = styleRule.find(style => style.extendedLegend);
          const label = labelItem.label || '';
          if (extendedLegendItem && extendedLegendItem.icon) {
            return prevRule + renderExtendedLegendItem(extendedLegendItem);
          }

          const svgIcon = renderSvgIcon(styleRule, { opacity });
          return prevRule + renderLegendItem(svgIcon, label);
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
