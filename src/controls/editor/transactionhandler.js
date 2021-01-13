import wfsTransaction from './wfstransaction';
import agsTransaction from './agstransaction';
import indexedDb from './indexeddb';

const transactions = {
  WFS: wfsTransaction,
  AGS_FEATURE: agsTransaction,
  OFFLINE: indexedDb
};
export default function transactionhandler(transaction, layerName, viewer) {
  const type = viewer.getLayer(layerName).get('type');
  if (Object.prototype.hasOwnProperty.call(transactions, type)) {
    transactions[type](transaction, layerName, viewer);
  }
}
