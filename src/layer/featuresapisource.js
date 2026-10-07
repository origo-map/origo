/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import * as LoadingStrategy from 'ol/loadingstrategy';

const RETRY_DELAY = 250;
/** Class that represents a OGC Features API source. Supports real time updates
 * according to the OCG Features pub/sub workflow (partial support)
  */
class FeaturesApiSource extends VectorSource {
  _alreadyNotifiedError = false;

  /** The websocket for streaming data */
  _ws = null;

  _wsUrl = null;

  _wsTimeout = RETRY_DELAY;

  /** Timer handle to keep track if we already have a reconnect in waiting */
  _reconnectTimer;

  /** Keeps track of if a full reconnect should be performed even when realtimeConnect is 'stream'
   * Happens when WS closes with code 1008 to indicate that the stream is no longer available
   * Most likely happens on reconnect to stream and the server uses sessions and the session is lost
   */
  _forceFullReconnect = false;

  /**
     * Creates a new instance of FeaturesApiSource
     * @param {any} options The options to use.
     * @param {any} viewer The one and only viewer.
     */
  constructor(options, viewer) {
    super({
      attributions: options.attribution,
      // Save a common formatter to not have to set coordsys every time
      format: new GeoJSONFormat({
        // Defaults to 4326 for GeoJSON as per spec, set in layer. But server may send in any CRS.
        // Some sources can send actual CRS in GeoJson, but that is ignored.
        dataProjection: options.dataProjection,
        featureProjection: options.projectionCode
      }),
      // If we have real time support, bbox will mess things up
      strategy: LoadingStrategy.all
    });
    /** The options that this source was created with  */
    this._options = options;
    this._viewer = viewer;

    super.setLoader(this.onLoad);
  }

  /**
     * Handles replace and create events from the ws connection.
     * Inserts a new feature. If fid alreday exits it is overwritten
     * @param {*} geoJsonfeature Feature to insert
     */
  onUpdateEvent(geoJsonfeature) {
    const feature = super.getFormat().readFeature(geoJsonfeature);
    const existingFeature = this.getFeatureById(feature.getId());
    // No need to refresh, it happens automatically when features are added/updated
    if (existingFeature) {
      // Update existing feature. Geometry is included
      existingFeature.setProperties(feature.getProperties());
    } else {
      // New feature
      super.addFeature(feature);
    }
  }

  /**
   * Handles delete events from the ws connection.
   * @param {*} fid
   */
  onDeleteEvent(fid) {
    const existingFeature = this.getFeatureById(fid);
    if (existingFeature) {
      super.removeFeature(existingFeature);
    }
  }

  /**
   * Helper to pop up a toast with a localized message
   * @param {*} msgId ID of localiztion message
   * @param {*} status Severity according to Logger
   */
  showToast(msgId, status) {
    // Layers are init before controls are added so localization control is not accessible in constructor
    // but when error arises it will. This is not a race condition, it is the result of run to completion
    // as there is no other async stuff going on.
    const loc = this._viewer.getControlByName('localization');
    const message = `${loc.getStringByKeys({ targetParentKey: 'realtime', targetKey: msgId })} ${this._options.title}`;
    this._viewer.getLogger().createToast({ status, message });
  }

  /**
   * handles error events from the websocket connection.
   */
  onWsError() {
    // Errors can just keep coming due to reconnect, only notify once
    if (!this._alreadyNotifiedError) {
      this._alreadyNotifiedError = true;
      this.showToast('connectionError', 'danger');
    }
    // Websockets does not have a built in reconnect. Reconnecting means creating a new connection
    // Guard against setting up several reconnect attempts as we may receive both 'error' and 'close'
    // or just one of them
    if (!this._reconnectTimer && this._options.realtimeReconnect !== 'none') {
      this._reconnectTimer = setTimeout(() => {
        this._reconnectTimer = null;
        this.reconnect();
      }, this._wsTimeout);
      // Simple exponential backoff with limit
      if (this._wsTimeout < 30000) {
        this._wsTimeout *= 2;
      }
    }
  }

