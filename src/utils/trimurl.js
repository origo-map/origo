export default function trimUrl(url) {
  let trimmed;
  if (url.substring(url.lastIndexOf('/')).indexOf('.htm') !== -1) {
    trimmed = url.substring(0, url.lastIndexOf('/') + 1);
  } else if (url.substr(url.length - 1) !== '/') {
    trimmed = `${url}/`;
  } else {
    trimmed = url;
  }
  return trimmed;
}
