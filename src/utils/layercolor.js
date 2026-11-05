import Style from '../style';
import { toRgba } from './colorpalette';

// Same defaults as the draw style window, used when a feature style lacks a property
const ownStyleDefaults = {
  fillColor: 'rgb(0,153,255)',
  fillOpacity: 0.75,
  strokeColor: 'rgb(0,153,255)',
  strokeOpacity: 1,
  strokeWidth: 2,
  pointSize: 10
};

const getBaseGeometryTypes = geometryTypes => geometryTypes.map(type => type.replace('Multi', ''));

export function getGeometryTypes(features) {
  const types = new Set();
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    if (geometry) types.add(geometry.getType());
  });
  return [...types];
}

// Creates a style rule for the given color with symbols only for the geometry types in the layer,
// so that the legend shows a matching icon
export function createColorStyle(color, geometryTypes = []) {
  const types = getBaseGeometryTypes(geometryTypes);
  const hasPoint = types.includes('Point');
  const hasLine = types.includes('LineString');
  const hasPolygon = types.includes('Polygon') || types.length === 0;
  const styleRule = {};
  if (hasPoint) {
    styleRule.circle = {
      radius: 6,
      fill: { color },
      stroke: { color: 'rgba(255,255,255,1)', width: 1.5 }
    };
  }
  if (hasLine || hasPolygon) {
    styleRule.stroke = { color, width: 2.5 };
  }
  if (hasPolygon) {
    styleRule.fill = { color: toRgba(color, 0.25) };
  }
  return [styleRule];
}

// Creates a legend style rule from a feature's own style, as set by the draw style window
function createOwnStyleRule(ownStyle, geometryType) {
  const style = Object.assign({}, ownStyleDefaults, ownStyle);
  const fill = { color: toRgba(style.fillColor, style.fillOpacity) };
  const stroke = { color: toRgba(style.strokeColor, style.strokeOpacity), width: style.strokeWidth };
  const [type] = getBaseGeometryTypes([geometryType]);
  if (type === 'Point') {
    return [{ circle: { radius: style.pointSize / 2, fill, stroke } }];
  } else if (type === 'LineString') {
    return [{ stroke }];
  }
  return [{ fill, stroke }];
}

const getOwnStyle = feature => feature.get('origostyle') || feature.get('style');

/**
 * Creates the style for a layer with a layer color. Features that have their own style (feature.getStyle()) are rendered with that,
 * but are added as extra rules after the color rule so that the legend shows all styles in the layer.
 * The color rule has no filter and is always first, so the extra rules are only used by the legend.
 */
export function createLayerStyle({ color, features, labels = {} }) {
  const styledFeatures = features.filter(feature => feature.getGeometry() && feature.getStyle());
  const unstyledFeatures = features.filter(feature => feature.getGeometry() && !feature.getStyle());
  const rules = [];
  if (color && unstyledFeatures.length) {
    rules.push(createColorStyle(color, getGeometryTypes(unstyledFeatures)));
  }
  const ownRules = new Map();
  styledFeatures.forEach((feature) => {
    const ownStyle = getOwnStyle(feature);
    if (ownStyle && typeof ownStyle === 'object') {
      const rule = createOwnStyleRule(ownStyle, feature.getGeometry().getType());
      ownRules.set(JSON.stringify(rule), rule);
    }
  });
  rules.push(...ownRules.values());
  // Labels are only needed when the legend lists more than one style
  if (rules.length > 1) {
    rules.forEach((rule, index) => {
      const label = index === 0 && color && unstyledFeatures.length ? labels.layerColor : labels.ownStyle;
      if (label) Object.assign(rule[0], { label });
    });
  }
  return rules;
}

// Adds or replaces the style for a layer and returns its name
export function addLayerStyle({ name, viewer, ...options }) {
  const styleName = `${name}_color`;
  const style = createLayerStyle(options);
  if (viewer.getStyle(styleName)) {
    viewer.setStyle(styleName, style);
  } else {
    viewer.addStyle(styleName, style);
  }
  return styleName;
}

// Changes the color of a layer created with a layer color, see draganddrop. Only the color rule, which is always first, is changed.
export function setLayerColor(layer, color, viewer) {
  const styleName = layer.get('styleName');
  const style = viewer.getStyle(styleName);
  const unstyledFeatures = layer.getSource().getFeatures().filter(feature => feature.getGeometry() && !feature.getStyle());
  const [colorRule] = createColorStyle(color, getGeometryTypes(unstyledFeatures));
  if (style[0][0].label) colorRule.label = style[0][0].label;
  style[0] = [colorRule];
  viewer.setStyle(styleName, style);
  layer.set('layerColor', color);
  layer.setStyle(Style.createStyle({ style: styleName, viewer }));
  layer.dispatchEvent('change:style');
}
