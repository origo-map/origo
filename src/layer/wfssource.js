/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import * as LoadingStrategy from 'ol/loadingstrategy';
import { getIntersection } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import replacer from '../utils/replacer';

/**
 * Silly function that only triggers the 'featuresloadend' event but does not load anything.
 * Used for tables whith bbox strategy as they would never get any matches anyway.
 * @param {any} extent
 * @param {any} resolution
 * @param {any} projection
 * @param {any} success
 */
function onDemandLoader(extent, resolution, projection, success) {
  success(null);
}

/** Class that represents a WFS source. Extends VectorSource to make it possible
 * to change the filter and load features on demand without having to manaully fetch them. */
class WfsSource extends VectorSource {
  /**
   * Creates a new instance of WfsSource
   * @param {any} options The options to use.
   */
  constructor(options) {
    super({
      attributions: options.attribution,
      format: new GeoJSONFormat({
        geometryName: options.geometryName,
        dataProjection: options.dataProjection,
        featureProjection: options.projectionCode
      }),
      strategy: options.loadingstrategy
    });
    /** The options that this source was created with  */
    this._options = options;

    // Set up the loader that OL will call.
    if (options.loadingstrategy === LoadingStrategy.bbox && options.isTable) {
      // Tables with bbox will never get any result. Use a null loader.
      super.setLoader(onDemandLoader);
    } else {
      super.setLoader(this.onLoad);
    }
  }

  /** Gets the effective options that this source uses. */
  getOptions() {
    return this._options;
  }

  /**
   * Called by VectorSource. VectorSource always calls with extent specified. If strategy = 'all' it is an infinite extent.
   * @param {any} extent
   */
  onLoad(extent, resolution, projection, success, failure) {
    this._loaderHelper(extent)
      .then(f => {
        super.addFeatures(f);
        success(f);
      })
      .catch(() => failure());
  }

  /**
   * Set request method for source
   * @param {any} method
   */
  setMethod(method) {
    this._options.requestMethod = method;
  }

  /**
   * Set filter on source
   * @param {any} cql
   */
  setFilter(cql) {
    this._options.filter = cql;
    this.refresh();
  }

  /**
   * Clear filter on source
   */
  clearFilter() {
    this._options.filter = '';
    this.refresh();
  }

  /**
   * Helper to reuse code. Consider it to be private to this class.
   * @param {any} extent Extent to query. If specified the result is limited to the intersection of this parameter and layer's extent configuration.
   * @param {any} cql Optional extra cql for this call.
   * @param {any} ignoreOriginalFilter true if configured filter should be ignored for this call making parameter cql only filter (if specified)
   * @param {any} ids Comma separated list of feature ids. If specified you probably want to call with extent and cql empty and ignoreOriginalFilter = true
   */
  async _loaderHelper(extent, cql, ignoreOriginalFilter, ids) {
    const serverUrl = this._options.url;

    // Set up the cql filter as a combination of the layer filter and the temporary cql parameter
    let cqlfilter = '';
    if (this._options.filter && !ignoreOriginalFilter) {
      cqlfilter = replacer.replace(this._options.filter, window);
      if (cql) {
        cqlfilter += ' AND ';
      }
    }
    if (cql) {
      cqlfilter += `${replacer.replace(cql, window)}`;
    }

    // Create the complete CQL query string
    let queryFilter = '';
    if (!extent || this._options.isTable) {
      queryFilter = cqlfilter ? `&CQL_FILTER=${cqlfilter}` : '';
    } else {
      // Extent should be used. Depending if there also is a filter, the queryfilter looks different
      const ext = getIntersection(this._options.customExtent, extent) || extent;
      let requestExtent;
      if (this._options.dataProjection !== this._options.projectionCode) {
        requestExtent = transformExtent(ext, this._options.projectionCode, this._options.dataProjection);
      } else {
        requestExtent = ext;
      }
      if (cqlfilter) {
        queryFilter = `&CQL_FILTER=${cqlfilter} AND BBOX(${this._options.geometryName},${requestExtent.join(',')},'${this._options.dataProjection}')`;
      } else {
        queryFilter = `&BBOX=${requestExtent.join(',')},${this._options.dataProjection}`;
      }
    }

    // Create the complete URL
    // FIXME: rewrite using URL class
    let url = [`${serverUrl}${serverUrl.indexOf('?') < 0 ? '?' : '&'}service=WFS`,
      `&version=1.1.0&request=GetFeature&typeName=${this._options.featureType}&outputFormat=application/json`,
      `&srsname=${this._options.dataProjection}`].join('');
    url += queryFilter;
    if (ids || ids === 0) {
      url += `&FeatureId=${ids}`;
    }
    url = encodeURI(url);

    // Actually fetch some features
    let JsonFeatures;
    if (this._options.requestMethod && this._options.requestMethod.toLowerCase() === 'post') { // POST request
      const split = url.split('?');
      JsonFeatures = await fetch(split[0], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: split[1]
      }).then(response => response.json({
        cache: false
      }));
    } else { // GET request
      JsonFeatures = await fetch(url).then(response => response.json({
        cache: false
      }));
    }

    const features = super.getFormat().readFeatures(JsonFeatures);
    // Delete the geometry if it is a table (ignoring geometry) as the GeoJSON loader creates an empty geometry and that will
    // mess up saving the feature
    if (this._options.isTable) {
      features.forEach(f => {
        f.unset(f.getGeometryName(), true);
      });
    }
    return features;
  }

  /**
   * Makes a call to the server with the provided cql filter and adds all matching records to the layer.
   * If the layer has a filter it is honoured.
   * @param {any} cql
   */
  async ensureLoaded(cql) {
    const features = await this._loaderHelper(null, cql, false);
    super.addFeatures(features);
  }

  /**
   * Fetches features by id. Extent and filters are ignored. Does NOT add the feature to the layer
   * @param {any} ids Comma separated list of ids
   */
  async getFeatureFromSourceByIds(ids) {
    return this._loaderHelper(null, null, true, ids);
  }

  /**
   * Fetches features from server without adding them to the source. Honors filter configuration unless ignoreOriginalFilter is specified.
   * @param {any} extent Optional extent
   * @param {any} cql Optional additional cql filter for this call
   * @param {any} ignoreOriginalFilter true if configured cql filter should be ignored for this request
   */
  async getFeaturesFromSource(extent, cql, ignoreOriginalFilter) {
    return this._loaderHelper(extent, cql, ignoreOriginalFilter);
  }
}

export default WfsSource;
