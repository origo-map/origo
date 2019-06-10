const getOWSExceptionText = (str) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(str, 'text/xml');
  const collection = xml.getElementsByTagName('ows:ExceptionText');
  return collection.length ? collection[0].innerHTML : 'No ExceptionText found!';
};

const serialize = (response) => {
  const str = new XMLSerializer().serializeToString(response);
  return getOWSExceptionText(str);
};

const getXHReq = (url) => {
  const req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.send();
  return req;
};

const handleError = (response) => {
  const request = getXHReq(response.url);
  request.onreadystatechange = function onReadystatechange() {
    if (request.readyState === 4 && request.status === 200) {
      const error = getOWSExceptionText(request.responseText);
      console.warn(error);
    }
  }
};

const checkJSON = (response, config) => {
  const data = response.json(config).catch((error) => {
    if (error.toString().includes('JSON')) {
      handleError(response);
    } else {
      console.warn(error);
    }
  });
  return data;
};

const checkResponse = (response, source) => {
  if (response instanceof Object) {
    if (response.features !== undefined) {
      if (response.features.length > 0) {
        source.addFeatures(source.getFormat().readFeatures(response));
      } else {
        console.warn('Source returned 0 features.');
      }
    } else {
      console.warn(serialize(response));
    }
  } else {
    console.warn('The request is not being sent to a server that is OGC:WFS compliant, see source configuration.');
  }
};

export default {
  checkJSON,
  checkResponse
};
