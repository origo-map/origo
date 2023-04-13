import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import getColor from '../getcolor';

export default function defaultStyle() {
  let point;
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

  const styles = [];

  return function style(feature) {
    const styleScale = feature.get('styleScale') || 1;
    polygon.setZIndex(1);
    line.setZIndex(10);
    let length = 0;
    const width = 1 * styleScale;
    const radius = 5 * styleScale;
    const geom = feature.getGeometry().getType();
    switch (geom) {
      case 'Polygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(width);
        fill.setColor(getColor('blue', 0.8));
        styles[length] = strokedPolygon;
        length += 1;
        break;
      case 'MultiPolygon':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(width);
        fill.setColor(getColor('blue', 0.8));
        styles[length] = strokedPolygon;
        length += 1;
        break;
      case 'LineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(width);
        styles[length] = line;
        length += 1;
        break;
      case 'MultiLineString':
        stroke.setColor(getColor('red'));
        stroke.setWidth(width);
        styles[length] = line;
        length += 1;
        break;
      case 'Point':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(width);
        fill.setColor(getColor('blue', 0.8));
        point = new Style({
          image: new Circle({
            radius,
            fill,
            stroke
          }),
          zIndex: 50
        });
        styles[length] = point;
        length += 1;
        break;
      case 'MultiPoint':
        stroke.setColor(getColor('blue'));
        stroke.setWidth(width);
        fill.setColor(getColor('blue', 0.8));
        point = new Style({
          image: new Circle({
            radius,
            fill,
            stroke
          }),
          zIndex: 50
        });
        styles[length] = point;
        length += 1;
        break;
      default:
        stroke.setColor(getColor('blue'));
        stroke.setWidth(width);
        fill.setColor(getColor('blue', 0.8));
        styles[length] = strokedPolygon;
        length += 1;
        break;
    }
    styles.length = length;
    return styles;
  };
}
