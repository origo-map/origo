var colors = {
  'red': [255,0,0],
  'yellow': [255,255,0],
  'green': [0,255,0],
  'cyan': [0,255,255],
  'blue': [0,0,255],
  'magenta': [255,0,255],
  'default': [255,255,255]
};

module.exports = function getColor(color) {
  if (color in colors) {
    return colors[color];
  } else {
    return colors.default;
  }
};
