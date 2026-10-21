// Distinct colors that stand out against both light background maps and aerial photos
export const mapPalette = [
  'rgb(228,26,28)',
  'rgb(55,126,184)',
  'rgb(77,175,74)',
  'rgb(152,78,163)',
  'rgb(255,127,0)',
  'rgb(166,86,40)',
  'rgb(247,129,191)',
  'rgb(0,139,139)',
  'rgb(204,163,0)',
  'rgb(31,31,122)'
];

// Returns the first color in the palette that isn't used, or cycles through the palette when all are used
export function getUnusedColor(usedColors = [], palette = mapPalette) {
  const unusedColor = palette.find(color => !usedColors.includes(color));
  return unusedColor || palette[usedColors.length % palette.length];
}

// Converts a rgb or rgba color string to a rgba color string with the given opacity
export function toRgba(color, opacity = 1) {
  const [r, g, b] = color.replace(/[^\d,.]/g, '').split(',');
  return `rgba(${r},${g},${b},${opacity})`;
}

// Converts a hex color string, as returned by a color input, to a rgb color string
export function hexToRgb(hex) {
  const [r, g, b] = hex.replace('#', '').match(/.{2}/g).map(c => parseInt(c, 16));
  return `rgb(${r},${g},${b})`;
}

// Converts a rgb or rgba color string to a hex color string, as used by a color input
export function rgbToHex(color) {
  const [r, g, b] = color.replace(/[^\d,.]/g, '').split(',');
  return `#${[r, g, b].map(c => Number(c).toString(16).padStart(2, '0')).join('')}`;
}
