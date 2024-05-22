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
   * @param {any} filter
   */
  setFilter(filter) {
    this._options.filter = filter;
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
   * Generate a wfs query filter according to the wfs layer source's `filterType` (`cql`|`qgis`).
   * If specified, an extra filter is combined with any layer filter already present.
   * Consider this function to be private to this class.
   * @param {any} extent Extent to query. If specified the result is limited to the intersection of this parameter and layer's extent configuration
   * @param {any} extraFilter Optional extra filter for this call with syntax matching the source's `filterType` (`cql`|`qgis`). Will be combined with any configured layer filter unless ignoreOriginalFilter is true
   * @param {any} ignoreOriginalFilter true if configured layer filter should be ignored for this call, making parameter extraFilter the only filter (if specified)
   */
  _createQueryFilter(extent, extraFilter, ignoreOriginalFilter) {
    let layerFilter = '';
    let queryFilter = '';
    // Add layer filter unless `ignoreOriginalFilter` is set
    if (this._options.filter && !ignoreOriginalFilter) {
      layerFilter = replacer.replace(this._options.filter, window);
    }

    // Prepare extent if used
    let requestExtent;
    if (extent && !this._options.isTable) {
      // Combine the layer's extent with the extent used for this function call
      const ext = getIntersection(this._options.customExtent, extent) || extent;
      // Reproject it if the layer's data projection differs from that of the map
      if (this._options.dataProjection !== this._options.projectionCode) {
        requestExtent = transformExtent(ext, this._options.projectionCode, this._options.dataProjection);
      } else {
        requestExtent = ext;
      }
      // If extent is used but no filters are set, just return the BBOX parameter.
      if (!layerFilter && !extraFilter) {
        queryFilter = `&BBOX=${requestExtent.join(',')},${this._options.dataProjection}`;
        return queryFilter;
      }
    }

    // Integrate provided layer filters, `extraFilter` and extent into a single query filter
    // Both QGIS and GeoServer treats the WFS parameters `BBOX` and `CQL_FILTER`/`EXP_FILTER` as mutually exclusive,
    // so instead of BBOX we use the vendor filters also for the extent filtering.
    switch (this._options.filterType) {
      case 'cql': {
        // Set up the filter as a combination of the layer filter and the extraFilter parameter
        let cqlfilter = layerFilter;
        if (layerFilter && extraFilter) {
          cqlfilter += ' AND ';
        }
        if (extraFilter) {
          cqlfilter += `${replacer.replace(extraFilter, window)}`;
        }

        // If using extent, and the layer is not a geometryless table, integrate it into the query filter
        if (extent && !this._options.isTable) {
          if (cqlfilter) {
            cqlfilter += ' AND ';
          }
          cqlfilter += `BBOX(${this._options.geometryName},${requestExtent.join(',')},'${this._options.dataProjection}')`;
        }

        // Create the complete CQL query string
        if (cqlfilter) {
          queryFilter = `&CQL_FILTER=${cqlfilter}`;
        }
        break;
      }
      case 'qgis': {
        // Set up the filter as a combination of the layer filter and the extraFilter parameter
        let qgisFilter = layerFilter;
        if (layerFilter && extraFilter) {
          qgisFilter += ' AND ';
        }
        if (extraFilter) {
          qgisFilter += `${replacer.replace(extraFilter, window)}`;
        }

        // If using extent, and the layer is not a geometryless table, integrate it into the query filter
        if (extent && !this._options.isTable) {
          if (qgisFilter) {
            qgisFilter += ' AND ';
          }
          const wktBbox = `POLYGON ((${requestExtent[0]} ${requestExtent[3]},${requestExtent[2]} ${requestExtent[3]},${requestExtent[2]} ${requestExtent[1]},${requestExtent[0]} ${requestExtent[1]},${requestExtent[0]} ${requestExtent[3]}))`;
          qgisFilter += `intersects_bbox(@geometry,geom_from_wkt('${wktBbox},${this._options.dataProjection}'))`;
        }

        // Create the complete QGIS EXP_FILTER query string
        if (qgisFilter) {
          queryFilter = `&EXP_FILTER=${qgisFilter}`;
        }
        break;
      }
      default: break;
    }
    return queryFilter;
  }

  /**
   * Helper to reuse code. Consider it to be private to this class.
   * @param {any} extent Extent to query. If specified the result is limited to the intersection of this parameter and layer's extent configuration
   * @param {any} extraFilter Optional extra filter for this call with syntax matching the source's `filterType` (`cql`|`qgis`)
   * @param {any} ignoreOriginalFilter true if configured layer filter should be ignored for this call making parameter `extraFilter` the only filter (if specified)
   * @param {any} ids Comma separated list of feature ids. If specified, extent and other filters will be ignored.
   */
  async _loaderHelper(extent, extraFilter, ignoreOriginalFilter, ids) {
    const serverUrl = this._options.url;
    const queryParams = this._options.queryParams || {};

    // Create the complete URL
    // FIXME: rewrite using URL class
    let url = [`${serverUrl}${serverUrl.indexOf('?') < 0 ? '?' : '&'}service=WFS`,
      `&version=1.1.0&request=GetFeature&typeName=${this._options.featureType}&outputFormat=application/json`,
      `&srsname=${this._options.dataProjection}`].join('');
    // Add FeatureId parameter if there are ids requested.
    // FeatureId is incompatible with BBOX and CQL_FILTER (will override QGIS's EXP_FILTER) so they should not be used together.
    // QGIS Server expects feature type name to be prepended while GeoServer handles both with and without.
    if (ids || ids === 0) {
      switch (this._options.filterType) {
        case 'qgis': {
          let idArray = ids.toString().split(','); // Split to array
          idArray = idArray.map(id => {
            // Prepend the layername using id if needed (in case the name is using double underscore notation)
            if (!id.toString().startsWith(`${this._options.featureType}.`)) {
              return `${this._options.featureType}.${id}`;
            }
            return id;
          }); // Join to a comma separated string again
          url += `&FeatureId=${idArray.join(',')}`;
          break;
        }
        default: {
          url += `&FeatureId=${ids}`;
        }
      }
    } else { // If there are no ids requested, append the query filter
      url += this._createQueryFilter(extent, extraFilter, ignoreOriginalFilter);
    }

    Object.keys(queryParams).forEach(key => {
      url += `&${key}=${queryParams[key]}`;
    });

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
   * Makes a call to the server with the provided query filter and adds all matching records to the layer.
   * If the layer has a filter it is honoured.
   * @param {any} filter
   */
  async ensureLoaded(filter) {
    const features = await this._loaderHelper(null, filter, false);
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
   * @param {any} filter Optional additional filter for this call with syntax matching the source's `filterType` (`cql`|`qgis`)
   * @param {any} ignoreOriginalFilter true if configured layer filter should be ignored for this request
   */
  async getFeaturesFromSource(extent, filter, ignoreOriginalFilter) {
    return this._loaderHelper(extent, filter, ignoreOriginalFilter);
  }
}

export default WfsSource;
