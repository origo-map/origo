function xmlToArray(xmlDoc) {
  const getCapabilitiesLayers = Array.prototype.map.call(xmlDoc.querySelectorAll('Layer > Name'), el => el.textContent);

  getCapabilitiesLayers.forEach((getCapabilitiesLayer, i) => {
    const data = getCapabilitiesLayer.split(':');
    getCapabilitiesLayers[i] = data.pop();
  });
  return getCapabilitiesLayers;
}

function responseParser(response) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response, 'text/xml');
  return xmlToArray(xmlDoc);
}

const getCapabilities = function getCapabilities(name, getCapabilitiesURL) {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function parseResponse() {
      if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
        resolve({
          name,
          capabilites: responseParser(xmlHttp.responseText)
        });
      }
    };
    xmlHttp.onerror = reject;
    xmlHttp.open('GET', getCapabilitiesURL);
    xmlHttp.setRequestHeader('Content-type', 'application/xml; charset=UTF-8');
    xmlHttp.send(null);
  });
};

export default getCapabilities;
