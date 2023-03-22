import { getArea as olGetArea } from 'ol/sphere';
import round from '../utils/round';

export default function getArea(geometryIn, decimals, map) {
  let area = 0;
  const geomType = geometryIn.getType();
  if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
    area = olGetArea(geometryIn, { projection: map.getView().getProjection() });
  }
  if (decimals) {
    area = round(area, decimals);
  } else {
    area = round(area, '2');
  }
  return area;
}
