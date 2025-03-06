import VectorOfflineSource from './vectorofflinesource';
import WfsSource from './wfssource';

/**
 * WFS tile offline source class.
 * Handles preloading WFS features
 */
export default class WfsOfflineSource extends VectorOfflineSource {
  /**
   * Creates a new instance of WfsOfflineSource. Remember to call Init afterwards to set up async stuff.
   * @param {any} options The options to use.
   */
  constructor(options, viewer) {
    // Most stuff is happening in the base class.
    super(options, viewer);
    this.options = options;
  }

  /**
   * Overrides base class.
   * Preloads the given extent. Does not resolve until all features have been stored in indexddb.
   * Must not be called before layer init has resolved
   * // TODO: Add a wait for init here? Or force a new init? As this is a user action it it pretty safe
   * to assume that init is finished before the user has clicked preload.
   * // TODO: What happens is preload is called and there are unsynced edits?
   * @param {any} extent
   *
   */
  async preload(extent, progressCallback) {
    if (this.options.offlineIgnoreExtent) {
      // TODO: ignore extent and use customExtent if present or or map extent

      // TODO: don't store the extent in db it won't be useful for anything
    }
    // Store extent first to get an id to link each feature.
    // Usage is limited as a new extent will overwrite the feature and the connection to the old extent is lost
    const extentId = await super.storeExtent(extent);
    const wfsLoader = new WfsSource(this.options);
    // TODO: which CRS is this? Map probably.
    const features = await wfsLoader.getFeaturesFromSource(extent);
    await super.storeFeatures(features, extentId);

    if (progressCallback) {
      progressCallback();
    }

    // Need to refresh to show new features
    // This actually triggers a read from indexdDb.
    // TODO: short circuit and add to layer directly as well?
    super.refresh();
  }

  async syncEdits() {
    // TODO: read edits from db

    // TODO: create wfs transaction, possibly by reusing wfstransaction. In that case it must be modified to not emit events and set ids
    // inserted features. That must be done here or wfstransaction must call us again with a setIds call.

    // TODO: What happens on conflict?
    // insert: no actual conflict, may result in duplicate features with different ids
    // edit: Latest wins (in this case we). If deleted in db probably error
    // delete: may throw error (that's bad) if already deleted in db

    // TODO: should we fetch from server first?
    // insert: no actual conflict, may result in duplicate features with different ids
    // edit: THEY win or possibility to select. Requires some pretty advanced GUI stuff
    // delete: If we say delete and they say nothing or edit, we delete. If they say delete but we don't we must delete.
    // This requires access to apifunctions on editcontrol as we don't have access to editstore

    // TODO: handle wfs transaction response. Best to clear and reload to get latest from db.
    // 1. empty features and edits
    // 2. refresh known extents or entire extent if layer/map extent is used. Too bad we don't know how to do that, that's in WFSOFFLINESOURCE!!!
  }
}
