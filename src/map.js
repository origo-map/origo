import OlMap from 'ol/Map';
import OlView from 'ol/View';
import mapInteractions from './mapinteractions';

export default class Map extends OlMap {
  constructor(options = {}) {
    const interactions = mapInteractions({ target: options.target, mapInteractions: options.pageSettings && options.pageSettings.mapInteractions ? options.pageSettings.mapInteractions : {} });
    const mapOptions = { ...options, interactions, controls: [] };
    delete mapOptions.layers;

    const view = new OlView(options);
    super({ ...mapOptions, view });
  }
}
