const typeOfIcon = function typeOfIcon(src) {
  if (src.length) {
    if (src.startsWith('#')) {
      return 'sprite';
    } else if (src.startsWith('<svg')) {
      return 'svg';
    } else if (src.startsWith('<img')) {
      return 'img';
    }
    return 'image';
  }
  return '';
};

export default typeOfIcon;
