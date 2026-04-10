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
    crossOrigin: 'anonymous',
    interpolate: true,
    normalize: true,
    wrapX: false
  };

  const cogOptions = Object.assign({}, cogDefault, layerOptions);
  const mapSource = viewer.getMapSource()[layerOptions.source] || {};
  const sourceInfo = {};
  const sourceOptions = {};

  if (cogOptions.sourceOptions && typeof cogOptions.sourceOptions === 'object') {
    Object.assign(sourceOptions, cogOptions.sourceOptions);
  }

  if (cogOptions.crossOrigin) {
    sourceOptions.crossOrigin = cogOptions.crossOrigin;
  }

  if (cogOptions.headers) {
    sourceOptions.headers = cogOptions.headers;
  }

  if (cogOptions.source && viewer.getMapSource()[cogOptions.source]) {
    sourceInfo.url = viewer.getMapSource()[cogOptions.source].url;
    if (viewer.getMapSource()[cogOptions.source].overviews) {
      sourceInfo.overviews = viewer.getMapSource()[cogOptions.source].overviews;
    }
    if (viewer.getMapSource()[cogOptions.source].min !== undefined) {
      sourceInfo.min = viewer.getMapSource()[cogOptions.source].min;
    }
    if (viewer.getMapSource()[cogOptions.source].max !== undefined) {
      sourceInfo.max = viewer.getMapSource()[cogOptions.source].max;
    }
    if (viewer.getMapSource()[cogOptions.source].nodata !== undefined) {
      sourceInfo.nodata = viewer.getMapSource()[cogOptions.source].nodata;
    }
    if (viewer.getMapSource()[cogOptions.source].bands !== undefined) {
      sourceInfo.bands = viewer.getMapSource()[cogOptions.source].bands;
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
  if (cogOptions.min !== undefined) {
    sourceInfo.min = cogOptions.min;
  }
  if (cogOptions.max !== undefined) {
    sourceInfo.max = cogOptions.max;
  }
  if (cogOptions.nodata !== undefined) {
    sourceInfo.nodata = cogOptions.nodata;
  }
  if (cogOptions.bands !== undefined) {
    sourceInfo.bands = cogOptions.bands;
  }

  if (mapSource.url && !sourceInfo.url) {
    sourceInfo.url = mapSource.url;
  }
  if (mapSource.overviews && !sourceInfo.overviews) {
    sourceInfo.overviews = mapSource.overviews;
  }

  const geoTIFFOptions = {};

  ['projection', 'convertToRGB', 'normalize', 'wrapX', 'interpolate', 'transition', 'cacheSize', 'minZoom', 'maxZoom', 'tileSize', 'gutter', 'reprojectionErrorThreshold', 'key'].forEach((option) => {
    if (cogOptions[option] !== undefined) {
      geoTIFFOptions[option] = cogOptions[option];
    }
  });

  const cogSource = createSource(sourceInfo, sourceOptions, geoTIFFOptions);
  const options = Object.assign({}, cogOptions, { source: cogSource });
  return new WebGLTile(options);
};

export default cog;