  /**
   * Clears error notification state and shows restored toast if needed.
   */
  clearErrorNotification() {
    this._wsTimeout = RETRY_DELAY;
    this._forceFullReconnect = false;
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
        super.addFeatures(f);
        success(f);
      })
      .catch(() => failure());
  }

  /**
   * Helper to connect to websocket
   * @param {*} addr websocket address
   */
  _connectToWs(addr) {
    // Note that you can't set custom headers on WS connect, but cookies and auth will be sent
    // automatically, so a server that hosts both feature api and WS can set a session cookie
    // which will be sent and can be used in the updgrade request in the server.
    // We only supports 'cloudevents.json', so tell the server that.
    this._ws = new WebSocket(addr, 'cloudevents.json');

    // The open event handler. Resets state
    this._ws.addEventListener('open', () => {
      this.clearErrorNotification();
    });

    // Listen for messages on websocket and call the appropriate action according to the
    // CloudEvent type.
    this._ws.addEventListener('message', (event) => {
      const cloudEvent = JSON.parse(event.data);
      const eventType = cloudEvent.type;
      // Handle the events we know about. Ignore everyting else
      // eslint-disable-next-line default-case
      switch (eventType) {
        case 'org.ogc.api.collection.item.create': this.onUpdateEvent(cloudEvent.data);
          break;
        case 'org.ogc.api.collection.item.replace': this.onUpdateEvent(cloudEvent.data);
          break;
        case 'org.ogc.api.collection.item.delete': this.onDeleteEvent(cloudEvent.data);
      }
    });

    // Handle errors on websocket. Errors can occur for various reasons, but we get
    // little information, so there is not much we can do. Most common errors are
    // network disconnect or server not responding.
    this._ws.addEventListener('error', () => {
      this.onWsError();
    });

    // Handle close event. Close can be both intentional or unintentional (due to errors, which may not be
    // evented as errors or as both close and error)
    this._ws.addEventListener('close', (event) => {
      // Ignore code 1000 which is intentional close, most likely from our side when
      // hiding layer.
      if (event.code !== 1000) {
        // Server can indicate intentional disconnect due to "protocol error". We interpret that as the stream is no longer valid
        // but the featuresapi may give us a new working stream as it was featuresapi that gave us the stream in the first place and
        // thus is repsonsible for the "protocol". Most likely it is a stream reconnect to a server that uses sessions and the session
        // has expired between reconnects so the server does not have enough information for creating a new stream using only the WS call.
        // Remember that you can not reconnect to a websocket, it always creates a new socket using the provided information (url, query args,
        // headers, cookies, supported protocols, etc), which constitutes the "protocol".
        if (event.code === 1008) {
          this._forceFullReconnect = true;
        }
        this.onWsError();
      }
    });
  }

  /**
     * Helper to reuse code. Consider it to be private to this class.
     * Fetches features from features api endpoint and optionally connects to a real time broker
     * @returns Array of features or null if call failed but a reconnect was set up.
     * @throws If initial call failed and no retry was set up
     */
  async _loaderHelper() {
    let features = null;
    const url = new URL(`collections/${this._options.featureType}/items`, this._options.url);
    // `credentials = 'include'` is neccessary if the request sets cookies from another domain
    // than origo's. Server could set a cookie to keep track of session in WS
    // Server must also implement the correct cors headers for this to work. I hate cors.
    try {
      const response = await fetch(url, {
        credentials: this._options.credentials,
        cache: 'no-store'
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Response status: ${response.status}\n${errorMsg}`);
      }
      const jsonBody = await response.json();
      features = super.getFormat().readFeatures(jsonBody);
      // Only set up real time if configured to do so. Why? Because future support of bbox will mess things up if a stream is connected for each extent.
      if (this._options.realtime) {
        // Right now we only support hub-links in items response
        // Future implementations could examine AsyncApi document on landing page.
        const hub = jsonBody.links?.find(l => l.rel === 'hub');
        if (hub && hub.href && hub.href.toLowerCase().startsWith('ws')) {
          // Set up stream for real-time updates
          // Only supports CloudEvents over websockets, but in theory we could check protocol and type
          this._wsUrl = hub.href;
          this._connectToWs(hub.href);
        }
      }
    } catch (e) {
      // Only reconnect if this is a result of a reconnect due to dropped connection on stream.
      // Failed connecions on first call throws and leaves the layer as not ready (right or wrong, but
      // that's how other layers work), which means OL just ignores it.
      if (this._alreadyNotifiedError) {
        this.onWsError(e);
      } else {
        throw (e);
      }
    }
    return features;
  }

  /**
   * Reconnnects according to configured reconnection policy
   */
  reconnect() {
    if (!this._wsUrl) this._forceFullReconnect = true;
    if (this._options.realtimeReconnect === 'full' || this._forceFullReconnect) {
      // This can unintentionally turn into a sort of polling mechanism if the features api call succeeds
      // and the server returns features, but the connection to the stream fails later.
      this._loaderHelper().then(features => {
        // _loaderHelper returns null if a reconnect is set up. In that case we can keep features in
        // source until a connection is established.
        if (features) {
          super.clear();
          super.addFeatures(features);
        }
      });
    } else {
      // Must be 'stream', as 'none' never triggers reconnect in the first place
      this._connectToWs(this._wsUrl);
    }
  }

  /**
   * Stops listening to updates when deactivated. Source is not cleared in order to support
   * reconnect with catch up.
   * Restarts listening when activated.
   * Typically called when layer visibility changes.
   * @param {boolean} active True to activate, false to deactivate.
   */
  setActive(active) {
    if (this._options.realtime && this._options.realtimeDisconnectOnHide) {
      if (active) {
        // Avoid trying to reconnect if we already are in an error state.
        if (!this._reconnectTimer) {
          this.reconnect();
        }
      } else
        // Signal intentional close
        if (this._ws) {
          this._ws.close(1000, 'Layer hidden');
          this._ws = null;
        }
    }
  }
}

export default FeaturesApiSource;
