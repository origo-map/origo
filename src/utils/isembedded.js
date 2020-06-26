export default function isEmbedded(target) {
  const mapElement = document.getElementById(target.substr(1));
  if (window.top !== window.self || document.body.scrollHeight > mapElement.scrollHeight || document.body.offsetHeight > mapElement.offsetHeight || document.body.scrollWidth > mapElement.scrollWidth || document.body.offsetWidth > mapElement.offsetWidth) {
    return true;
  }
  return false;
}
