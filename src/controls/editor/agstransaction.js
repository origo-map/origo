import EsriJSON from 'ol/format/EsriJSON';
import dispatcher from './editdispatcher';

const format = new EsriJSON();
const urlSuffix = {
  update: 'updateFeatures',
  insert: 'addFeatures',
  delete: 'deleteFeatures'
};

function error(e) {
  const errorMsg = e ? `Det inträffade ett fel när ändringarna skulle sparas till servern...<br><br> ${e.status} ${e.statusText}` : '';
  alert(errorMsg);
}

function throwServerError(e) {
  const errorMsg = `${e.description} (${e.code})`;
  alert(errorMsg);
}

function writeAgsTransaction(features, options) {
  const data = {};

  if (options.type === 'delete') {
    const objectIds = features.map(feature => feature.getId());
    data.objectIds = objectIds.join(',');
  } else {
    const agsFeatures = features.map(feature => format.writeFeature(feature, {
      featureProjection: options.projection
    }));
    data.features = `[${agsFeatures}]`;
  }
  data.f = 'json';
  return data;
}

function agsTransaction(transObj, layerName, viewer) {
  const projection = viewer.getProjection();
  const layer = viewer.getLayer(layerName);
  const id = layer.get('id');
  const source = viewer.getMapSource()[layer.get('sourceName')];
  const types = Object.getOwnPropertyNames(transObj);

  function updateSuccess(data) {
    const feature = transObj.update;
    const result = typeof data !== 'object' ? JSON.parse(data) : data;
    if (result) {
      if (result.updateResults.length > 0) {
        result.updateResults.forEach((update, index) => {
          if (update.success !== true) {
            throwServerError(update.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName,
              status: 'finished',
              action: 'update'
            });
          }
        });
      }
    } else {
      error();
    }
  }

  function insertSuccess(data) {
    const feature = transObj.insert;
    const result = typeof data !== 'object' ? JSON.parse(data) : data;
    if (result) {
      if (result.addResults.length > 0) {
        result.addResults.forEach((insert, index) => {
          if (insert.success !== true) {
            throwServerError(insert.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName,
              status: 'finished',
              action: 'insert'
            });
            feature[index].set('objectId', insert.objectId);
            feature[index].setId(insert.objectId);
          }
        });
      }
    } else {
      error();
    }
  }

  function deleteSuccess(data) {
    const feature = transObj.delete;
    const result = typeof data !== 'object' ? JSON.parse(data) : data;
    if (result) {
      if (result.deleteResults.length > 0) {
        result.deleteResults.forEach((deleted, index) => {
          if (deleted.success !== true) {
            throwServerError(deleted.error);
          } else {
            dispatcher.emitChangeFeature({
              feature: [feature[index]],
              layerName,
              status: 'finished',
              action: 'delete'
            });
          }
        });
      }
    } else {
      error();
    }
  }

  function getFormData(object) {
    const formData = new FormData();
    Object.keys(object).forEach(key => formData.append(key, object[key]));
    return formData;
  }

  const cb = {
    update: updateSuccess,
    insert: insertSuccess,
    delete: deleteSuccess
  };
  types.forEach((type) => {
    if (transObj[type]) {
      const url = `${source.url}/${id}/${urlSuffix[type]}`;

      const data = writeAgsTransaction(transObj[type], {
        projection,
        type
      });
      fetch(url, {
        method: 'POST',
        body: getFormData(data)
      })
        .then(res => res.json())
        .then(json => cb[type](json))
        .catch(err => error(err));
    }
  });
}

export default function agstransaction(transObj, layerName, viewer) {
  agsTransaction(transObj, layerName, viewer);
}
