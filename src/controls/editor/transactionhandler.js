import wfsTransaction from './wfstransaction';
import agsTransaction from './agstransaction';
import VectorOfflineSource from '../../layer/vectorofflinesource';

const transactions = {
  WFS: wfsTransaction,
  AGS_FEATURE: agsTransaction
};
export default function transactionhandler(transaction, layerName, viewer) {
  const layer = viewer.getLayer(layerName);
  // Offline layers handle their own transactions in the layer source
  if (layer.getSource() instanceof VectorOfflineSource) {
    return layer.getSource().persistEdits(transaction);
  }
  const type = viewer.getLayer(layerName).get('type');
  if (Object.prototype.hasOwnProperty.call(transactions, type)) {
    return transactions[type](transaction, layerName, viewer);
  }
  return false;
}
