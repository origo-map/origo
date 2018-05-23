import TileLayer from 'ol/layer/tile';

export default function tile(options, source) {
  const opt = options;
  opt.source = source;
  return new TileLayer(opt);
}
