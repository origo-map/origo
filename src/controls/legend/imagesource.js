const getSource = (style) => {
  if ('image' in style) {
    if (style.image.src) {
      return style.image.src;
    }
    throw new Error('image style must have src');
  }
  return null;
};

// return the image source from an origo style
const imageSource = (styleRules) => {
  if (styleRules.length === 1) {
    const styleRule = styleRules[0];
    if (styleRule.length === 1 ) {
      return getSource(styleRule[0]);
    }
  }
};

export default imageSource; 