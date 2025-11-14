import WFSFormat from 'ol/format/WFS';
import dispatcher from './editdispatcher';

const format = new WFSFormat();
const serializer = new XMLSerializer();

function readResponse(data) {
  let result;
  if (window.Document && data instanceof Document && data.documentElement && data.documentElement.localName === 'ExceptionReport') {
    // TODO: replace with logger
    alert(data.getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
  } else {
    // TODO: this may very well throw if response is anything else than OK or WFS ExceptionReport (e.g. 404, 500 or whatever)
    result = format.readTransactionResponse(data);
  }

  return result;
}

function writeWfsTransaction(transObj, options) {
  // Delete attributes that are empty strings. Don't know why, but probably to be able to utilize db defaults
  // as editor always set empty string when form is empty or possibly if empty string can not be cast
  // to the data type. Too bad the editor does not re-read features to get db default values.
  if (transObj.insert) {
    transObj.insert.forEach((feature) => {
      const props = feature.getProperties();
      Object.keys(props).forEach(prop => (props[prop] === '') && feature.unset(prop));
    });
  }
  const node = format.writeTransaction(transObj.insert, transObj.update, transObj.delete, options);
  return node;
}

function wfsTransaction(transObj, layerName, viewer, supressEvents) {
  const srsName = viewer.getProjectionCode();
  const layer = viewer.getLayer(layerName);
  const featureType = layer.get('featureType');
  const source = viewer.getMapSource()[layer.get('sourceName')];
  const options = {
    gmlOptions: {
      srsName
    },
    featureNS: source.workspace,
    featurePrefix: source.prefix,
    featureType
  };
  const node = writeWfsTransaction(transObj, options);

  function error(e) {
    const errorMsg = e ? (`${e.status} ${e.statusText}`) : '';
    // TODO: replace with logger
    alert(`Det inträffade ett fel när ändringarna skulle sparas till servern...
      ${errorMsg}`);
  }

  function success(result) {
    let feature;
    if (result) {
      if (result.transactionSummary.totalUpdated > 0) {
        dispatcher.emitChangeFeature({
          feature: transObj.update,
          layerName,
          status: 'finished',
          action: 'update'
        });
      }
      // FIXME: If the feature(s) already have been deleted on the server this will result in the edit
      // being stuck forever in the editstore as the server will respond with 0 features deleted.
      if (result.transactionSummary.totalDeleted > 0) {
        dispatcher.emitChangeFeature({
          feature: transObj.delete,
          layerName,
          status: 'finished',
          action: 'delete'
        });
      }
      // FIXME: If the feature(s) already have been deleted on the server this will result in the edit
      // being stuck forever in the editstore as the server will respond with 0 features updated.
      if (result.transactionSummary.totalInserted > 0) {
        feature = transObj.insert;

        dispatcher.emitChangeFeature({
          feature: transObj.insert,
          layerName,
          status: 'finished',
          action: 'insert'
        });
        const insertIds = result.insertIds;
        insertIds.forEach((insertId, index) => feature[index].setId(insertId));
      }
    } else {
      error();
    }
  }

  const header = new Headers();
  header.append('Content-Type', 'text/plain');
  return fetch(source.url, {
    method: 'POST',
    body: serializer.serializeToString(node),
    headers: header,
    redirect: 'follow'
  })
    .then(res => res.text())
    .then(str => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then((data) => {
      const result = readResponse(data);
      if (result && !supressEvents) {
        success(result);
      }
      let nr = 0;
      if (result) {
        nr += result.transactionSummary.totalUpdated;
        nr += result.transactionSummary.totalDeleted;
        nr += result.transactionSummary.totalInserted;
      }
      return nr;
    })
    // This catches (and swallows) errors from parsing response if response is not in fact a wfs response. ErrorReports are handled and
    // results in a 0 items update.
    .catch(err => error(err));
}

export default function wfstransaction(transObj, layerName, viewer, supressEvents) {
  return wfsTransaction(transObj, layerName, viewer, supressEvents);
}
