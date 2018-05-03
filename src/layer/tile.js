import TileLayer from 'ol/layer/Tile';

export default function tile(options, source) {
  return new TileLayer(Object.assign({}, { source }, options));
}
