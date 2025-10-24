import { Polygon } from "ol/geom";
import { Circle } from "ol/geom";

// Transforms all circles into polygons for GeoJSON or KML export
export function normalizeCircleFeatures(features, format = "geojson", segments = 64) {
  // GeoJSON and KML do not support circles, so we convert them to polygons.
  // GPX does not support polygons at all, so we leave circles as-is.
  if (format !== "geojson" && format !== "kml") {
    return features;
  }

  return features.map((f) => {
    const g = f.getGeometry?.();
    if (g && g.getType?.() === "Circle") {
      const poly = Polygon.fromCircle(g, segments);
      const clone = f.clone();
      clone.setGeometry(poly);

      const center = g.getCenter?.();
      const radius = g.getRadius?.();
      // Origo can recreate circles when loading if saved as GeoJSON, so we add the info needed
      if (center && radius != null && format === "geojson") {
        const props = clone.getProperties();
        clone.setProperties({
          ...props,
          // Add circle info for later use if needed
          circleCenter: center,
          circleRadius: radius,
          circleOriginal: true,
        });
      }
      return clone;
    }
    return f;
  });
}

export function recreateCircleFeatures(
  featureArray
) {
  // Recreate circles from properties
  return featureArray.map((f) => {
    const props = f.getProperties();
    if (
      props.circleOriginal &&
      Array.isArray(props.circleCenter) &&
      props.circleRadius != null
    ) {
      const circle = new Circle(props.circleCenter, Number(props.circleRadius));
      f.setGeometry(circle);
    }
    return f;
  });
};