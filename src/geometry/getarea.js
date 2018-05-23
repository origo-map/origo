import round from '../utils/round';

export default function getArea(geometryIn, decimals) {
  let area = geometryIn.getArea ? geometryIn.getArea() : 0;
  if (decimals) {
    area = round(area, decimals);
  } else {
    area = round(area, '2');
  }
  return area;
}
