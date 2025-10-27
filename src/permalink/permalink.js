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
      switch (key) {
        case 'layers':
          urlAsObj.layers = permalinkParser.layers(val);
          break;
        case 'zoom':
          urlAsObj.zoom = permalinkParser.zoom(val);
          break;
        case 'center':
          urlAsObj.center = permalinkParser.center(val);
          break;
        case 'selection':
          urlAsObj.selection = permalinkParser.selection(val);
          break;
        case 'feature':
          urlAsObj.feature = permalinkParser.feature(val);
          break;
        case 'pin':
          urlAsObj.pin = permalinkParser.pin(val);
          break;
        case 'map':
          urlAsObj.map = permalinkParser.map(val);
          break;
        case 'controls':
          urlAsObj.controls = permalinkParser.controls(val);
          break;
        case 'controlDraw':
          urlAsObj.controlDraw = permalinkParser.controlDraw(val);
          break;
        case 'legend':
          urlAsObj.legend = permalinkParser.legend(val);
          break;
        case 'controlMeasure':
          urlAsObj.controlMeasure = permalinkParser.controlMeasure(val);
          break;
        default:
          break;
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
