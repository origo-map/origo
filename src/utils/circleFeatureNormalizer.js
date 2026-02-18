import { Polygon, Circle } from 'ol/geom';
import { transform } from 'ol/proj';

/**
 * Adds circle info to feature properties for later recreation.
 *
 * @param {*} feature The feature to add circle info to.
 * @param {*} center The center coordinate of the circle.
 * @param {*} radius The radius of the circle.
 * @returns The feature with added circle info properties.
 */
function addCircleInfo(feature, center, radius) {
  const props = feature.getProperties();
  feature.setProperties({
    ...props,
    origoCircle: {
      circleCenter: center,
      circleRadius: radius,
      circleOriginal: true
    }
  });

  return feature;
}

/**
 * Adds circle info to all circle features in an array, leaving them unchanged otherwise.
 *
 * @param {*} features Array of features.
 * @returns Array of features with circle info added to the relevant features.
 */
export function addCircleInfoToFeatures(features) {
  return features.map((feature) => {
    const g = feature.getGeometry?.();

    if (g && g.getType?.() === 'Circle') {
      const center = g.getCenter?.();
      const radius = g.getRadius?.();
      if (center && radius != null) {
        return addCircleInfo(feature, center, radius);
      }
    }
    return feature;
  });
}

/**
 * Transforms all circles into polygons for GeoJSON or KML export.
 *
 * @param {*} features Array of features.
 * @param {*} formatOptions The object with the feature projection (to convert from) and data projection (to convert to). E.g., 'EPSG:4326'.
 * @param {*} format The format, either 'geojson' or 'kml' to perform the transformation.
 * @param {*} segments Number of segments to use for circle approximation.
 * @returns Array of features with circles transformed to polygons where applicable.
 */
export function normalizeCircleFeatures(features, formatOptions = null, format = 'geojson', segments = 64) {
  // GeoJSON and KML do not support circles, so we convert them to polygons.
  // GPX does not support polygons at all, so we leave circles as-is.
  if (format !== 'geojson' && format !== 'kml') {
    return features;
  }

  return features.map((f) => {
    const clone = f.clone();

    if (f.getId()) {
      clone.setId(f.getId());
    }

    const g = clone.getGeometry?.();
    if (g && g.getType?.() === 'Circle') {
      const poly = Polygon.fromCircle(g, segments);
      clone.setGeometry(poly);

      let center = g.getCenter?.();

      if (formatOptions && formatOptions.dataProjection && formatOptions.featureProjection
        && formatOptions.dataProjection !== formatOptions.featureProjection) {
        // Transform center coordinate to map projection
        const transformFunctions = formatOptions.dataProjection && formatOptions.featureProjection
          ? [formatOptions.featureProjection, formatOptions.dataProjection]
          : null;
        if (transformFunctions) {
          center = transform(
            center,
            transformFunctions[0],
            transformFunctions[1]
          );
        }
      }

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

/**
 * Recreates circle geometries from features that have circle info saved in properties.
 *
 * @param {*} featureArray Array of features.
 * @param {*} formatOptions The object with the feature projection (to convert to) and data projection (to convert from). E.g., 'EPSG:4326'.
 * @returns Array of features with circle geometries recreated where applicable.
 */
export function recreateCircleFeatures(featureArray, formatOptions = null) {
  // Recreate circles from properties
  return featureArray.map((f) => {
    const props = f.getProperties();
    if (
      props.origoCircle !== undefined
      && props.origoCircle.circleOriginal
      && Array.isArray(props.origoCircle.circleCenter)
      && props.origoCircle.circleRadius != null
    ) {
      let circleCenter = props.origoCircle.circleCenter;
      const dataProjection = formatOptions?.dataProjection || 'EPSG:4326';
      if (
        formatOptions
        && dataProjection
        && formatOptions.featureProjection
        && dataProjection !== formatOptions.featureProjection
      ) {
        // Transform center coordinate to map projection
        const transformFunctions = dataProjection && formatOptions.featureProjection
          ? [dataProjection, formatOptions.featureProjection]
          : null;
        if (transformFunctions) {
          circleCenter = transform(
            circleCenter,
            transformFunctions[0],
            transformFunctions[1]
          );
        }
      }

      const circle = new Circle(
        circleCenter,
        Number(props.origoCircle.circleRadius)
      );
      f.setGeometry(circle);
    }
    return f;
  });
}
