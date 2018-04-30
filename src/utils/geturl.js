export default function getUrl() {
  return location.protocol + '//' +
    location.hostname +
    (location.port ? ":" + location.port : "") +
    location.pathname;
}
