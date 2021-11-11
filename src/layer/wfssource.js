import VectorSource from 'ol/source/Vector';
import replacer from '../utils/replacer';
import GeoJSONFormat from 'ol/format/GeoJSON';

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
        /**Changing this will have effect on the next call to loader, eg. pan/zoom on a BBOX layer or a refresh()  */
        this.options = options;
        /**Changing this will have effect on the next call to loader, eg. pan/zoom on a BBOX layer or a refresh()  */
        this.filter = options.filter;

        // Set up the loader that OL will call.
        if (options.strategy === 'ondemand') {
            super.setLoader(this.onDemandLoader);
        } else {
            super.setLoader(this.onLoad);
        }
	}

    /**
     * Called by VectorSource
     * @param {any} extent
     */
    onLoad(extent) {
        // TODO: handle success callback?
        this._loaderHelper(extent);
	}

    /**
     * Silly function that only triggers the 'featuresloadend' event but does not load anything.
     * Used for tables whith ondemand strategy. Which means that nothing is loaded unless implicitly added to source.
     * @param {any} extent
     * @param {any} resolution
     * @param {any} projection
     * @param {any} success
     * @param {any} failure
     */
    onDemandLoader(extent, resolution, projection, success, failure) {
        success(null);
	}
    /**
     * Helper to reuse code. Consider it to be private to this class
     * @param {any} extent
     * @param {any} cql if provided, extent is ignored
     */
    async _loaderHelper(extent, cql) {
        const serverUrl = this.options.url;

        // Set up the cql filter as a combination of the layer filter and the temporary cql parameter
        let cqlfilter = '';
        if (this.filter) {
            cqlfilter = replacer.replace(this.filter, window);
            if (cql) {
                cqlfilter += ` AND `;
			}
        }
        if (cql) {
            cqlfilter += `${replacer.replace(cql, window)}`;
        }

        // Create the complete CQL query string
        let queryFilter = '';
        if (this.options.strategy === 'all' || cql || this.options.isTable) {
            queryFilter = cqlfilter ? `&CQL_FILTER=${cqlfilter}` : '';
        } else {
            // Extent should be used. Depending if there also is a filter, the queryfilter looks different 
            let requestExtent;
            if (this.options.dataProjection !== this.options.projectionCode) {
                requestExtent = transformExtent(extent, this.options.projectionCode, this.options.dataProjection);
            } else {
                requestExtent = extent;
            }
            if (cqlfilter) {
                queryFilter = `&CQL_FILTER=${cqlfilter} AND BBOX(${this.options.geometryName},${requestExtent.join(',')},'${this.options.dataProjection}')`

            } else {
                queryFilter = `&BBOX=${requestExtent.join(',')},${this.options.dataProjection}`;
            }
        }

        // Create the complete URL
        let url = [`${serverUrl}?service=WFS`,
        `&version=1.1.0&request=GetFeature&typeName=${this.options.featureType}&outputFormat=application/json`,
        `&srsname=${this.options.dataProjection}`].join('');
        url += queryFilter;
        url = encodeURI(url);

        // Actually fetch some features
        let features = await fetch(url).then(response => response.json({
            cache: false
        }));

        super.addFeatures(super.getFormat().readFeatures(features));
        // Delete the geometry if it is a table (ignoring geometry) as the GeoJSON loader creates an empty geometry
        if (this.options.isTable) {
            this.getFeatures().forEach(f => {
                f.unset(f.getGeometryName(), true);
            });
        }
    }

    /**
     * Makes a call to the server with the provided cql filter and adds all matching records to the layer.
     * If the layer has a filter it is honoured.
     * @param {any} cql
     */
    async ensureLoaded(cql) {
        await this._loaderHelper(null, cql)
	}
}

export default WfsSource;