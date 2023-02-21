import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import KMLFormat from 'ol/format/KML';
// TODO: move to maputils?

/**
 * Exports the given features to a file that is downloaded to the client.
 * @param {any} features
 * @param {'gpx' | 'geojson' | 'kml'} format Filetype.
 * @param {Object} opts Object with options
 * @param {any} opts.featureProjection The coordinatesystem that the features have on form 'EPSG:4326'.
 * @param {any} [opts.filename] Suggested filename without extension. Defaults to 'origoexport'
 * @returns {boolean} false if export failed
 */
const exportToFile = function exportToFile(features, format, opts = {}) {
  const {
    featureProjection,
    filename = 'origoexport'
  } = opts;
  // None of the currently implemented formats supports custom CRS (well GeoJson can, but is not standard)
  // If a format that supports custom CRS, dataProjection should be promoted to an optional parameter.
  const dataProjection = 'EPSG:4326';
  let formatter;

  switch (format) {
    case 'geojson':
      formatter = new GeoJSONFormat();
      break;
    case 'gpx':
      formatter = new GPXFormat();
      break;
    case 'kml':
      formatter = new KMLFormat();
      break;
    // More formats could be added if desired, but some are not implemented as OL does not implement a writer, amd some because they are obscure.
    // False as there will be no export
    default: return false;
  }
  const formatterOptions = {
    rightHanded: true,
    dataProjection,
    featureProjection
  };

  // Convert features to the specified format using the provided parameters
  const bytes = formatter.writeFeatures(features, formatterOptions);

  // Create the "file"
  // always use octet/stream to force download if download-attrib is not supported on anchor tag
  const data = new Blob([bytes], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(data);

  // Let's play dirty. It is not possible to save a file progamaticallay (yet, it is in the making in saveAs),
  // so we create a link that we click programatically
  const el = document.createElement('a');
  el.download = `${filename}.${format}`;
  el.href = url;

  el.addEventListener('click', () => {
    // Schedule our own clean up to be performed when download has been performed, otherwise file is lost
    // As download is performed in the same thread, we don't have to wait for anything special, just yield the thread.
    setTimeout(() => {
      // Must revoke object, otherwise there will be a memory leak.
      window.URL.revokeObjectURL(url);
    }, 0);
  });
  el.click();

  // We did everyting we could check OK. If the user actually proceedes to save the file is beyond our knowledge
  return true;
};

export default exportToFile;
