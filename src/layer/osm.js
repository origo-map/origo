import OSMSource from 'ol/source/OSM';
import $ from 'jquery';
import tile from './tile';

export default function osm(layerOptions) {
  const osmDefault = {};
  const osmOptions = $.extend(osmDefault, layerOptions);

  function createSource() {
    return new OSMSource();
  }

  const osmSource = createSource();
  return tile(osmOptions, osmSource);
}
