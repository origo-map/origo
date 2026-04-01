import GeoTIFFSource from 'ol/source/GeoTIFF';
import WebGLTile from 'ol/layer/WebGLTile';

function createSource(sourceInfo, sourceOptions, geoTIFFOptions = {}) {
  return new GeoTIFFSource(Object.assign({}, geoTIFFOptions, {
    sources: [sourceInfo],
    sourceOptions
  }));
}

const cog = function cog(layerOptions, viewer) {
  const cogDefault = {
    layerType: 'tile',
    crossOrigin: 'anonymous'
  };

  const cogOptions = Object.assign({}, cogDefault, layerOptions);
  const mapSource = viewer.getMapSource()[layerOptions.source] || {};
  const sourceInfo = {};
  const sourceOptions = {};

  sourceOptions.headers = cogOptions.headers;

  if (cogOptions.source && viewer.getMapSource()[cogOptions.source]) {
    sourceInfo.url = viewer.getMapSource()[cogOptions.source].url;
    if (viewer.getMapSource()[cogOptions.source].overviews) {
      sourceInfo.overviews = viewer.getMapSource()[cogOptions.source].overviews;
    }
    cogOptions.sourceName = cogOptions.source;
  } else if (cogOptions.source) {
    sourceInfo.url = cogOptions.source;
    cogOptions.sourceName = cogOptions.source;
  } else if (cogOptions.url) {
    sourceInfo.url = cogOptions.url;
  }

  if (cogOptions.overviews) {
    sourceInfo.overviews = cogOptions.overviews;
  }

  if (mapSource.url && !sourceInfo.url) {
    sourceInfo.url = mapSource.url;
  }
  if (mapSource.overviews && !sourceInfo.overviews) {
    sourceInfo.overviews = mapSource.overviews;
  }

  const geoTIFFOptions = {};
  if (cogOptions.projection) {
    geoTIFFOptions.projection = cogOptions.projection;
  }
  if (cogOptions.convertToRGB !== undefined) {
    geoTIFFOptions.convertToRGB = cogOptions.convertToRGB;
  }
  if (cogOptions.normalize !== undefined) {
    geoTIFFOptions.normalize = cogOptions.normalize;
  }

  const cogSource = createSource(sourceInfo, sourceOptions, geoTIFFOptions);
  const options = Object.assign({}, cogOptions, { source: cogSource });
  return new WebGLTile(options);
};

export default cog;
