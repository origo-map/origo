import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import ClusterSource from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import { createStringXY } from 'ol/coordinate';
import { containsCoordinate } from 'ol/extent';
import { Fill, Stroke, Style, Text } from 'ol/style';

const textStyle = new Style({
  text: new Text({
    font: '12px sans-serif',
    textAlign: 'left',
    offsetX: 10,
    fill: new Fill({ color: 'rgba(0,0,0,1)' }),
    backgroundFill: new Fill({ color: 'rgba(255,255,255,0.85)' }),
    backgroundStroke: new Stroke({ color: 'rgba(0,0,0,0.3)', width: 1 }),
    padding: [2, 4, 2, 4]
  })
});

// The vertices of a geometry as [coordinate, hasZ]. The last vertex of a polygon ring is skipped since it is the same as the first.
function getVertices(geometry) {
  if (!geometry) return [];
  const type = geometry.getType();
  if (type === 'GeometryCollection') return geometry.getGeometries().flatMap(getVertices);
  const hasZ = geometry.getLayout().includes('Z');
  let coordinates;
  if (type === 'Point') {
    coordinates = [geometry.getCoordinates()];
  } else if (type === 'LineString' || type === 'MultiPoint') {
    coordinates = geometry.getCoordinates();
  } else if (type === 'MultiLineString') {
    coordinates = geometry.getCoordinates().flat();
  } else if (type === 'Polygon') {
    coordinates = geometry.getCoordinates().flatMap(ring => ring.slice(0, -1));
  } else if (type === 'MultiPolygon') {
    coordinates = geometry.getCoordinates().flat().flatMap(ring => ring.slice(0, -1));
  } else {
    coordinates = [];
  }
  return coordinates.map(coordinate => [coordinate, hasZ]);
}

/**
 * Whether the coordinates of a layer's vertices can be shown: vector layers with their own features. Not raster
 * or vector tile layers, and not clustered layers, whose source returns clusters instead of the real features.
 */
export function canShowCoordinates(layer) {
  if (!(layer instanceof VectorLayer || layer instanceof VectorImageLayer)) return false;
  const source = layer.getSource();
  return Boolean(source) && !(source instanceof ClusterSource) && typeof source.getFeatures === 'function';
}

/**
 * Shows the coordinates of the vertices in the added layers that have the property showCoordinates, as labels
 * in an unmanaged layer which is not part of the legend. The property is turned on and off from the layer menu in the legend.
 * The coordinates are formatted like the position control, in its selected projection, and follow it when the projection
 * is changed. Without a position control they are shown as x, y in the map projection.
 * Z is only shown when the geometry has z values, e.g. elevation in gpx.
 * Only vertices within the view get a label. Above maxLabels no labels are shown, so a large layer doesn't freeze
 * the map, until the user zooms in. A toast tells the user to zoom in if that is the case when the coordinates are turned on.
 */
export default function CoordinateLabels({
  map,
  position,
  logger,
  localization,
  maxLabels = 2000
}) {
  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'legend', targetKey: key });
  }

  const layers = new Set();
  const source = new VectorSource();
  const labelLayer = new VectorLayer({
    source,
    declutter: true,
    zIndex: 10,
    style(feature) {
      textStyle.getText().setText(feature.get('text'));
      return textStyle;
    }
  });
  let attached = false;

  function setAttached(attach) {
    if (attach === attached) return;
    attached = attach;
    labelLayer.setMap(attach ? map : null);
  }

  // Used without a position control, or before it is added: two decimals for meters, six for degrees
  const formatXY = createStringXY(map.getView().getProjection().getUnits() === 'degrees' ? 6 : 2);

  function getText(coordinates, hasZ) {
    const rows = [position?.formatCoordinate(coordinates) ?? formatXY(coordinates)];
    if (hasZ) rows.push(`Z: ${coordinates[2].toFixed(2)}`);
    return rows.join('\n');
  }

  // Draws the labels. Returns true if there are too many vertices in the view to show their labels.
  function drawLabels() {
    if (source.getFeatures().length > 0) source.clear();
    const view = map.getView();
    // isVisible also checks minZoom/maxZoom, so the labels are hidden when the layer is zoomed out of range
    const shown = [...layers].filter(layer => layer.get('showCoordinates') && layer.isVisible(view));
    if (shown.length === 0) {
      setAttached(false);
      return false;
    }
    const viewExtent = view.calculateExtent(map.getSize());
    const vertices = [];
    const tooMany = shown.some((layer) => layer.getSource().getFeatures().some((feature) => getVertices(feature.getGeometry()).some((vertex) => {
      if (!containsCoordinate(viewExtent, vertex[0])) return false;
      vertices.push(vertex);
      return vertices.length > maxLabels;
    })));
    if (tooMany || vertices.length === 0) {
      setAttached(false);
      return tooMany;
    }
    source.addFeatures(vertices.map(([coordinates, hasZ]) => new Feature({ geometry: new Point(coordinates), text: getText(coordinates, hasZ) })));
    setAttached(true);
    return false;
  }

  // Used as a listener, so it must not return false since OpenLayers then stops calling the other listeners of the event
  function update() {
    drawLabels();
  }

  function onChangeShowCoordinates(evt) {
    const tooMany = drawLabels();
    if (tooMany && evt.target.get('showCoordinates')) {
      logger.createToast({ status: 'info', title: localize('showCoordinates'), message: localize('coordinatesZoomIn') });
    }
  }

  function removeLayer(layer) {
    if (!layers.delete(layer)) return;
    layer.un('change:visible', update);
    layer.un('change:showCoordinates', onChangeShowCoordinates);
    layer.getSource().un('change', update);
    update();
  }

  map.getLayers().on('remove', evt => removeLayer(evt.element));
  map.on('moveend', update);
  if (position) {
    // Layers are added before the controls, so update when the position control is ready and when its projection is changed
    position.on('render', update);
    position.on('change:projection', update);
  }

  return {
    addLayer(layer) {
      if (layers.has(layer)) return;
      layers.add(layer);
      layer.on('change:visible', update);
      layer.on('change:showCoordinates', onChangeShowCoordinates);
      layer.getSource().on('change', update);
      update();
    }
  };
}
