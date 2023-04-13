import wfs from './wfs';
import agsFeature from './agsfeature';
import agsMap from './agsmap';
import topojson from './topojson';
import geojson from './geojson';
import gpx from './gpx';
import kml from './kml';
import wms from './wms';
import wmts from './wmts';
import agsTile from './agstile';
import xyz from './xyz';
import osm from './osm';
import vectortile from './vectortile';
import feature from './featurelayer';

const layerType = {};

layerType.WFS = wfs;
layerType.AGS_FEATURE = agsFeature;
layerType.AGS_MAP = agsMap;
layerType.TOPOJSON = topojson;
layerType.GEOJSON = geojson;
layerType.GPX = gpx;
layerType.KML = kml;
layerType.WMS = wms;
layerType.WMTS = wmts;
layerType.AGS_TILE = agsTile;
layerType.XYZ = xyz;
layerType.OSM = osm;
layerType.VECTORTILE = vectortile;
layerType.FEATURE = feature;

export default layerType;
