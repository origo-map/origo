var dispatcher = require('./editdispatcher');

module.exports = function(transObj, layerName) {
  dispatcher.emitChangeOfflineEdits(transObj, layerName);
}
