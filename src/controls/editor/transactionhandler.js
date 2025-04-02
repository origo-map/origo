import wfsTransaction from './wfstransaction';
import agsTransaction from './agstransaction';
import indexedDb from './indexeddb';
import VectorOfflineSource from '../../layer/vectorofflinesource';

const transactions = {
  WFS: wfsTransaction,
  AGS_FEATURE: agsTransaction,
  // TODO: Remove it's the old offline impl.
  OFFLINE: indexedDb
};
export default function transactionhandler(transaction, layerName, viewer) {
  const layer = viewer.getLayer(layerName);
  // Some layers don't have source, but all editable will
  if (layer.getSource() instanceof VectorOfflineSource) {
    return layer.getSource().persistEdits(transaction);
  }
  const type = viewer.getLayer(layerName).get('type');
  if (Object.prototype.hasOwnProperty.call(transactions, type)) {
    return transactions[type](transaction, layerName, viewer);
  }
  return false;
}
