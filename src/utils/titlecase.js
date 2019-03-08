const titleCase = (str) => {
  if (str.length) {
    const lowercase = str.toLowerCase();
    return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
  }
  return '';
};

export default titleCase;
