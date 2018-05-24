export default function getUrl() {
  return [
    `${window.location.protocol}//`,
    `${window.location.hostname}`,
    (window.location.port ? `:${window.location.port}` : ''),
    `${window.location.pathname}`
  ].join('');
}
