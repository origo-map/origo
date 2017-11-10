var colors = {
  'black': [0,0,0],
  'red': [255,59,48],
  'yellow': [255,204,0],
  'green': [0,255,0],
  'cyan': [0,255,255],
  'blue': [0,122,255],
  'magenta': [255,0,255],
  'default': [255,255,255]
};

module.exports = function getColor(colorName, alpha) {
  var color;
  if (colorName in colors) {
    color = colors[colorName];
  } else {
    color = colors.default;
  }
  if (alpha) {
    return color.concat(alpha);
  }
  return color;
};
