import permalinkParser from './permalinkparser';
import permalinkStore from './permalinkstore';
import urlparser from '../utils/urlparser';

let saveOnServerServiceEndPoint = '';

export default (() => ({
  getSaveLayers: function getSaveLayers(layers) {
    return urlparser.formatUrl({ layers: permalinkStore.getSaveLayers(layers) });
  },
  getHash: function getHash(viewer) {
    return (urlparser.formatUrl(permalinkStore.getState(viewer)));
  },
  getPermalink: function getPermalink(viewer, options) {
    let url = '';
    if (options && options.mapStateId) {
      url = `${permalinkStore.getUrl(viewer)}?mapStateId=${options.mapStateId}`;
    } else {
      const hash = this.getHash(viewer);
      url = `${permalinkStore.getUrl(viewer)}#${hash}`;
    }
    return (url);
  },
  parsePermalink: function parsePermalink(url) {
    let urlSearch;
    if (url.indexOf('#') > -1) {
      urlSearch = url.split('#')[1];
    } else {
      urlSearch = url;
    }
    const urlParts = urlSearch.split('&');
    const urlAsObj = {};
    urlParts.forEach((part) => {
      const key = part.split('=')[0];
      const val = part.split('=')[1];
      if (Object.prototype.hasOwnProperty.call(permalinkParser, key)) {
        if (typeof permalinkParser[key] === 'function') {
          urlAsObj[key] = permalinkParser[key](val);
        }
      }
    });
    return urlAsObj || false;
  },
  setSaveOnServerServiceEndpoint: function setSaveOnServerServiceEndPoint(url) {
    saveOnServerServiceEndPoint = url;
  },
  saveStateToServer: function saveStateToServer(viewer) {
    return fetch(saveOnServerServiceEndPoint, {
      method: 'POST',
      body: JSON.stringify(permalinkStore.getState(viewer, true)),
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }).then(response => response.json());
  },
  readStateFromServer: function readStateFromServer(mapStateId) {
    if (!mapStateId) {
      const throwMessage = 'No mapStateId';
      throw throwMessage;
    }
    if (!saveOnServerServiceEndPoint || saveOnServerServiceEndPoint === '') {
      const throwMessage = 'No saveOnServerServiceEndPoint defined';
      throw throwMessage;
    } else {
      return fetch(`${saveOnServerServiceEndPoint}/${mapStateId}`).then(response => response.json())
        .then((data) => {
          const mapObj = {};
          Object.keys(data).forEach(key => {
            if (permalinkParser[key]) mapObj[key] = permalinkParser[key](data[key]);
            else mapObj[key] = data[key];
          });
          return mapObj;
        });
    }
  },
  addParamsToGetMapState: function addParamsToGetMapState(key, callback) {
    permalinkStore.AddExternalParams(key, callback);
  }
}))();
