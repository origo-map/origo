/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import * as LoadingStrategy from 'ol/loadingstrategy';

/** Class that represents a  source. Extends VectorSource so everything is possible
  */
class RealtimeSource extends VectorSource {
  _alreadyNotifiedError = false;

  _sse = null;

  /**
     * Creates a new instance of RealtimeSource
     * @param {any} options The options to use.
     */
  constructor(options, viewer) {
    super({
      attributions: options.attribution,
      format: new GeoJSONFormat({
        geometryName: options.geometryName,
        // Defaults to 4326 for GeoJSON as per spec. But server may send in any CRS.
        // Some sources (PostGis) can send actual CRS GeoJson, but that is ignored.
        dataProjection: options.dataProjection || 'EPSG:4326',
        featureProjection: options.projectionCode
      }),
      strategy: LoadingStrategy.all
    });
    /** The options that this source was created with  */
    this._options = options;
    this._viewer = viewer;

    super.setLoader(this.onLoad);
  }

  /**
     * Handles update events from the server-sent events connection.
     * @param {*} event
     */
  onUpdateEvent(event) {
    // TOOD: Move around popup?
    // if error state, clear error state and show toast
    // this.clearErrorNotification();
    const data = JSON.parse(event.data);
    const feature = super.getFormat().readFeature(data);
    const existingFeature = this.getFeatureById(feature.getId());
    // No need to refresh, it happens automatically when features are added/updated
    if (existingFeature) {
      // Update existing feature. Geometry is included
      existingFeature.setProperties(feature.getProperties());
      // existingFeature.setGeometry(feature.getGeometry());
    } else {
      // New feature
      super.addFeature(feature);
    }
  }

  /**
   * Handles delete events from the server-sent events connection.
   * @param {*} event
   */
  onDeleteEvent(event) {
    // TOOD: Remove popup?
    // if error state, clear error state and show toast
    // this.clearErrorNotification();
    const fid = JSON.parse(event.data).id;
    const existingFeature = this.getFeatureById(fid);
    if (existingFeature) {
      super.removeFeature(existingFeature);
    }
  }

  showToast(msgId, status) {
    // Layers are init before controls are added so localization control is not accessible in constructor
    // but when error arises it will. This is not a race condition, it is the result of run to completion
    // as there is no other async stuff going on.
    const loc = this._viewer.getControlByName('localization');
    const message = `${loc.getStringByKeys({ targetParentKey: 'realtime', targetKey: msgId })} ${this._options.title}`;
    this._viewer.getLogger().createToast({ status, message });
  }

  /**
   * handles error events from the server-sent events connection.
   * @param {*} event
   */
  onSSEError(event) {
    // Too bad that we don't get any useful info from the event
    console.error('SSE error', event);
    // Errors can just keep coming, only notify once
    if (!this._alreadyNotifiedError) {
      this._alreadyNotifiedError = true;
      this.showToast('connectionError', 'danger');
    }
  }

  /**
   * Clears error notification state and shows restored toast if needed.
   */
  clearErrorNotification() {
    if (this._alreadyNotifiedError) {
      this.showToast('connectionRestored', 'success');
      this._alreadyNotifiedError = false;
    }
  }

  /**
   * Called by VectorSource. VectorSource always calls with extent specified. If strategy = 'all' it is an infinite extent.
   * @param {any} extent Ignored as we always use strategy 'all'
   * @param {any} resolution Ignored
   * @param {any} projection The map projection. Ignored as we already know that from options.
   * @param {any} success Callback to call on success
   * @param {any} failure Callbak to call on failure
   *
   */
  onLoad(extent, resolution, projection, success, failure) {
    this._loaderHelper()
      .then(f => {
        success(f);
      })
      .catch(() => failure());
  }

  /**
     * Helper to reuse code. Consider it to be private to this class.
     */
  async _loaderHelper() {
    // Connect to SSE and get init state and set up event listeners for updates.
    // Clear error state to give reconnect a chance to show error message
    // Automatic reconnects are handled by the browser EventSource implementation and does not call here
    this._alreadyNotifiedError = false;
    const url = new URL(this._options.url);
    url.searchParams.set('layer', this._options.featureType);
    // Unfortunately EventSource does not throw errors so we cannot catch connection errors
    // Best we can do is to listen for onerror events.
    // TODO: Make CORS configurable or let it follow global crossDomain-setting (which seems not to be used at all)
    this._sse = new EventSource(url, { withCredentials: true });
    // Inserts are treated as updates
    this._sse.addEventListener('update', this.onUpdateEvent.bind(this));
    this._sse.addEventListener('delete', this.onDeleteEvent.bind(this));
    this._sse.onerror = this.onSSEError.bind(this);
    this._sse.onopen = () => {
      // Connection established
      // Happens when a responsed of any kind is recived. If there is no initial state it will not be triggered
      // To make it trigger the server can send a comment on connect.
      this.clearErrorNotification();
    };
    // TODO: initial load from WFS? Right now it is up to the server to send the current state as a series of update events when the connection is opened.

    // Loader never actually loads any features. Everything is handled by SSE events.
    return [];
  }

  /**
   * Clears source and stops listening to updates when deactivated.
   * Restarts listening when activated.
   * Typically called when layer visibility changes.
   * @param {boolean} active True to activate, false to deactivate.
   */
  setActive(active) {
    if (active) {
      this._loaderHelper();
    } else {
      this._sse.close();
      this._sse = null;
      this.clear();
    }
  }
}

export default RealtimeSource;
