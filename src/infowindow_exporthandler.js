import download from 'downloadjs';
import getSpinner from './utils/spinner';
import exportToFile from './utils/exporttofile';
import Icon from './ui/icon';

const defaultIcon = '#fa-download';
const defaultText = 'Ladda ner';
let viewerId;

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

/**
 * Makes a HEAD request to find out what the content type of the response will be, so that the
 * response can be handled accordingly. Non-images will be blocked by CORS restrictions unless
 * the server/API is set to allow the client's origin.
 * @param {string} url The url to fetch
 * @returns {Promise<string>} HTML content containing the response
 */
async function fetchByContentTypes(url) {
  try {
    // Perform the HEAD request to check response content type
    const headResponse = await fetch(url, { method: 'HEAD' });
    if (!headResponse.ok) {
      throw new Error(`HEAD request failed with status: ${headResponse.status}`);
    }
    // Get the content-type header
    const contentType = headResponse.headers.get('Content-Type');

    // Generate content to display based on Content-Type
    if (contentType.startsWith('image/')) {
      return `<img class="pointer" src="${url}"></img>`;
    } else if (contentType.startsWith('text/plain') || contentType.startsWith('application/json')) {
      const getResponse = await fetch(url, { method: 'GET' });
      if (!getResponse.ok) {
        throw new Error(`GET request failed with status: ${getResponse.status}`);
      }
      const responseText = await getResponse.text();
      if (contentType.startsWith('text/plain')) {
        return `<span>${responseText}</span>`;
      } else if (contentType.startsWith('application/json')) {
        return `<pre><code>${responseText}</code></pre>`;
      }
    }
    return '<span>Unsupported response Content-Type</span>';
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function layerSpecificExportHandler(url, requestMethod, urlParameters, activeLayer, selectedItems, attributesToSendToExport, exportedFileName) {
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

  // Generates the request URL using the urlParameters config option.
  // Keys and values are translated to url parameters as is, except when a value is an object with
  // an "attribute" property, in which case the value will be a list of the values from the
  // corresponding attribute of the selectedItems. Unless specified with a "separator" property,
  // the list will be separated by semicolons.
  // Specifying a value as null will add a valueless parameter, e g "?Param1&Param2&etc".
  let requestUrl = url;
  const requestParams = urlParameters ? { ...urlParameters } : undefined;
  if (requestParams) {
    const uniquePlaceholder = '8c155776-cbd7-4b24-a384-87c694a39ff2';
    Object.keys(requestParams).forEach((param) => {
      if (requestParams[param] && typeof requestParams[param] === 'object' && requestParams[param].attribute) {
        const attributeValues = [];
        selectedItems.forEach((item) => {
          const attributeValue = item.getFeature().get(requestParams[param].attribute);
          if (attributeValue) {
            attributeValues.push(attributeValue);
          }
        });
        requestParams[param] = attributeValues.join(requestParams[param].separator || ';');
      } else if (requestParams[param] === null) {
        requestParams[param] = uniquePlaceholder;
      }
    });
    requestUrl = new URL(url);
    requestUrl.search = new URLSearchParams([...new URLSearchParams(requestUrl.search), ...new URLSearchParams(requestParams)]);
    requestUrl = requestUrl.toString().replace(new RegExp(`=${uniquePlaceholder}(&|$)`, 'gm'), '$1');
  }

  if (requestMethod === 'OPEN') {
    return window.open(requestUrl, '_blank') ? Promise.resolve() : Promise.reject();
  } else if (requestMethod === 'GET') {
    return fetchByContentTypes(requestUrl);
  }
  // eslint-disable-next-line consistent-return
  return fetch(requestUrl, {
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

export function listExportHandler(exportUrl, exportObject, exportedFileName) {
  if (!exportUrl) {
    // Here we cannot simply throw, because it won't be catched. We need to rejecet it as the calling function expects a promise.
    return Promise.reject(new Error('Export URL is not specified.'));
  }
  // eslint-disable-next-line consistent-return
  return fetch(exportUrl, {
    method: 'POST', // or 'PUT'
    body: JSON.stringify(exportObject), // data can be `string` or {object}!
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

function createExportButton(buttonText) {
  const container = document.createElement('div');

  const spinner = getSpinner();
  spinner.style.visibility = 'hidden';

  const button = document.createElement('button');
  button.classList.add('export-button');
  button.textContent = buttonText;

  container.appendChild(button);
  container.appendChild(spinner);

  button.loadStart = () => {
    button.disabled = true;
    button.classList.add('disabled');
    spinner.style.visibility = 'visible';
  };

  button.loadStop = () => {
    button.disabled = false;
    button.classList.remove('disabled');
    spinner.style.visibility = 'hidden';
  };

  return container;
}

function createCustomExportButton(roundButtonIcon, roundButtonTooltipText) {
  const container = document.createElement('div');
  container.classList.add('inline-block', 'padding-smallest');
  const iconComponent = Icon({
    icon: roundButtonIcon,
    title: ''
  });
  const button = document.createElement('button');
  button.classList.add(
    'padding-small',
    'margin-bottom-smaller',
    'icon-smaller',
    'round',
    'light',
    'box-shadow',
    'o-tooltip',
    'margin-right-small'
  );
  button.style = 'position: relative';

  button.innerHTML = `<span class="icon" style="z-index: 10000">${iconComponent.render()}</span><span data-tooltip="${roundButtonTooltipText}" data-placement="east" style="transition:unset"></span>`;

  container.appendChild(button);
  const spinner = getSpinner();
  spinner.classList.add('spinner-large');

  button.loadStart = () => {
    button.disabled = true;
    button.classList.add('disabled');
    button.replaceWith(spinner);
  };

  button.loadStop = () => {
    button.disabled = false;
    button.classList.remove('disabled');
    spinner.replaceWith(button);
  };

  return container;
}

function createToaster(status, exportOptions, message) {
  let msg = message;
  const toaster = document.createElement('div');
  toaster.style.fontSize = '12px';
  if (!message) {
    const successMsg = exportOptions.toasterMessages && exportOptions.toasterMessages.success ? exportOptions.toasterMessages.success : 'Success!';
    const failMsg = exportOptions.toasterMessages && exportOptions.toasterMessages.fail ? exportOptions.toasterMessages.fail : 'Sorry, something went wrong. Please contact your administrator';
    msg = status === 'ok' ? successMsg : failMsg;
  }
  // It cannot be appended to infowindow bcuz in mobile tranform:translate is used css, and it causes that position: fixed loses its effect.
  const parentElement = document.getElementById(viewerId);
  parentElement.appendChild(toaster);
  setTimeout(() => {
    // message must be added here inside timeout otherwise it will be shown 50 ms before it take the effect of the css
    toaster.textContent = msg;
    toaster.classList.add('toaster');
    if (status === 'ok') {
      toaster.classList.add('toaster-successful');
    } else {
      toaster.classList.add('toaster-unsuccessful');
    }
  }, 50);

  setTimeout(() => {
    toaster.parentNode.removeChild(toaster);
  }, 5000);
}

function createExportButtons(
  obj,
  buttonPerLayer,
  requestMethodPerLayer,
  urlParametersPerLayer,
  attributesToSendToExportPerLayer,
  exportedFileNamePerLayer,
  displayExportResponsePerLayer,
  selectionGroup,
  activeLayer,
  selectionManager,
  exportOptions,
  responseHandler
) {
  const url = obj.url;
  const buttonText = obj.button?.buttonText || buttonPerLayer?.buttonText || defaultText;
  const roundButton = obj.button?.roundButton ?? buttonPerLayer?.roundButton ?? false;
  const roundButtonIcon = obj.button?.roundButtonIcon || buttonPerLayer?.roundButtonIcon || defaultIcon;
  const roundButtonTooltipText = obj.button?.roundButtonTooltipText || buttonPerLayer?.roundButtonTooltipText || defaultText;
  const requestMethod = obj.requestMethod || requestMethodPerLayer || 'POST_JSON';
  const urlParameters = obj.urlParameters || urlParametersPerLayer;
  const attributesToSendToExport = obj.attributesToSendToExport || attributesToSendToExportPerLayer;
  const exportedFileName = obj.exportedFileName || exportedFileNamePerLayer;
  const displayExportResponse = obj.displayExportResponse || displayExportResponsePerLayer || false;

  const exportBtn = roundButton
    ? createCustomExportButton(
      roundButtonIcon,
      roundButtonTooltipText
    )
    : createExportButton(buttonText);
  const btn = exportBtn.querySelector('button');
  btn.addEventListener('click', () => {
    if (!url) {
      createToaster('fail', exportOptions);
      return;
    }
    btn.loadStart();
    const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
    layerSpecificExportHandler(
      url,
      requestMethod,
      urlParameters,
      activeLayer,
      selectedItems,
      attributesToSendToExport,
      exportedFileName
    )
      .then((data) => {
        if (data) {
          switch (data.status) {
            case 'ok':
              createToaster('ok', exportOptions);
              break;
            case 'fail':
              createToaster('fail', exportOptions);
              break;
            default:
              break;
          }
          if (requestMethod === 'GET' && displayExportResponse) {
            responseHandler(selectionGroup, data);
          }
        }
        btn.loadStop();
      })
      .catch((err) => {
        console.error(err);
        createToaster('fail', exportOptions);
        btn.loadStop();
      });
  });
  return exportBtn;
}

export function createSubexportComponent({ selectionGroup, viewer, exportOptions, responseHandler }) {
  viewerId = viewer.getId();
  const selectionManager = viewer.getSelectionManager();
  // OBS! selectionGroup corresponds to a layer with the same name in most cases, but in case of a group layer it can contain selected items from all the layers in that GroupLayer.
  let layerSpecificExportOptions;
  const activeLayer = viewer.getLayer(selectionGroup);

  const subexportContainer = document.createElement('div');
  subexportContainer.classList.add('export-buttons-container');

  if (exportOptions.layerSpecificExport) {
    layerSpecificExportOptions = exportOptions.layerSpecificExport.find(
      (i) => i.layer === selectionGroup
    );
  }
  if (layerSpecificExportOptions) {
    const exportUrls = layerSpecificExportOptions.exportUrls || [];
    const buttonPerLayer = layerSpecificExportOptions.button;
    const requestMethodPerLayer = layerSpecificExportOptions.requestMethod;
    const urlParametersPerLayer = layerSpecificExportOptions.urlParameters;
    const attributesToSendToExportPerLayer = layerSpecificExportOptions.attributesToSendToExport;
    const exportedFileNamePerLayer = layerSpecificExportOptions.exportedFileName;
    const displayExportResponsePerLayer = layerSpecificExportOptions.displayExportResponse;

    exportUrls.sort((exportUrl) => (exportUrl.button.roundButton ? -1 : 1))
      .forEach((obj) => {
        const button = createExportButtons(
          obj,
          buttonPerLayer,
          requestMethodPerLayer,
          urlParametersPerLayer,
          attributesToSendToExportPerLayer,
          exportedFileNamePerLayer,
          displayExportResponsePerLayer,
          selectionGroup,
          activeLayer,
          selectionManager,
          exportOptions,
          responseHandler
        );
        subexportContainer.appendChild(button);
      });
  }
  if (exportOptions.simpleExport && exportOptions.simpleExport.url) {
    const simpleExport = exportOptions.simpleExport;
    const simpleExportLayers = Array.isArray(simpleExport.layers) ? simpleExport.layers : [];
    const exportAllowed = simpleExportLayers.length === 0 || simpleExportLayers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const simpleExportUrl = simpleExport.url || false;
      const buttonText = simpleExport.button.buttonText || defaultText;
      const exportedFileName = `${selectionGroup}.xlsx`;
      const roundButton = simpleExport.button.roundButton || false;
      const exportBtn = roundButton
        ? createCustomExportButton(
          simpleExport.button.roundButtonIcon || defaultIcon,
          simpleExport.button.roundButtonTooltipText || defaultText
        )
        : createExportButton(buttonText);
      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        btn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        simpleExportHandler(
          simpleExportUrl,
          activeLayer,
          selectedItems,
          exportedFileName
        )
          .then(() => {
            btn.loadStop();
          })
          .catch((err) => {
            console.error(err);
            createToaster('fail', exportOptions);
            btn.loadStop();
          });
      });
      subexportContainer.appendChild(exportBtn);
    }
  }
  if (exportOptions.clientExport) {
    const clientExport = exportOptions.clientExport;
    const clientExportLayers = Array.isArray(clientExport.layers) ? clientExport.layers : [];
    const exportAllowed = clientExportLayers.length === 0 || clientExportLayers.find((l) => l === selectionGroup);
    if (exportAllowed) {
      const roundButton = clientExport.button.roundButton || false;
      const buttonText = clientExport.button.buttonText || defaultText;
      const exportBtn = roundButton
        ? createCustomExportButton(
          clientExport.button.roundButtonIcon || defaultIcon,
          clientExport.button.roundButtonTooltipText || defaultText
        )
        : createExportButton(buttonText);

      const btn = exportBtn.querySelector('button');
      btn.addEventListener('click', () => {
        btn.loadStart();
        const selectedItems = selectionManager.getSelectedItemsForASelectionGroup(selectionGroup);
        const features = selectedItems.map(i => i.getFeature());
        exportToFile(features, clientExport.format, {
          featureProjection: viewer.getProjection().getCode(),
          filename: selectionGroup
        });
        btn.loadStop();
      });
      subexportContainer.appendChild(exportBtn);
    }
  }

  return subexportContainer;
}
