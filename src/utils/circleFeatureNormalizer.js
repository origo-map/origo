import { Polygon, Circle } from 'ol/geom';

// Adds circle info to feature properties for later recreation
function addCircleInfo(feature, center, radius) {
  const clone = feature.clone();
  const props = clone.getProperties();
  clone.setProperties({
    ...props,
    origoCircle: {
      circleCenter: center,
      circleRadius: radius,
      circleOriginal: true,
    },
  });

  return clone;
}

// Adds circle info to all circle features in the array, leaving them unchanged otherwise
export function addCircleInfoToFeatures(features) {
  return features.map((feature) => {
    const clone = feature.clone();
    const g = feature.getGeometry?.();

    if (g && g.getType?.() === "Circle") {
      const center = g.getCenter?.();
      const radius = g.getRadius?.();
      if (center && radius != null) {
        return addCircleInfo(clone, center, radius);
      }
    }
    return clone;
  });
}

// Transforms all circles into polygons for GeoJSON or KML export
export function normalizeCircleFeatures(features, format = 'geojson', segments = 64) {
  // GeoJSON and KML do not support circles, so we convert them to polygons.
  // GPX does not support polygons at all, so we leave circles as-is.
  if (format !== 'geojson' && format !== 'kml') {
    return features;
  }

  return features.map((f) => {
    const g = f.getGeometry?.();
    if (g && g.getType?.() === 'Circle') {
      const poly = Polygon.fromCircle(g, segments);
      const clone = f.clone();
      clone.setGeometry(poly);

      const center = g.getCenter?.();
      const radius = g.getRadius?.();
      // Origo can recreate circles when loading if saved as GeoJSON, so we add the info needed
      if (center && radius != null && format === 'geojson') {
        return addCircleInfo(clone, center, radius);
      }
      return clone;
    }
    return f;
  });
}

// Recreates circle geometries from features that have circle info saved in properties
export function recreateCircleFeatures(
  featureArray
) {
  // Recreate circles from properties
  return featureArray.map((f) => {
    const props = f.getProperties();
    if (
      props.origoCircle !== undefined &&
      props.origoCircle.circleOriginal &&
      Array.isArray(props.origoCircle.circleCenter) &&
      props.origoCircle.circleRadius != null
    ) {
      const circle = new Circle(
        props.origoCircle.circleCenter,
        Number(props.origoCircle.circleRadius)
      );
      f.setGeometry(circle);
    }
    return f;
  });
}
