import TileLayer from 'ol/layer/Tile';

export default function tile(options, source) {
  const opt = options;
  opt.source = source;
  opt.extent = source.tileGrid.extent || undefined;
  return new TileLayer(opt);
}
