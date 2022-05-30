export default function isUrl(s) {
  const regexp = /^(?:[a-z]+:)?\/\//i;
  return regexp.test(s);
}
