import { getLength as olGetLength } from 'ol/sphere';
import round from '../utils/round';

export default function getLength(geometryIn, decimals, map) {
  let length = 0;
  const geomType = geometryIn.getType();
  if (geomType === 'LineString' || geomType === 'LinearRing' || geomType === 'MultiLineString') {
    length = olGetLength(geometryIn, { projection: map.getView().getProjection() });
  }
  if (decimals) {
    length = round(length, decimals);
  } else {
    length = round(length, '2');
  }
  return length;
}
