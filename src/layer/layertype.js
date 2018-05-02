import wfs from './wfs';
import ags_feature from './agsfeature';
import topojson from './topojson';
import geojson from './geojson';
import wms from './wms';
import wmts from './wmts';
import ags_tile from './agstile';
import xyz from './xyz';
import osm from './osm';
import vectortile from './vectortile';
import feature from './featurelayer';

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
