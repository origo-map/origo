import VectorOfflineSource from './vectorofflinesource';
import WfsSource from './wfssource';
import wfstransaction from '../controls/editor/wfstransaction'

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
  async preload(extent, progressCallback, opts = {}) {
    let myExtent = extent;
    let extentId = 0;
    // Sparse layers can benefit from ignoring the download extent drawn by user and always download
    // entire extent. customExtent contains layer's extent if specified, otherwise map's extent if specified.
    // Requires that at least one of them are specified.
    // In that case there is no need to store the extent, it will just be confusing.
    if (this.options.offlineUseLayerExtent) {
      myExtent = this.options.customExtent;
    } else {
      // Store extent first to get an id to link each feature.
      // The linking has limited usage as a new overlapping extent will overwrite the feature and the connection to the old extent is lost
      extentId = await super.storeExtent(extent);
    }
    // Create a temporary wfs source to avoid implementing the WFS protocol again.
    const wfsLoader = new WfsSource(this.options);
    // TODO: which CRS is this? Map probably.
    const features = await wfsLoader.getFeaturesFromSource(myExtent);
    await super.storeFeatures(features, extentId);

    // TODO: pretty useless with one last progress. In order for it to work, we must also
    // provide a function that calculates how many callbacks there should be.
    if (progressCallback) {
      progressCallback();
    }

    // Need to refresh to show new features
    // This actually triggers a read from indexdDb, which means all features are removed from the layer and re-read
    // from localdb. This will get new edits from server as saving to indexddb overwrites unlike OL that keeps the old in a source
    // Drawback is that we're missing deletes on server. That would require a complete reload which quickly becomes messy if we
    // have many extents or we need to do a full re-read of all extents. If only allowing one extent we could empty indexddb first.
    if (!opts.supressRefresh) {
      super.refresh();
    }
  }

  async syncEdits() {
    // Read edits from db
    const transaction = await super.readEdits();
    // What happens on conflict?
    // insert: no actual conflict as per definition they are different objects but could represent the same real world object
    // edit: Latest wins (in this case we). If deleted in db response is 0 updates
    // delete: may throw error (that's bad) if already deleted in db
    const postResult = await wfstransaction(transaction, this.options.name, this.viewer, true);
    // wfstransaction returns number of sucessfully features, which could be 0 if a deleted feature was already deleted
    // and that should count as sucessful. As javascript will interpret 0 as falsely we must check if no reposne at all
    // which implies a swallowed exception as wfstransaction does not throw.
    if (postResult != undefined) {
      // Handle wfs transaction response. Best to clear and reload to get latest from db.
      // 1. empty features and edits
      // 2. refresh known extents or entire extent if layer/map extent is used. Not neccessary, we could leave it empty.
      //    Drawback with leaving it empty is that it requires a new pull and as it is not done per layer it would mean that all layers
      //    have to be fetched just to get one layer.
      // Reload all previous extents
      const extentsToFetch = [];
      if (!this.options.offlineUseLayerExtent) {
        const extents = await super.getExtents();
        extents.forEach(currExtent => {
          extentsToFetch.push(currExtent.getGeometry().getExtent());
        });
      } else {
        extentsToFetch.push(this.options.customExtent);
      }
      await super.clearStorage();
      const extentPromises = extentsToFetch.map(async (currExtent) => {
        // This wastes rid:s in extent table as old extents are deleted and added again.
        // It would be possible to reuse extents, but that requires a clean only feature and edits tables function and
        // possibility to read existing extentid to reconnect. Still extentid has a limited usage as on now.
        return this.preload(currExtent, null, {supressRefresh: true});
      });
      // TODO: allSettled or handle exception?
      await Promise.all(extentPromises);
      super.refresh();

    }
    return 0;

   

    

    // TODO: should we fetch from server first?
    // insert: no actual conflict, may result in duplicate features with different ids
    // edit: THEY win or possibility to select. Requires some pretty advanced GUI stuff
    // delete: If we say delete and they say nothing or edit, we delete. If they say delete but we can choose
    //         between to delete och resurrect using insert and new id.
    // This requires access to apifunctions on editcontrol as we don't have access to editstore

    
  }
}
