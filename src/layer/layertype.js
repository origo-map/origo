import wfs from './wfs.js';
import ags_feature from './agsfeature.js';
import topojson from './topojson.js';
import geojson from './geojson.js';
import wms from './wms.js';
import wmts from './wmts.js';
import ags_tile from './ags_tile.js';
import xyz from './xyz.js';
import osm from './osm.js';
import vectortile from './vectortile.js';
import feature from './featurelayer.js';

const type = {};

type.WFS = wfs;
type.AGS_FEATURE = ags_feature;
type.TOPOJSON = topojson;
type.GEOJSON = geojson;
type.WMS = wms;
type.WMTS = wmts;
type.AGS_TILE = ags_tile;
type.XYZ = xyz;
type.OSM = osm;
type.VECTORTILE = vectortile;
type.FEATURE = feature;

export default type;
