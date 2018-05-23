import Circle from 'ol/style/circle';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';
import Style from 'ol/style/style';
import getColor from '../getcolor';

export default function defaultStyle() {
  const fill = new Fill({
    color: ''
  });
  const stroke = new Stroke({
    color: '',
    width: 0.1,
    lineCap: 'square',
    lineJoin: 'round'
  });
  const polygon = new Style({
    fill,
    zIndex: 1
  });
  const strokedPolygon = new Style({
    fill,
    stroke,
    zIndex: 2
  });
  const line = new Style({
    stroke,
    zIndex: 10
  });
  const point = new Style({
    image: new Circle({
      radius: 5,
      fill,
      stroke
    }),
    zIndex: 50
  });
  const styles = [];

  return function style(feature) {
    polygon.setZIndex(1);
    line.setZIndex(10);
    let length = 0;
    const geom = feature.getGeometry().getType();
    switch (geom) {
      case 'Polygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length += 1] = strokedPolygon;
        break;
      case 'MultiPolygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length += 1] = strokedPolygon;
        break;
      case 'LineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(1);
        styles[length += 1] = line;
        break;
      case 'MultiLineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(1);
        styles[length += 1] = line;
        break;
      case 'Point':
        stroke.setColor(getColor('yellow'));
        stroke.setWidth(1);
        fill.setColor(getColor('yellow', 0.8));
        styles[length += 1] = point;
        break;
      case 'MultiPoint':
        stroke.setColor(getColor('yellow'));
        stroke.setWidth(1);
        fill.setColor(getColor('yellow', 0.8));
        styles[length += 1] = point;
        break;
      default:
        stroke.setColor(getColor('blue'));
        stroke.setWidth(1);
        fill.setColor(getColor('blue', 0.8));
        styles[length += 1] = strokedPolygon;
        break;
    }
    styles.length = length;
    return styles;
  };
}
