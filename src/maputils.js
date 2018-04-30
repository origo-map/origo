import Projection from 'ol/proj/projection';
import TileGrid from 'ol/tilegrid/tilegrid';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Vector from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import WKT from 'ol/format/wkt';
import viewer from './viewer';

export default {
  customProjection: function(projectionCode, extent) {
    return new Projection({
      code: projectionCode,
      extent: extent
    });
  },
  tileGrid: function(settings) {
    var extent = settings.extent || viewer.getExtent();
    var origin = settings.alignBottomLeft === false ? ol.extent.getTopLeft(extent) : ol.extent.getBottomLeft(extent);
    var resolutions = settings.resolutions || viewer.getResolutions();
    var tileSize = settings.tileSize || viewer.getTileSize();
    return new TileGrid({
      extent: extent,
      origin: origin,
      resolutions: resolutions,
      tileSize: tileSize
    });
  },
  checkZoomChange: function checkZoomChange(resolution, currentResolution) {
    if (resolution !== currentResolution) {
      return true;
    } else {
      return false;
    }
  },
  createPointFeature: function createPointFeature(coordinate, style) {
    var feature = new Feature({
      geometry: new Point(coordinate)
    });
    feature.setStyle(style);
    return feature;
  },
  geojsonToFeature: function geojsonToFeature(obj) {
    var vectorSource = new Vector({
      features: (new GeoJSON()).readFeatures(obj)
    });
    return vectorSource.getFeatures()[0];
  },
  wktToFeature: function wktToFeature(wkt, srsName) {
    var format = new WKT();
    var feature = format.readFeature(wkt, {
      dataProjection: srsName,
      featureProjection: srsName
    });
    return feature;
  },
  zoomToExent: function zoomToExent(geometry, level) {
    var map = viewer.getMap();
    var view = map.getView();
    var maxZoom = level;
    var extent = geometry.getExtent();
    if (extent) {
      view.fit(extent, {
        maxZoom: maxZoom
      });
      return extent;
    } else {
      return undefined;
    }
  },
  getCenter: function getCenter(geometry) {
    var type = geometry.getType();
    var center;
    switch (type) {
      case "Polygon":
        center = geometry.getInteriorPoint().getCoordinates();
        break;
      case "MultiPolygon":
        center = geometry.getInteriorPoints().getFirstCoordinate();
        break;
      case "Point":
        center = geometry.getCoordinates();
        break;
      case "MultiPoint":
        center = geometry[0].getCoordinates();
        break;
      case "LineString":
        center = geometry.getCoordinateAt(0.5);
        break;
      case "MultiLineString":
        center = geometry.getLineStrings()[0].getCoordinateAt(0.5);
        break;
      case "Circle":
        center = geometry.getCenter();
        break;
    }
    return center;
  },
  scaleToResolution: function scaleToResolution(scale, projection) {
    var dpi = 25.4 / 0.28;
    var mpu = projection.getMetersPerUnit();
    var resolution = scale / (mpu * 39.37 * dpi);
    return resolution;
  }
}
