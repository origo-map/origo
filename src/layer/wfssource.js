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
   * Generate a wfs query filter according to the wfs layer source's `filterType`. Combines
   * the custom filter parameter with any layer filters already present.
   * @param {string} filterType The filter type used by the layer source (`cql`)
   * @param {string} customFilter custom filter to combine with preconfigured layer filters
   * @param {any} extent ignored when using customFilter
   */
  createQueryFilter(filterType, customFilter, extent) {
    let queryFilter = '';

    switch (filterType) {
      case 'cql': {
        // Set up the filter as a combination of the layer filter and the temporary filter parameter
        let cqlfilter = '';
        if (this.getOptions().filter) {
          cqlfilter = replacer.replace(this.getOptions().filter, window);
          if (customFilter) {
            cqlfilter += ' AND ';
          }
        }
        if (customFilter) {
          cqlfilter += `${replacer.replace(customFilter, window)}`;
        }

        // Create the complete CQL query string
        if (this.getOptions().strategy === 'all' || customFilter || this.getOptions().isTable) {
          queryFilter = cqlfilter ? `&CQL_FILTER=${cqlfilter}` : '';
        } else {
          // Extent should be used. Depending if there also is a filter, the queryfilter looks different
          let requestExtent;
          if (this.getOptions().dataProjection !== this.getOptions().projectionCode) {
            requestExtent = transformExtent(extent, this.getOptions().projectionCode, this.getOptions().dataProjection);
          } else {
            requestExtent = extent;
          }
          if (cqlfilter) {
            queryFilter = `&CQL_FILTER=${cqlfilter} AND BBOX(${this.getOptions().geometryName},${requestExtent.join(',')},'${this.getOptions().dataProjection}')`;
          } else {
            queryFilter = `&BBOX=${requestExtent.join(',')},${this.getOptions().dataProjection}`;
          }
        }
        break;
      }
      default: break;
      }
        return queryFilter;
    }

  /**
   * Helper to reuse code. Consider it to be private to this class
   * @param {any} extent
   * @param {any} filter if provided, extent is ignored
   */
  async _loaderHelper(extent, filter) {
    const serverUrl = this._options.url;

    // Create the complete URL
    let url = [`${serverUrl}${serverUrl.indexOf('?') < 0 ? '?' : '&'}service=WFS`,
      `&version=1.1.0&request=GetFeature&typeName=${this._options.featureType}&outputFormat=application/json`,
      `&srsname=${this._options.dataProjection}`].join('');
    url += this.createQueryFilter(this._options.filterType, filter, extent);
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
   * Makes a call to the server with the provided query filter and adds all matching records to the layer.
   * If the layer has a filter it is honoured.
   * @param {any} filter
   */
  async ensureLoaded(filter) {
    await this._loaderHelper(null, filter);
  }
}

export default WfsSource;
