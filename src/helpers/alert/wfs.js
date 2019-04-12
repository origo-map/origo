export default function (response, source) {
  if (response instanceof Object) {
    if (response.features !== undefined) {
      if (response.features.length > 0) {
        source.addFeatures(source.getFormat().readFeatures(response));
      } else {
        alert('Source returned 0 features.');
      }
    } else {
      const str = new XMLSerializer().serializeToString(response);
      const parser = new DOMParser();
      const xml = parser.parseFromString(str, 'text/xml');
      const error = xml.getElementsByTagName('ows:ExceptionText')[0].innerHTML;
      alert(error);
    }
  } else {
    alert('The request is not being sent to a server that is OGC:WFS compliant, see source configuration.');
  }
}
