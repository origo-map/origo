const getSource = (style) => {
  const image = style.image || style.custom.image;
  if (!image) return null;
  const src = image.src || null;
  if (!src) throw new Error('image style must have src');
  else return src;
};

// return the image source from an origo style
const imageSource = (styleRules) => {
  if (styleRules.length === 1) {
    const styleRule = styleRules[0];
    if (styleRule.length === 1) {
      return getSource(styleRule[0]);
    }
  }
  return false;
};

export default imageSource;
