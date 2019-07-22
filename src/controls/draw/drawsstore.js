import $ from 'jquery';
import dispatcher from './drawdispatcher';

const editsStore = function featureStore() {
  const edits = {};

  function hasFeature(type, feature, layerName) {
    // This format cannot be used because Linter will complain!
    // if (edits.hasOwnProperty(layerName)) {
    if (Object.hasOwnProperty.call(edits, layerName)) {
      if (edits[layerName][type].indexOf(feature.getId()) > -1) {
        return true;
      }
    }
    return false;
  }

  function createEditsObj() {
    return {
      update: [],
      insert: [],
      delete: []
    };
  }

  function addFeature(type, feature, layerName) {
    if (Object.hasOwnProperty.call(edits, layerName) === false) {
      edits[layerName] = createEditsObj();
    }
    if (hasFeature(type, feature, layerName) === false) {
      edits[layerName][type].push(feature.getId());
    }
  }

  function isFinished(layerName) {
    let editTypes;
    let finished = true;

    if (Object.hasOwnProperty.call(edits, layerName)) {
      editTypes = Object.getOwnPropertyNames(edits[layerName]);
      editTypes.forEach((editType) => {
        if (edits[layerName][editType].length) {
          finished = false;
          return finished;
        }
        return undefined;
      });
      if (finished) {
        delete edits[layerName];
        return finished;
      }
      return undefined;
    }
    return finished;
  }

  function removeFeature(type, feature, layerName) {
    let index = 0;

    if (Object.hasOwnProperty.call(edits, layerName)) {
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
    }
  }

  function removeEdit(e) {
    if (e.feature.length) {
      e.feature.forEach((feature) => {
        removeFeature(e.action, feature, e.layerName);
      });
    }
    if (hasEdits() === false) {
      dispatcher.emitEditsChange(0);
    }
  }

  function featureChange(e) {
    if (e.status === 'pending') {
      addEdit(e);
    } else if (e.status === 'finished') {
      removeEdit(e);
    }
  }

  function getEdits() {
    return edits;
  }

  $(document).on('changeFeature', featureChange);

  return {
    getEdits,
    hasFeature
  };
};

export default editsStore;
