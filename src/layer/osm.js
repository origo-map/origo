import OSMSource from 'ol/source/OSM';
import tile from './tile';

export default function osm(layerOptions) {
  const osmDefault = {};
  const osmOptions = Object.assign(osmDefault, layerOptions);

  function createSource() {
    return new OSMSource();
  }

  const osmSource = createSource();
  return tile(osmOptions, osmSource);
}
