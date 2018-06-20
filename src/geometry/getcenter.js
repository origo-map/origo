import viewer from '../viewer';

export default function getCenter(geometryIn, destination, axisOrientation) {
  const geometry = geometryIn.clone();

  if (destination) {
    geometry.transform(viewer.getMap().getView().getProjection(), destination);
  }


  const type = geometry.getType();
  let center;
  switch (type) {
    case 'Polygon':
      center = geometry.getInteriorPoint().getCoordinates();
      break;
    case 'MultiPolygon':
      center = geometry.getInteriorPoints().getCoordinates()[0];
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
      center = undefined;
  }

  if (axisOrientation) {
    if (axisOrientation === 'reverse') {
      center.reverse();
    }
  }

  return center;
}
