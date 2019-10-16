let panel;
let btn;

const setPanel = function setPanel(p) {
  panel = p;
};

const getPanel = () => panel;

const setBtn = function setBtn(b) {
  btn = b;
};

const getBtn = () => btn;

const updatePrompt = function updatePrompt(type, message) {
  btn.showBtn();
  btn.addAlert(type);
  panel.messageVisibility(type);
  panel.updateItem(type, message);
};

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
      try {
        const error = getOWSExceptionText(request.responseText);
        updatePrompt('error', error);
      } catch (error) {
        throw new Error('Failed to get OWSException: ', error);
      }
    }
  }
};

const checkJSON = (response, config) => {
  const data = response.json(config).catch((error) => {
    if (error.toString().includes('JSON')) {
      handleError(response);
    } else {
      updatePrompt('error', error);
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
        updatePrompt('warning', 'Source returned 0 features.');
      }
    } else {
      updatePrompt('warning', serialize(response));
    }
  } else {
    updatePrompt('warning', 'Check your source configuration.');
  }
};

export default {
  checkJSON,
  checkResponse,
  getPanel,
  getBtn,
  setBtn,
  setPanel
};
