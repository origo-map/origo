import dispatcher from './editdispatcher';

export default function editsStore() {
  const edits = {};

  function createEditsObj() {
    return {
      update: [],
      insert: [],
      delete: []
    };
  }

  function isFinished(layerName) {
    let finished = true;
    if (Object.prototype.hasOwnProperty.call(edits, layerName)) {
      const editTypes = Object.getOwnPropertyNames(edits[layerName]);
      editTypes.forEach((editType) => {
        if (edits[layerName][editType].length) {
          finished = false;
          return finished;
        }

        return false;
      });
      if (finished) {
        delete edits[layerName];
        return finished;
      }

      return false;
    }

    return finished;
  }

  function hasFeature(type, feature, layerName) {
    if (Object.prototype.hasOwnProperty.call(edits, layerName)) {
      if (edits[layerName][type].indexOf(feature.getId()) > -1) {
        return true;
      }
    }
    return false;
  }

  function addFeature(type, feature, layerName) {
    if (Object.prototype.hasOwnProperty.call(edits, layerName) === false) {
      edits[layerName] = createEditsObj();
    }
    if (hasFeature(type, feature, layerName) === false) {
      edits[layerName][type].push(feature.getId());
    }
  }

  function removeFeature(type, feature, layerName) {
    let index = 0;
    if (Object.prototype.hasOwnProperty.call(edits, layerName)) {
      index = edits[layerName][type].indexOf(feature.getId());
      if (index > -1) {
        edits[layerName][type].splice(index, 1);
        isFinished(layerName);
        return true;
      }
    }
    return false;
  }

  function hasEdits() {
    if (Object.getOwnPropertyNames(edits).length) {
      return true;
    }
    return false;
  }

  function addEdit(e) {
    if (e.detail.action === 'insert') {
      addFeature('insert', e.detail.feature, e.detail.layerName);
    } else if (e.detail.action === 'update') {
      if (hasFeature('insert', e.detail.feature, e.detail.layerName) === false) {
        addFeature('update', e.detail.feature, e.detail.layerName);
      }
    } else if (e.detail.action === 'delete') {
      if (removeFeature('insert', e.detail.feature, e.detail.layerName) === false) {
        removeFeature('update', e.detail.feature, e.detail.layerName);
        addFeature('delete', e.detail.feature, e.detail.layerName);
      }
    }
    if (hasEdits() === true) {
      dispatcher.emitEditsChange(1);
    } else {
      dispatcher.emitEditsChange(0);
    }
  }

  function removeEdit(e) {
    if (e.detail.feature.length) {
      e.detail.feature.forEach(feature => removeFeature(e.detail.action, feature, e.detail.layerName));
    }
    if (hasEdits() === false) {
      dispatcher.emitEditsChange(0);
    }
  }

  function getEdits() {
    return edits;
  }

  function featureChange(e) {
    const { detail: { status } } = e;
    if (status === 'pending') {
      addEdit(e);
    } else if (status === 'finished') {
      removeEdit(e);
    }
  }

  document.addEventListener('changeFeature', featureChange);

  return {
    getEdits,
    hasFeature
  };
}
