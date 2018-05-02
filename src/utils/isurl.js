export default function isUrl(s) {
  const regexp = new RegExp('^(?:[a-z]+:)?//', 'i');
  return regexp.test(s);
}
