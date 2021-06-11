import wfs from './wfs';
import agsFeature from './agsfeature';
import agsMap from './agsmap';
import topojson from './topojson';
import geojson from './geojson';
import gpx from './gpx';
import wms from './wms';
import wmts from './wmts';
import agsTile from './agstile';
import xyz from './xyz';
import osm from './osm';
import vectortile from './vectortile';
import feature from './featurelayer';

const type = {};

type.WFS = wfs;
type.AGS_FEATURE = agsFeature;
type.AGS_MAP = agsMap;
type.TOPOJSON = topojson;
type.GEOJSON = geojson;
type.GPX = gpx;
type.WMS = wms;
type.WMTS = wmts;
type.AGS_TILE = agsTile;
type.XYZ = xyz;
type.OSM = osm;
type.VECTORTILE = vectortile;
type.FEATURE = feature;

export default type;
