import Projection from 'ol/proj/projection';
import TileGrid from 'ol/tilegrid/tilegrid';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Vector from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import Extent from 'ol/extent';
import WKT from 'ol/format/wkt';

export default {
  isWithinVisibleScales: function isWithinVisibleScales(scale, maxScale, minScale) {
    if (maxScale || minScale) {
      // Alter 1: maxscale and minscale
      if (maxScale && minScale) {
        if ((scale > maxScale) && (scale < minScale)) {
          return true;
        }
      } else if (maxScale) {
        // Alter 2: only maxscale
        if (scale > maxScale) {
          return true;
        }
      } else if (minScale) {
        // Alter 3: only minscale
        if (scale < minScale) {
          return true;
        }
      }
    } else {
      // Alter 4: no scale limit
      return true;
    }
    return false;
  },
  customProjection: function customProjection(projectionCode, extent) {
    return new Projection({
      code: projectionCode,
      extent
    });
  },
  tileGrid: function tileGrid(settings, defaultSettings = {}) {
    const tileGridSettings = Object.assign({}, defaultSettings, settings);
    const extent = tileGridSettings.extent;
    tileGridSettings.origin = tileGridSettings.alignBottomLeft === false ? Extent.getTopLeft(extent) : Extent.getBottomLeft(extent);
    return new TileGrid(tileGridSettings);
  },
  checkZoomChange: function checkZoomChange(resolution, currentResolution) {
    if (resolution !== currentResolution) {
      return true;
    }

    return false;
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
  resolutionToScale: function resolutionToScale(resolution, projection) {
    const dpi = 25.4 / 0.28;
    const mpu = projection.getMetersPerUnit();
    let scale = resolution * mpu * 39.37 * dpi;
    scale = Math.round(scale);
    return scale;
  },
  scaleToResolution: function scaleToResolution(scale, projection) {
    const dpi = 25.4 / 0.28;
    const mpu = projection.getMetersPerUnit();
    const resolution = scale / (mpu * 39.37 * dpi);
    return resolution;
  }
};
