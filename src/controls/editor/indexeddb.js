import dispatcher from './editdispatcher';

export default (transObj, layerName) => dispatcher.emitChangeOfflineEdits(transObj, layerName);
