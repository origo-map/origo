import { getLength as olGetLength } from 'ol/sphere';
import formatLengthString from '../utils/formatlengthstring';

export default function getLength(geometryIn, decimals, map, localization) {
  let length = 0;

  const geomType = geometryIn.getType();
  if (geomType === 'LineString' || geomType === 'LinearRing' || geomType === 'MultiLineString') {
    length = olGetLength(geometryIn, { projection: map.getView().getProjection() });
  }

  return formatLengthString(length, { decimals: decimals || 2, localization });
}
