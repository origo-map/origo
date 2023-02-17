import round from '../utils/round';

export default function getLength(geometryIn, decimals) {
  let length = geometryIn.getLength ? geometryIn.getLength() : 0;
  if (decimals) {
    length = round(length, decimals);
  } else {
    length = round(length, '2');
  }
  return length;
}
