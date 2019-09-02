import download from 'downloadjs';
import { createToaster } from './infowindow';

export function simpleExportHandler(simpleExportUrl, activeLayer, selectedItems, exportedFileName) {
  simpleExportUrl = null;
  if (!simpleExportUrl) {
    createToaster('fail', 'Export URL is not specified.');
    return;
  }
  // console.log('simple Exporting layer ' + activeLayer.get('name'));

  /* if (activeLayer.get('type') === 'GROUP') {
      const subLayers = activeLayer.getLayers().getArray();
      const subLayersNames = subLayers.map(l => l.get('name'));
      console.log(subLayersNames);
  } */

  const features = {};
  exportedFileName =  exportedFileName + '.xlsx'
  selectedItems.forEach((item) => {
    const layerName = item.getLayer().get('name');
    if (!features[layerName]) {
      features[layerName] = [];
    }
    const obj = item.getFeature().getProperties();
    if (obj.geom) delete obj.geom;
    features[layerName].push(obj);
  });

  // eslint-disable-next-line consistent-return
  return fetch(simpleExportUrl, {
    method: 'POST', // or 'PUT'
    body: JSON.stringify(features), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then((response) => {
      if (response.status !== 200) {
        throw response.statusText;
        // return Promise.reject(response.statusText);
      }
      return response.blob();
    })
    .then((blob) => {
      download(blob, exportedFileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    })
    .catch((err) => {
      // console.log(err);
      throw err;
      // return Promise.reject(err);
    });
}

export function layerSpecificExportHandler(url, activeLayer, selectedItems, attributesToSendToExport, exportedFileName) {
  if (!url) {
    createToaster('fail', 'Export URL is not specified.');
    return;
  }

  exportedFileName =  exportedFileName + '.xlsx'
  // let replacedUrl;
  const features = {};
  selectedItems.forEach((item) => {
    const layerName = item.getLayer().get('name');
    if (!features[layerName]) {
      features[layerName] = [];
    }
    const properties = item.getFeature().getProperties();
    // replacedUrl = replacer.replace(url, properties);
    let obj = {};
    if (attributesToSendToExport) {
      attributesToSendToExport.forEach((att) => {
        if (att in properties) {
          obj[att] = properties[att];
        }
      });
    } else {
      obj = properties;
    }
    if (obj.geom) delete obj.geom;
    features[layerName].push(obj);
  });

  // eslint-disable-next-line consistent-return
  return fetch(url, {
    method: 'POST', // or 'PUT'
    body: JSON.stringify(features), // data can be `string` or {object}!
    headers: {
      'Content-Type': 'application/json'
    }
  })
    // eslint-disable-next-line consistent-return
    .then((response) => {
      const contentType = response.headers.get('content-type');
      switch (contentType) {
        case 'application/json':
          return response.json();

        // case 'application/vnd.ms-excel':

        //     if (response.status !== 200) {
        //         throw response.statusText;
        //         // return Promise.reject(response.statusText);
        //     }

        //     response.blob().then(blob => {
        //         download(blob, exportedFileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        //     });
        //     break;

        default:
          if (response.status !== 200) {
            throw response.statusText;
            // return Promise.reject(response.statusText);
          }

          response.blob().then((blob) => {
            download(blob, exportedFileName, contentType);
          });
          break;
      }
    })
    .catch((err) => {
      // console.log(err);
      throw err;
      // return Promise.reject(err);
    });
}
