import dispatcher from './editdispatcher';
/**
 * Implements a store for keeping track of unsaved edits (pedning edits). When using autosave, it is still used but each edit is saved immediately.
 * The actual saving is performed by editHandler that reads all pending edits and the store is cleared by transactionHandler when save is successful.
 * Pending edits are added by events and also reoving pending edits as a result of successful saving.
 * A feature can only be present in the store as one type (update, inster or delete). The store calculates which kind it is based on
 * history. Example: a feature is created att added as "insert" but later it is changed and added again as "update" (as the called is stupid)
 * but editsStore only keeps it as "instert" as when it is saved to server the curremt state of the feature will be used, thus making the "update" redundant.
 * In case of undo, if an edit is undone back to the original unsaved state, it is removed from the store to avoid no-op saves.
 * @returns {function} A factory function returning the one edit store class like object.
 */
export default function editsStore() {
  /** Holds all pending edits for this session. An object with layerName as properties with the internal structure for each layer as value */
  const edits = {};
  /** Map key: fid, value: feature as it looked before first edit. Not stored with edits to not mess with logic that enumerates properties */
  const befores = new Map();
  //TODO: add map of deleted objects for rollback. Don't forget to clear in on successful save and abort

  /**
   * Creates the internal structure for one layer
   * @returns {object} the internal strucure for pending edits
   */
  function createEditsObj() {
    return {
      update: [],
      insert: [],
      delete: [],
    };
  }

  /**
   * Helper that checks if the provided layer has no pending edits. If there are no pending edits
   * the internal structure for that layer is removed.
   * @param {any} layerName
   * @returns
   */
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
        befores.delete(layerName);
        return finished;
      }

      return false;
    }

    return finished;
  }

  /**
   * Checks if the provided feature has a pending edit of the specified type
   * @param {any} type
   * @param {any} feature
   * @param {any} layerName
   * @returns
   */
  function hasFeature(type, feature, layerName) {
    if (Object.prototype.hasOwnProperty.call(edits, layerName)) {
      if (edits[layerName][type].indexOf(feature.getId()) > -1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds one feature to the specified type store. If the layer has no pending edits, the internal structure is created
   * Only to be called from addEdit() as that contains delicate logic for when to actually add to the store and which type
   * @param {string} type Kind of edit (insert, delete or update)
   * @param {any} feature
   * @param {string} layerName
   * @param {any} before The original feature before the first change. Only used for "update"
   */
  function addFeature(type, feature, layerName, before) {
    if (Object.prototype.hasOwnProperty.call(edits, layerName) === false) {
      edits[layerName] = createEditsObj();
    }
    if (hasFeature(type, feature, layerName) === false) {
      edits[layerName][type].push(feature.getId());
      // For update, store "before" state for the first update. We use it to see if an undo has restored the feature back to its
      // original state to avoid no-op saves
      if (before) {
        let beforeLayer = befores.get(layerName);
        if (!beforeLayer) {
          beforeLayer = new Map();
          befores.set(layerName, beforeLayer);
        }
        if (!beforeLayer.get(feature.getId())) {
          beforeLayer.set(feature.getId(), before);
        }
      }
    }
  }

  /**
   * Removes a pedning edit from the store. Either because it has been saved or become
   * obsolete due to other pending edits (e.g replacing an update with a delete). When the last pending edit for a layer is removed
   * the internal structure for that layer is removed
   * @param {any} type
   * @param {any} feature
   * @param {any} layerName
   * @returns {boolean} true if the feature was removed. False if not found.
   */
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
  /**
   * Checks if there are any pendning edits.
   * @returns
   */
  function hasEdits() {
    // Just checks the object for exitence of layers. isFinished() does the actual clean up when the last edit for
    // a layer is removed
    if (Object.getOwnPropertyNames(edits).length) {
      return true;
    }
    return false;
  }

  /**
   * Adds one edit to the pending store. If the feature already exists in the store it determines what
   * state should be kept, e.g. if an update comes after insert in the same session only the insert is kept.
   * Each feature can only have one state which corresponds to a transaction type ('insert', 'update' or 'delete')
   * and this function keeps track of which it currently is. Undo/redo really complicates this
   * @param {any} e
   */
  function addEdit(e) {
    if (e.detail.action === 'insert') {
      // Must check if it has been deleted already to handle undo/redo in the same session
      // Insert after delete can only mean undo as id would otherwise differ and thus be a different object
      if (hasFeature('delete', e.detail.feature, e.detail.layerName) === false) {
        addFeature('insert', e.detail.feature, e.detail.layerName);
        // TODO: clear before-delete-state here?
      } else {
        // Remove the delete as a delete and insert on the same feature makes no sense to the server, and most likely will
        // make the user unhappy
        // Check if we have had an erased update that must be recreated
        // Add to store before removing delete to avoid unnecessary clean up in isFinished()
        if (befores.get(e.detail.layerName) && befores.get(e.detail.layerName).get(e.detail.feature.getId())) {
          // No need to actually use the stored feature
          addFeature('update', e.detail.feature, e.detail.layerName);
        }

        removeFeature('delete', e.detail.feature, e.detail.layerName);
      }
    } else if (e.detail.action === 'update') {
      // Check if update results in "before" state, in which case it's an undo that won't require saving.
      if (hasFeature('insert', e.detail.feature, e.detail.layerName) === false) {
        if (hasFeature('update', e.detail.feature, e.detail.layerName) === false) {
          // TODO: maybe add to update Map here instead of in addFeature. We "know" here that Map must be empty.
          addFeature('update', e.detail.feature, e.detail.layerName, e.detail.before);
        } else {
          // Compare the feature with its original state
          // Assume that properties are in same order and that geometry is exact. Would
          // most likely be enough as this is most likely happening when undoing and that uses an exact copy of the feature.
          const before = befores.get(e.detail.layerName).get(e.detail.feature.getId());
          const beforeProps = before.getProperties();
          delete beforeProps[before.getGeometryName()];
          const currProps = e.detail.feature.getProperties();
          delete currProps[e.detail.feature.getGeometryName()];
          if ((JSON.stringify(currProps) === JSON.stringify(beforeProps)) && (JSON.stringify(before.getGeometry().getCoordinates()) === JSON.stringify(e.detail.feature.getGeometry().getCoordinates()))) {
            // Dude is tring to restore to exactly the same state that was before the first edit. Remove it from store as an edit would result in a no-op
            befores.get(e.detail.layerName).delete(e.detail.feature.getId());
            removeFeature('update', e.detail.feature, e.detail.layerName);
          }
        }
      }
    } else if (e.detail.action === 'delete') {
      if (hasFeature('insert', e.detail.feature, e.detail.layerName) === false) {
        // TODO: store feature before delete to be able to abort session. Not needed for undo as undo keeps its own state
        // but undo is not aware of any edit sessions so we can't get it from there. Remember to clear structure if delete is undone
        addFeature('delete', e.detail.feature, e.detail.layerName);
      }
      removeFeature('insert', e.detail.feature, e.detail.layerName);
      // Don't clear before-state for this feature, it may me needed if undoing the delete to convert pending edit to undo.
      removeFeature('update', e.detail.feature, e.detail.layerName);
      
    }
    if (hasEdits() === true) {
      dispatcher.emitEditsChange(1);
    } else {
      dispatcher.emitEditsChange(0);
    }
  }

  /**
   * Helper for eventhanler that removes an array of pendning edits after they have been saved to server
   * @param {any} e
   */
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

  /**
   * Event handler for adding pending edits and also removing pendning edits when transaction handler has saved them to server. 
   * 
   * @param {any} e
   */
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
    // TODO: Add method for getting pending edits with features state before session started. getEdits does not contain features, only ids.
    // TODO: Add method to clear all state. Possibly possible to implement using normal event.
  };
}
