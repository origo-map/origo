import $ from 'jquery';
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
    if (e.action === 'insert') {
      addFeature('insert', e.feature, e.layerName);
    } else if (e.action === 'update') {
      if (hasFeature('insert', e.feature, e.layerName) === false) {
        addFeature('update', e.feature, e.layerName);
      }
    } else if (e.action === 'delete') {
      if (removeFeature('insert', e.feature, e.layerName) === false) {
        removeFeature('update', e.feature, e.layerName);
        addFeature('delete', e.feature, e.layerName);
      }
    }
    if (hasEdits() === true) {
      dispatcher.emitEditsChange(1);
    } else {
      dispatcher.emitEditsChange(0);
    }
  }

  function removeEdit(e) {
    if (e.feature.length) {
      e.feature.forEach(feature => removeFeature(e.action, feature, e.layerName));
    }
    if (hasEdits() === false) {
      dispatcher.emitEditsChange(0);
    }
  }

  function getEdits() {
    return edits;
  }

  function featureChange(e) {
    if (e.status === 'pending') {
      addEdit(e);
    } else if (e.status === 'finished') {
      removeEdit(e);
    }
  }

  $(document).on('changeFeature', featureChange);

  return {
    getEdits,
    hasFeature
  };
}
