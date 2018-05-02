import TileLayer from 'ol/layer/Tile';

export default function tile(opt, source) {
  const options = {};
  options.source = source;
  return new TileLayer(options);
}
