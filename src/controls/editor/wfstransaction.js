import WFSFormat from 'ol/format/wfs';
import $ from 'jquery';
import viewer from '../../viewer';
import dispatcher from './editdispatcher';

const format = new WFSFormat();
const serializer = new XMLSerializer();

function readResponse(data) {
  let result;
  if (window.Document && data instanceof Document && data.documentElement &&
    data.documentElement.localName === 'ExceptionReport') {
    alert(data.getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionText').item(0).textContent);
  } else {
    result = format.readTransactionResponse(data);
  }

  return result;
}

function writeWfsTransaction(transObj, options) {
  const node = format.writeTransaction(transObj.insert, transObj.update, transObj.delete, options);
  return node;
}

function wfsTransaction(transObj, layerName) {
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

  return $.ajax({
    type: 'POST',
    url: source.url,
    data: serializer.serializeToString(node),
    contentType: 'text/xml',
    success,
    error,
    context: this
  })
    .then((data) => {
      const result = readResponse(data);
      let nr = 0;
      if (result) {
        nr += result.transactionSummary.totalUpdated;
        nr += result.transactionSummary.totalDeleted;
        nr += result.transactionSummary.totalInserted;
      }
      return nr;
    });
}

export default function (transObj, layerName) {
  return wfsTransaction(transObj, layerName);
}
