import download from 'downloadjs';

export function simpleExportHandler(simpleExportUrl, activeLayer, selectedItems, exportedFileName) {
  if (!simpleExportUrl) {
    // Here we cannot simply throw, because it won't be catched. We need to rejecet it as the calling function expects a promise.
    return Promise.reject(new Error('Export URL is not specified.'));
  }

  const features = {};
  selectedItems.forEach((item) => {
    const layerName = item.getLayer().get('name');

    if (!features[layerName]) {
      features[layerName] = [];
    }
    const obj = item.getFeature().getProperties();
    const geometryName = item.getFeature().getGeometryName() || 'geom';

    if (obj[geometryName]) delete obj[geometryName];

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
        // Note: Throwing here has practically the same effect as returning a Promise.reject() and both will be catched down here in the catch function;
        throw response.statusText;
      }
      return response.blob();
    })
    .then((blob) => {
      download(blob, exportedFileName);
    })
    .catch((err) => {
      // Throwing here cause the whole fetch function be rejected, the same effect as returning Promise.reject();
      throw err;
    });
}

export function layerSpecificExportHandler(url, activeLayer, selectedItems, attributesToSendToExport, exportedFileName) {
  if (!url) {
    throw new Error('Export URL is not specified.');
  }

  const features = {};
  selectedItems.forEach((item) => {
    const layerName = item.getLayer().get('name');
    if (!features[layerName]) {
      features[layerName] = [];
    }
    const properties = item.getFeature().getProperties();
    const geometryName = item.getFeature().getGeometryName() || 'geom';

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
    if (obj[geometryName]) delete obj[geometryName];
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

        default:
          if (response.status !== 200) {
            throw response.statusText;
          }

          response.blob().then((blob) => {
            download(blob, exportedFileName, contentType);
          });
          break;
      }
    })
    .catch((err) => {
      throw err;
    });
}
