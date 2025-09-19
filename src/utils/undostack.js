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

  pushEdit(layer, featureRef, op, before = null) {
    return this.pushEdits([{ layer, featureRef, before, op }]);
  }
  // TODO: must handle atomic operations (split, batchedit)
  // 
  pushEdits(edits) {
    // Clone and add to stack
    const editTransaction = edits.map(currEdit => {
      // TODO: remove creation of before. Only used by update and they has to make it by themselves
      // to support editStore rollback
      let before = currEdit.before;
      if (!before) {
        // The user can provide the before state. If not provided we assume that the feature actually is before.
        // This is to simplify for the caller so it only has to once before the edit is applied.
        // Problem is modify interaction for which the feature already has changed, so we are called with the "after"
        // state in the feature.
        // The after state is only needed when redo-ing, and it is calculated when undo-ing, so we don't care if
        // the feature hold before or after, but we could of course assume that feature is "after" if "before" is provided.
        before = currEdit.featureRef.clone();
      }
      // Use same id. Can not add to same source after this.
      before.setId(currEdit.featureRef.getId());
      return { layer: currEdit.layer, featureRef: currEdit.featureRef, before: before, op: currEdit.op };
    });
    

    // Clear redopossibilities
    this._currentIndex += 1;

    this._stack = this._stack.slice(0,this._currentIndex)

    this._stack.push(editTransaction);

    // TODO: Trim head of stack if max number of edits have been reached

    // TODO: Return true unless undo is disabled. Redo is by implication possible.
    return true;
  }
  /**
   * Undoes the last edit and returns an array of transactions that can be sent to editStore
   * @returns array of edits in the same format that editDispatcher.emitChangeFeature uses
   */
  undo() {
    // Apply previous edit and move pointer
    //const edits = this._applyEdit();
    //this._currentIndex -= 1;
    //// Return true if more undos are possible. Redo is by implication possible
    //// TODO: must return restored features so handler can create transactions.
    //return edits;

    const retval = [];
    // TODO: safeguard index
    this._stack[this._currentIndex].forEach(currEdit => {
      const currRetval = {};
      currRetval.feature = currEdit.featureRef;
      currRetval.layerName = currEdit.layer.get('name');

      if (currEdit.op == 'update') {
        currRetval.action = 'update';
        // Save how it looks after this modification. Is only needed when redoing. In theory it could be derived from next "before"
        // exept for the last edit in which case the caller would have to provide the after state anyway. So in order to simplify for the
        // caller who would have to provide both before and after, we calculate after only when it will be possible to redo.
        currEdit.after = currEdit.featureRef.clone();
        currEdit.after.setId(currEdit.featureRef.getId());
        // Restore all edits
        currEdit.featureRef.setProperties(currEdit.before.getProperties());
        // Geometry is included in properties, but it is a ref to an existing geometry instance
        // Do an implicit deep copy to get rid of dependencies
        currEdit.featureRef.setGeometry(currEdit.before.getGeometry().clone());
        // TODO: add feature to retval
        // Needed by editStore for a very special case when a modify is saved and the next session starts with udoing the last save
        currRetval.before = currEdit.after;
        
      } else if (currEdit.op == 'insert') {
        currRetval.action = 'delete';
        // Delete from source, keep reference in undostack for redo
        // TODO: As we are using feature refs, it will work even if insert has been saved and given a new id?
        currEdit.layer.getSource().removeFeature(currEdit.featureRef);
        // TODO: add feature to retval
      } else if (currEdit.op == 'delete') {
        // Create a new feature
        currRetval.action = 'insert';
        // Add to source, keep reference in undostack for redo
        // If Id exists, it will not be added
        currEdit.layer.getSource().addFeature(currEdit.featureRef);
        // TODO: add feature to retval
      }
      retval.push(currRetval);
    });
    this._currentIndex -= 1;
    return retval;
  }

  redo() {
    // TODO: safeguard index
    // TODO: consolidate with undo? Only update differs? No, there's more
    // Apply next edit
    this._currentIndex += 1;
    //const edits = this._applyEdit();
    
    // Return true if more redos are possible (). Undo is by implication possible.
    // TODO: must return restored features so handler can create transactions.
    //return edits;

    const retval = [];

    this._stack[this._currentIndex].forEach(currEdit => {
      const currRetval = {};
      currRetval.layerName = currEdit.layer.get('name');
      currRetval.feature = currEdit.featureRef;

      if (currEdit.op == 'update') {
        currRetval.action = 'update';
        // just restore all edits
        currEdit.featureRef.setProperties(currEdit.after.getProperties());
        currEdit.featureRef.setGeometry(currEdit.after.getGeometry().clone());
        currRetval.before = currEdit.before;
        // TODO: add feature to retval
      } else if (currEdit.op == 'insert') {
        currRetval.action = 'insert';
        // Delete from source, keep reference in undostack for redo
        // TODO: As we are using feature refs, it will work even if insert has been saved and given a new id?
        currEdit.layer.getSource().addFeature(currEdit.featureRef);
        // TODO: add feature to retval
      } else if (currEdit.op == 'delete') {
        // Create a new feature
        currRetval.action = 'delete';
        // Add to source, keep reference in undostack for redo
        // If Id exists, it will not be added
        currEdit.layer.getSource().removeFeature(currEdit.featureRef);
        // TODO: add feature to retval
      }
      retval.push(currRetval);
    });
    return retval;
  }

  _applyEdit() {
    /** All edits that has been applied */
    const retval = [];

    this._stack[this._currentIndex].forEach(currEdit => {
      const currRetval = {};
      currRetval.layerName = currEdit.layer.get('name');

      if (currEdit.op == 'update') {
        currRetval.action = 'update';
        // just restore all edits
        currEdit.featureRef.setGeometry(currEdit.before.getGeometry().clone());
        currEdit.featureRef.setProperties(currEdit.before.getProperties());
      } else if (currEdit.op == 'insert') {
        currRetval.action = 'delete';
        // Delete from source, keep reference in undostack for redo
        // TODO: As we are using feature refs, it will work even if insert has been saved and given a new id?
        currEdit.layer.getSource().removeFeature(currEdit.featureRef);
      } else if (currEdit.op == 'delete') {
        // Create a new feature
        currRetval.action = 'insert';
        // Add to source, keep reference in undostack for redo
        // If Id exists, it will not be added
        currEdit.layer.getSource().addFeature(currEdit.featureRef);
      }
      retval.push(currRetval);
    });
    return retval;
  }
  

}