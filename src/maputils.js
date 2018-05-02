import Projection from 'ol/proj/projection';
import TileGrid from 'ol/tilegrid/tilegrid';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Vector from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import Extent from 'ol/extent';
import WKT from 'ol/format/wkt';
import viewer from './viewer';

export default {
  customProjection: function customProjection(projectionCode, extent) {
    return new Projection({
      code: projectionCode,
      extent
    });
  },
  tileGrid: function tileGrid(settings) {
    const extent = settings.extent || viewer.getExtent();
    const origin = settings.alignBottomLeft === false ? Extent.getTopLeft(extent) : Extent.getBottomLeft(extent);
    const resolutions = settings.resolutions || viewer.getResolutions();
    const tileSize = settings.tileSize || viewer.getTileSize();
    return new TileGrid({
      extent,
      origin,
      resolutions,
      tileSize
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
    const feature = new Feature({
      geometry: new Point(coordinate)
    });
    feature.setStyle(style);
    return feature;
  },
  geojsonToFeature: function geojsonToFeature(obj) {
    const vectorSource = new Vector({
      features: (new GeoJSON()).readFeatures(obj)
    });
    return vectorSource.getFeatures()[0];
  },
  wktToFeature: function wktToFeature(wkt, srsName) {
    const format = new WKT();
    const feature = format.readFeature(wkt, {
      dataProjection: srsName,
      featureProjection: srsName
    });
    return feature;
  },
  zoomToExent: function zoomToExent(geometry, level) {
    const map = viewer.getMap();
    const view = map.getView();
    const maxZoom = level;
    const extent = geometry.getExtent();
    if (extent) {
      view.fit(extent, {
        maxZoom
      });
      return extent;
    } else {
      return undefined;
    }
  },
  getCenter: function getCenter(geometry) {
    const type = geometry.getType();
    let center;
    switch (type) {
      case 'Polygon':
        center = geometry.getInteriorPoint().getCoordinates();
        break;
      case 'MultiPolygon':
        center = geometry.getInteriorPoints().getFirstCoordinate();
        break;
      case 'Point':
        center = geometry.getCoordinates();
        break;
      case 'MultiPoint':
        center = geometry[0].getCoordinates();
        break;
      case 'LineString':
        center = geometry.getCoordinateAt(0.5);
        break;
      case 'MultiLineString':
        center = geometry.getLineStrings()[0].getCoordinateAt(0.5);
        break;
      case 'Circle':
        center = geometry.getCenter();
        break;
      default:
        break;
    }
    return center;
  },
  scaleToResolution: function scaleToResolution(scale, projection) {
    const dpi = 25.4 / 0.28;
    const mpu = projection.getMetersPerUnit();
    const resolution = scale / (mpu * 39.37 * dpi);
    return resolution;
  }
};
