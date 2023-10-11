import { renderIcon, renderSvg } from './legendrender';
import { Button, Element as El } from '../ui';

const size = 24;
const checkIcon = '#ic_check_circle_24px';
const uncheckIcon = '#ic_radio_button_unchecked_24px';

export const isHidden = function isHidden(arr) {
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
// If there is only one styleRule, but that consist of a compounded style it's checked to see if any of the compounded style has header=true then this is used otherwise default order is applied.
// If there are more than one styleRule the last styleRule flagged as header will be returned. In other words, if there are for example 3 styleRules
// an all of them have header=true, then the last one will be returned and set on the icon legend.
// If there are more than one styleRule but none of them has header flag, then null is returned meaning that list_icon will be set as header icon.
export const findHeaderStyle = function findHeaderStyle(styleRules) {
  if (styleRules.length === 1) {
    const icons = styleRules[0].filter(sr => sr.icon);
    if (icons && icons.length && icons[0].extendedLegend) {
      return null;
    }
    if (styleRules[0].length > 1) {
      for (let index = 0; index < styleRules[0].length; index += 1) {
        const styleRule = styleRules[0][index];
        if (styleRule.header === true) {
          return [styleRule];
        }
      }
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
  const legendCmp = El({ cls: 'flex row align-center padding-y-smallest',
    innerHTML: `<div ${style} class="icon-small round">${svgIcon}</div><div class="text-smaller padding-left-small">${label}</div>` });
  return legendCmp;
};
function updateLayer(layer, viewer) {
  const styleName = layer.get('styleName');
  const style = viewer.getStyle(styleName);
  if (style[0] && style[0].thematic) {
    const thematicArr = style[0].thematic;
    // Check if any theme is not visible, otherwise remove filter
    const checkArr = obj => obj.visible === false;
    if (thematicArr.some(checkArr)) {
      let filterStr = '';
      thematicArr.forEach(theme => {
        if (theme.visible) {
          filterStr += filterStr === '' ? '' : ' OR ';
          filterStr += theme.filter;
        }
      });
      if (filterStr === '') {
        filterStr = "IN ('')";
      }
      layer.getSource().updateParams({ CQL_FILTER: filterStr });
    } else {
      layer.getSource().updateParams({ CQL_FILTER: null });
    }
  }
}

async function setIcon(src, cmp, styleRules, layer, viewer, clickable) {
  const styleName = layer.get('styleName');
  const style = viewer.getStyle(styleName);
  if (!style[0].thematic) {
    style[0].thematic = [];
    const paramsString = src.icon.json;
    const searchParams = new URLSearchParams(paramsString);
    const response = await fetch(src.icon.json);
    const jsonData = await response.json();
    jsonData.Legend[0].rules.forEach(row => {
      searchParams.set('FORMAT', 'image/png');
      searchParams.set('RULE', row.name);
      const imgUrl = decodeURIComponent(searchParams.toString());
      if (typeof row.filter !== 'undefined') {
        style[0].thematic.push({
          image: { src: imgUrl },
          filter: row.filter,
          name: row.name,
          label: row.title || row.name,
          visible: row.visible !== false
        });
      }
    });
    viewer.setStyle(styleName, style);
  }
  const cmps = [];
  for (let index = 0; index < style[0].thematic.length; index += 1) {
    const rule = style[0].thematic[index];
    let label = rule.label || '';
    const svgIcon = renderSvgIcon([rule], { opacity: 1 });
    const elCmps = [];
    if (layer) {
      const toggleButton = Button({
        cls: `round small icon-smaller no-shrink${clickable ? '' : ' cursor-default'}`,
        click() {
          if (clickable) {
            const visible = viewer.getStyles()[styleName][0].thematic[index].visible !== false;
            this.setIcon(!visible ? checkIcon : uncheckIcon);
            const thisStyle = viewer.getStyles()[styleName];
            thisStyle[0].thematic[index].visible = !visible;
            updateLayer(layer, viewer);
          }
        },
        style: {
          'align-self': 'center',
          'padding-left': '0rem'
        },
        icon: viewer.getStyles()[styleName][0].thematic[index].visible === false ? uncheckIcon : checkIcon,
        ariaLabel: 'Växla synlighet',
        tabIndex: -1
      });
      elCmps.push(toggleButton);
      label = `${label}`;
      elCmps.push(renderLegendItem(svgIcon, label, { styleName, index }));
      cmps.push(El({ components: elCmps, tagName: 'li', cls: 'flex row align-center padding-y-smallest' }));
    }
  }
  const newEl = El({ components: cmps, tagName: 'ul' });

  const contentEl = document.getElementById(cmp.getId());
  contentEl.innerHTML = newEl.render();
  newEl.onRender();
}

export const renderExtendedLegendItem = function renderExtendedLegendItem(extendedLegendItem) {
  return El({ innerHTML: `<img class="extendedlegend pointer" src=${extendedLegendItem.icon.src} />` });
};

export const renderExtendedThematicLegendItem = function renderExtendedThematicLegendItem(extendedLegendItem, styleRules, layer, viewer, clickable) {
  const returnCmp = El({
    tagName: 'ul'
  });
  returnCmp.on('render', () => { setIcon(extendedLegendItem, returnCmp, styleRules, layer, viewer, clickable); });

  return returnCmp;
};

export const Legend = function Legend({
  styleRules, layer, viewer, clickable = true, opacity = 1
} = {}) {
  const noLegend = 'Legend saknas';
  if (Array.isArray(styleRules)) {
    let styleName;
    const layerType = layer.get('type');
    if (layer) {
      styleName = layer.get('styleName');
    }
    const thematicStyling = layer.get('thematicStyling');
    let cmps = [];
    styleRules.forEach((rule, index) => {
      if (Array.isArray(rule)) {
        if (!isHidden(rule)) {
          const labelItem = rule.find(style => style.label) || {};
          const extendedLegendItem = rule.find(style => style.extendedLegend);
          const label = labelItem.label || '';
          const elCmps = [];
          if (extendedLegendItem && thematicStyling) {
            elCmps.push(renderExtendedThematicLegendItem(extendedLegendItem, styleRules, layer, viewer, clickable));
            cmps = elCmps;
          } else if (extendedLegendItem && extendedLegendItem.icon) {
            elCmps.push(renderExtendedLegendItem(extendedLegendItem));
            cmps = elCmps;
          } else {
            if (thematicStyling && layerType !== 'WMS') {
              const toggleButton = Button({
                cls: `round small icon-smaller no-shrink${clickable ? '' : ' cursor-default'}`,
                click() {
                  if (clickable) {
                    const thisStyle = viewer.getStyles()[styleName];
                    const visible = thisStyle[index][0].visible !== false;
                    this.setIcon(!visible ? checkIcon : uncheckIcon);
                    thisStyle[index][0].visible = !visible;
                    layer.changed();
                  }
                },
                style: {
                  'align-self': 'center',
                  'padding-left': '0rem'
                },
                icon: viewer.getStyles()[styleName][index][0].visible === false ? uncheckIcon : checkIcon,
                ariaLabel: 'Växla synlighet',
                tabIndex: -1
              });
              elCmps.push(toggleButton);
            }
            const svgIcon = renderSvgIcon(rule, { opacity });
            elCmps.push(renderLegendItem(svgIcon, label, { styleName, index }));
            cmps.push(El({ components: elCmps, tagName: 'li', cls: 'flex row align-center padding-y-smallest' }));
          }
        }
      }
    });
    return El({ components: cmps, tagName: 'ul' });
  }
  return El({ innerHTML: noLegend });
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
