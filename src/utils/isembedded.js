export default function isEmbedded(target) {
  const mapElement = document.getElementById(target.substr(1));
  if (window.top !== window.self || document.body.offsetHeight > mapElement.offsetHeight || document.body.offsetWidth > mapElement.offsetWidth) {
    return true;
  }
  return false;
}
