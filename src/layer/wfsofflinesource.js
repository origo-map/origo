// We use underscore to denote private class methods. JS has no good support for that.
/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
import VectorOfflineSource from './vectorofflinesource';
import WfsSource from './wfssource';
import wfstransaction from '../controls/editor/wfstransaction';

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
   * Internal helper for preload.
   * @param {any} extent The extent to preload
   *
   */
  async _preload(extent) {
    // let myExtent = extent;
    // let extentId = 0;
    /// / Sparse layers can benefit from ignoring the download extent drawn by user and always download
    /// / entire extent. customExtent contains layer's extent if specified, otherwise map's extent if specified.
    /// / Requires that at least one of them are specified.
    /// / In that case there is no need to store the extent, it will just be confusing.
    // if (this.options.offlineUseLayerExtent) {
    //  myExtent = this.options.customExtent;
    // } else {
    //  // Store extent first to get an id to link each feature.
    //  // The linking has limited usage as a new overlapping extent will overwrite the feature and the connection to the old extent is lost
    //  extentId = await super.storeExtent(extent);
    // }
    // Create a temporary wfs source to avoid implementing the WFS protocol again.
    const wfsLoader = new WfsSource(this.options);
    const features = await wfsLoader.getFeaturesFromSource(extent);
    await super.addFeaturesForExtent(features, extent);
    // await super.storeFeatures(features, extentId);
  }

  /**
  * Overrides base class.
  * Preloads the given extent. Does not resolve until all features have been stored in indexddb.
  * Must not be called before layer init has resolved
  * As this is a user action it it pretty safe
  * to assume that init is finished before the user has clicked preload.
  * @param {any} extent The extent to preload
  *
  */
  async preload(extent, progressCallback) {
    await this._preload(extent);
    // Pretty useless with only one last progress. In order for it to work, we must also
    // provide a function that calculates how many callbacks there should be. Right now the Control
    // assumes vectors makes exactly one callback
    if (progressCallback) {
      progressCallback();
    }
    // Need to refresh to show new features
    // This actually triggers a read from indexdDb, which means all features are removed from the layer and re-read
    // from localdb. This will get new edits from server as saving to indexddb overwrites unlike OL that keeps the old in a source on refresh
    // Drawback is that we're missing deletes on server. That would require a complete reload which quickly becomes messy if we
    // have many extents or we need to do a full re-read of all extents. If only allowing one extent we could empty indexddb first.
    super.refresh();
  }

  /**
   * Overrides base class. Sychronizes all edits
   * @returns nothing. Throws on error
   */
  async syncEdits() {
    // performs a sync by posting edits first, then clear local edits and reload to get latest from db.
    // What happens on conflict?
    // insert: no actual conflict as per definition they are different objects but could represent the same real world object
    // edit: Latest wins (in this case we regardless of when the edit itself was made). If deleted in db, it is still deleted
    // delete: it is deleted

    // Read edits from db
    const transaction = await super.getLocalEdits();

    const postResult = await wfstransaction(transaction, this.options.name, this.viewer, true);
    // wfstransaction returns number of sucessfully features, which could be 0 if a deleted feature was already deleted
    // and that should count as sucessful. As javascript will interpret 0 as falsely we must check if no response at all
    // which implies a swallowed exception as wfstransaction does not throw.
    if (postResult !== undefined) {
      const extentsToFetch = await super.getExtentsToRefresh();
      await super.clearStorage();
      const extentPromises = extentsToFetch.map(async (currExtent) => this._preload(currExtent.extent));
      // If one or more extents fail entire call fail and state is undefined
      await Promise.all(extentPromises);
      super.refresh();
    } else {
      throw new Error('wfstransaction failed. No further information is available');
    }
  }
}
