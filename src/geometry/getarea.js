import { getArea as olGetArea } from 'ol/sphere';
import formatAreaString from '../utils/formatareastring';

export default function getArea(geometryIn, decimals, map, localization) {
  let area = 0;
  const geomType = geometryIn.getType();
  if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
    area = olGetArea(geometryIn, { projection: map.getView().getProjection() });
  }
  if (area === 0) return 0;

  return formatAreaString(area, { decimals: decimals || 2, localization });
}
