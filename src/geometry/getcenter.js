export default function getCenter(geometryIn, destination, axisOrientation, map) {
  const geometry = geometryIn.clone();

  if (destination && map) {
    geometry.transform(map.getView().getProjection(), destination);
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
      center = geometry.getPoint(0).getCoordinates();
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
