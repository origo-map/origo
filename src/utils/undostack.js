/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

/**
 * Class that implements a simple stack structure to keep track of undoable edits
 */
export default class UndoStack {
  _options = {};

  _stack = [];

  _currentIndex = -1;

  _maxLength;

  constructor(options = {}) {
    this._maxLength = options.maxLength;
  }

  /**
   * Gets the current stack depth. Good for greying out undo/redo buttons etc
   * @returns object with two properties: undoDepth and redoDepth.
   */
  getStackDepth() {
    const undoDepth = this._currentIndex + 1;
    const redoDepth = this._stack.length - this._currentIndex - 1;
    return {
      undoDepth,
      redoDepth
    };
  }

  /**
   * Adds one undoable edit operation to the stack
   * @param {any} layer Reference to the layer the feature is is
   * @param {any} featureRef Reference to the feature itself
   * @param {('update' | 'insert' | 'delete')} op Operation that has been performed
   * @param {any} before A clone of the feature how it looked before the operation. Only used for 'update'. If omitted the input feature is cloned assuming this function is called before the modification is applied to the feature.
   * @returns true if it was added
   */
  pushEdit(layer, featureRef, op, before = null) {
    return this.pushEdits([{ layer, featureRef, before, op }]);
  }

  /**
   * Adds an array of undoable edit operations as a transaction in order to be able to undo several operations in one transaction, e.g. batch edit or recusive delete
   * See pushEdit for format of object in array, it's the same as parameters.
   * @param {any} edits
   * @returns true if it was added
   */
  pushEdits(edits) {
    // Clone and add to stack
    const editTransaction = edits.map(currEdit => {
      let before = currEdit.before;
      if (!before) {
        // The user can provide the before state. If not provided we assume that the feature actually is before.
        // This is to simplify for the caller so it only has to call once before the edit is applied.
        // Problem is modify interaction for which the feature already has changed, so we are called with the "after"
        // state in the feature. Also the edit store needs the before state, so this is only u
        // The after state is only needed when redo-ing, and it is calculated when undo-ing, so we don't care if
        // the feature hold before or after, but we could of course assume that feature is "after" if "before" is provided.
        before = currEdit.featureRef.clone();
      }
      // Use same id. Can not add to same source after this.
      before.setId(currEdit.featureRef.getId());
      return { layer: currEdit.layer, featureRef: currEdit.featureRef, before, op: currEdit.op };
    });

    // Clear redopossibilities as we have now changed history
    this._currentIndex += 1;
    this._stack = this._stack.slice(0, this._currentIndex);

    this._stack.push(editTransaction);

    // Trim head of stack if max number of edits have been reached
    if (typeof this._maxLength === 'number' && this._currentIndex === this._maxLength) {
      this._currentIndex -= 1;
      this._stack.shift();
    }

    return true;
  }

  /**
   * Undoes the last edit and returns an array of transactions that can be sent to editStore
   * @returns array of edits in the same format that editDispatcher.emitChangeFeature uses
   */
  undo() {
    // Safeguard index
    if (this._currentIndex < 0) {
      return [];
    }

    const transactions = [];
    // Reverse order to support update and delete on same feature
    this._stack[this._currentIndex].toReversed().forEach(currEdit => {
      const currTransaction = {};
      currTransaction.feature = currEdit.featureRef;
      currTransaction.layerName = currEdit.layer.get('name');

      if (currEdit.op === 'update') {
        currTransaction.action = 'update';
        // Save how it looks after this modification. Is only needed when redoing. In theory it could be derived from next "before"
        // except for the last edit in which case the caller would have to provide the after state anyway. So in order to simplify for the
        // caller who would have to provide both before and after, we calculate after only when it will be possible to redo.
        // Alow reassign to add the after-property
        // eslint-disable-next-line no-param-reassign
        currEdit.after = currEdit.featureRef.clone();
        currEdit.after.setId(currEdit.featureRef.getId());
        // Restore all edits
        currEdit.featureRef.setProperties(currEdit.before.getProperties());
        // Geometry is included in properties, but it is a ref to an existing geometry instance
        // Do an implicit deep copy to get rid of dependencies
        currEdit.featureRef.setGeometry(currEdit.before.getGeometry().clone());
        // Needed by editStore for a very special case when a modify is saved and the next session starts with udoing the last save
        currTransaction.before = currEdit.after;
      } else if (currEdit.op === 'insert') {
        currTransaction.action = 'delete';
        // Delete from source, keep reference in undostack for redo
        // As we are using feature refs, it will work even if insert has been saved and given a new id
        currEdit.layer.getSource().removeFeature(currEdit.featureRef);
      } else if (currEdit.op === 'delete') {
        // Create a new feature
        currTransaction.action = 'insert';
        // Add to source, keep reference in undostack for redo
        // If Id exists, it will not be added
        currEdit.layer.getSource().addFeature(currEdit.featureRef);
      }
      transactions.push(currTransaction);
    });
    this._currentIndex -= 1;
    return transactions;
  }

  /**
   * Redoes the current undone edit and returns an array of transactions that can be sent to editStore
   * @returns array of edits in the same format that editDispatcher.emitChangeFeature uses
   */
  redo() {
    // Safeguard index
    if (this._currentIndex === (this._stack.length - 1)) {
      return [];
    }
    this._currentIndex += 1;

    const transactions = [];

    this._stack[this._currentIndex].forEach(currEdit => {
      const currTransaction = {};
      currTransaction.layerName = currEdit.layer.get('name');
      currTransaction.feature = currEdit.featureRef;

      if (currEdit.op === 'update') {
        currTransaction.action = 'update';
        // just restore all edits
        currEdit.featureRef.setProperties(currEdit.after.getProperties());
        currEdit.featureRef.setGeometry(currEdit.after.getGeometry().clone());
        currTransaction.before = currEdit.before;
      } else if (currEdit.op === 'insert') {
        // Insert vill reinstate the deleted feature, keeping ID as feature was kept in memory all the time
        // but if it ends up with the same id in db depends on if protocol and db allows id insert and if delete
        // was saved to db or not. If db and insert is in the same session everything is always correct as edits will cancel out and
        // no transaction is performed.
        currTransaction.action = 'insert';
        currEdit.layer.getSource().addFeature(currEdit.featureRef);
      } else if (currEdit.op === 'delete') {
        currTransaction.action = 'delete';
        currEdit.layer.getSource().removeFeature(currEdit.featureRef);
      }
      transactions.push(currTransaction);
    });
    return transactions;
  }
}
