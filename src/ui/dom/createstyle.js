const toString = styleObj => Object.keys(styleObj).reduce((prev, key) => `${prev} ${key}: ${styleObj[key]};`, '');

const createStyle = function createStyle(styleSettings) {
  let style = '';
  if (typeof styleSettings === 'object' && styleSettings !== null) {
    style = toString(styleSettings);
  } else if (typeof styleSettings === 'string') {
    style = styleSettings;
  }
  return style;
};

export default createStyle;
