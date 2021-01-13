import WFSFormat from 'ol/format/WFS';
import dispatcher from './editdispatcher';

const format = new WFSFormat();
const serializer = new XMLSerializer();

function readResponse(data) {
  let result;
  if (window.Document && data instanceof Document && data.documentElement && data.documentElement.localName === 'ExceptionReport') {
    alert(data.getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
  } else {
    result = format.readTransactionResponse(data);
  }

  return result;
}

function writeWfsTransaction(transObj, options) {
  if (transObj.insert) {
    transObj.insert.forEach((feature) => {
      const feat = feature.getProperties();
      Object.keys(feat).forEach(key => (feat[key] === '') && delete feat[key]);
    });
  }
  const node = format.writeTransaction(transObj.insert, transObj.update, transObj.delete, options);
  return node;
}

function wfsTransaction(transObj, layerName, viewer) {
  const srsName = viewer.getProjectionCode();
  const layer = viewer.getLayer(layerName);
  const featureType = layer.get('featureType');
  const source = viewer.getMapSource()[layer.get('sourceName')];
  const options = {
    gmlOptions: {
      srsName
    },
    featureNS: source.workspace,
    featurePrefix: source.prefix || source.workspace,
    featureType
  };
  const node = writeWfsTransaction(transObj, options);

  function error(e) {
    const errorMsg = e ? (`${e.status} ${e.statusText}`) : '';
    alert(`Det inträffade ett fel när ändringarna skulle sparas till servern...
      ${errorMsg}`);
  }

  function success(data) {
    const result = readResponse(data);
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

      if (result.transactionSummary.totalDeleted > 0) {
        dispatcher.emitChangeFeature({
          feature: transObj.delete,
          layerName,
          status: 'finished',
          action: 'delete'
        });
      }

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
      success(data);
      const result = readResponse(data);
      let nr = 0;
      if (result) {
        nr += result.transactionSummary.totalUpdated;
        nr += result.transactionSummary.totalDeleted;
        nr += result.transactionSummary.totalInserted;
      }
      return nr;
    })
    .catch(err => error(err));
}

export default function wfstransaction(transObj, layerName, viewer) {
  return wfsTransaction(transObj, layerName, viewer);
}
