import TileLayer from 'ol/layer/Tile';

export default function tile(options, source) {
  const opt = options;
  opt.source = source;
  return new TileLayer(opt);
}
