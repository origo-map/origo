import Feature from 'ol/Feature';
import viewer from '../../viewer';
import layerCreator from '../../layercreator';
import downloadSources from './downloadsources';
import dispatcher from './offlinedispatcher';
import OfflineLayer from './offlinelayer';
import OfflineStore from './offlinestore';

const offlineLayer = OfflineLayer();
const offlineStore = OfflineStore();

const downloadErrorMsg = 'Det inträffade ett fel när lagret skulle hämtas. Är du ansluten till internet?';
const saveErrorMsg = 'Det inträffade ett fel när förändringarna skulle sparas. Försök igen senare.';
const invalidFormatMsg = 'Invalid format: ';

const downloadHandler = function downloadHandler() {
  function abort(layerName, error, isAlert) {
    let action;
    if (offlineStore.getOfflineLayer(layerName).downloaded) {
      action = 'offline';
    } else {
      action = 'download';
    }

    if (isAlert) {
      alert(error);
    } else {
      console.error(error);
    }

    dispatcher.emitChangeOfflineEnd(layerName, action);
  }

  function download(layerName) {
    const layer = viewer.getLayer(layerName);
    const type = layer.get('onlineType');
    dispatcher.emitChangeOfflineStart(layerName);
    if (Object.prototype.hasOwnProperty.call(downloadSources, type)) {
      downloadSources[type].default.request(layer)
        .then((result) => {
          offlineLayer.setOfflineSource(layerName, result);
          dispatcher.emitChangeOffline(layer.get('name'), 'download');
        })
        .fail(() => {
          abort(layerName, downloadErrorMsg, 'alert');
        });
    } else {
      abort(layerName, invalidFormatMsg + type);
    }
  }

  function removeDownloaded(layerName) {
    const layer = viewer.getLayer(layerName);
    const props = layer.getProperties();
    dispatcher.emitChangeOfflineStart(layerName);
    props.style = props.styleName;
    props.source = props.sourceName;
    props.type = props.onlineType;
    const source = layerCreator(props).getSource();
    layer.setSource(source);
    dispatcher.emitChangeOffline(layer.get('name'), 'remove');
  }

  function saveToRemote(editItems, layerName) {
    const layer = viewer.getLayer(layerName);
    const transObj = {
      delete: [],
      insert: [],
      update: []
    };
    const ids = [];
    editItems.forEach((item) => {
      const id = Object.getOwnPropertyNames(item)[0];
      const feature = layer.getSource().getFeatureById(id);
      if (feature) {
        transObj[item[id]].push(feature);
        ids.push(id);
      } else if (item[id] === 'delete') {
        const dummy = new Feature();
        dummy.setId(id);
        transObj[item[id]].push(dummy);
        ids.push(id);
      }
    });

    return downloadSources[layer.get('onlineType')].transaction(transObj, layerName)
      .then((result) => {
        if (result > 0) {
          dispatcher.emitChangeOffline(layer.get('name'), 'edits', ids);
        }
      });
  }
  function sync(layerName) {
    const offlineEdits = offlineStore.getOfflineEdits(layerName);
    dispatcher.emitChangeOfflineStart(layerName);
    if (offlineEdits) {
      offlineEdits
        .then((editItems) => {
          saveToRemote(editItems, layerName)
            .then(() => {
              download(layerName);
            })
            .fail(() => {
              abort(layerName, saveErrorMsg, 'alert');
            });
        });
    } else {
      download(layerName);
    }
  }

  function onChangeDownload(e) {
    e.stopImmediatePropagation();
    const { detail: { action, layerName }} = e;
    if (action === 'download') {
      download(e.layerName);
    } else if (action === 'sync') {
      sync(e.layerName);
    } else if (action === 'remove') {
      removeDownloaded(layerName);
    }
  }

  document.addEventListener('changeDownload', onChangeDownload);
  offlineStore.init();
};

export default downloadHandler;
