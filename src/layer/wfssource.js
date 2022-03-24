/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import * as LoadingStrategy from 'ol/loadingstrategy';
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
   * Called by VectorSource
   * @param {any} extent
   */
  onLoad(extent, resolution, projection, success, failure) {
    this._loaderHelper(extent)
      .then(f => success(f))
      .catch(() => failure());
  }

  /**
   * Helper to reuse code. Consider it to be private to this class
   * @param {any} extent
   * @param {any} cql if provided, extent is ignored
   */
  async _loaderHelper(extent, cql) {
    const serverUrl = this._options.url;

    // Set up the cql filter as a combination of the layer filter and the temporary cql parameter
    let cqlfilter = '';
    if (this._options.filter) {
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
    if (this._options.strategy === 'all' || cql || this._options.isTable) {
      queryFilter = cqlfilter ? `&CQL_FILTER=${cqlfilter}` : '';
    } else {
      // Extent should be used. Depending if there also is a filter, the queryfilter looks different
      let requestExtent;
      if (this._options.dataProjection !== this._options.projectionCode) {
        requestExtent = transformExtent(extent, this._options.projectionCode, this._options.dataProjection);
      } else {
        requestExtent = extent;
      }
      if (cqlfilter) {
        queryFilter = `&CQL_FILTER=${cqlfilter} AND BBOX(${this._options.geometryName},${requestExtent.join(',')},'${this._options.dataProjection}')`;
      } else {
        queryFilter = `&BBOX=${requestExtent.join(',')},${this._options.dataProjection}`;
      }
    }

    // Create the complete URL
    let url = [`${serverUrl}${serverUrl.indexOf('?') < 0 ? '?' : '&'}service=WFS`,
      `&version=1.1.0&request=GetFeature&typeName=${this._options.featureType}&outputFormat=application/json`,
      `&srsname=${this._options.dataProjection}`].join('');
    url += queryFilter;
    url = encodeURI(url);

    // Actually fetch some features
    const JsonFeatures = await fetch(url).then(response => response.json({
      cache: false
    }));
    const features = super.getFormat().readFeatures(JsonFeatures);
    // Delete the geometry if it is a table (ignoring geometry) as the GeoJSON loader creates an empty geometry and that will
    // mess up saving the feature
    if (this._options.isTable) {
      features.forEach(f => {
        f.unset(f.getGeometryName(), true);
      });
    }
    super.addFeatures(features);
    return features;
  }

  /**
   * Makes a call to the server with the provided cql filter and adds all matching records to the layer.
   * If the layer has a filter it is honoured.
   * @param {any} cql
   */
  async ensureLoaded(cql) {
    await this._loaderHelper(null, cql);
  }
}

export default WfsSource;
