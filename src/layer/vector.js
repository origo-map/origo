import ImageLayer from 'ol/layer/image';
import VectorLayer from 'ol/layer/vector';
import VectorTileLayer from 'ol/layer/vectortile';
import ClusterSource from 'ol/source/cluster';
import ImageVectorSource from 'ol/source/imagevector';

import style from '../style';
import viewer from '../viewer';

export default function vector(opt, src) {
  const options = opt;
  const source = src;
  const map = viewer.getMap();
  const view = map.getView();
  const distance = 60;
  const maxZoom = view.getResolutions().length - 1;
  let vectorLayer;
  switch (options.layerType) {
    case 'vector':
    {
      options.source = source;
      options.style = style().createStyle(options.style);
      vectorLayer = new VectorLayer(options);
      break;
    }
    case 'cluster':
    {
      options.clusterOptions = options.clusterOptions || {};
      if (options.type === 'WFS' || options.type === 'AGS_FEATURE') {
        source.clusterOptions = viewer.getMapSource()[options.sourceName].clusterOptions || {};
      } else {
        source.clusterOptions = {};
      }
      const clusterDistance = options.clusterOptions.clusterDistance || source.clusterOptions.clusterDistance || viewer.getClusterOptions().clusterDistance || distance;
      const clusterMaxZoom = options.clusterOptions.clusterMaxZoom || source.clusterOptions.clusterMaxZoom || viewer.getClusterOptions().clusterMaxZoom || viewer.getResolutions().length - 1;
      const clusterInitialDistance = viewer.getSettings().zoom > clusterMaxZoom ? 0 : clusterDistance;
      options.source = new ClusterSource({
        attributions: options.attribution,
        source,
        distance: clusterInitialDistance
      });
      options.source.setProperties({
        clusterDistance,
        clusterMaxZoom
      });
      options.style = style().createStyle(options.style, options.clusterStyle);
      vectorLayer = new VectorLayer(options);
      map.on('movestart', onMoveStart);


      break;
    }
    case 'image':
    {
      options.source = new ImageVectorSource({
        source,
        style: style().createStyle(options.style)
      });
      vectorLayer = new ImageLayer(options);
      break;
    }
    case 'vectortile':
    {
      options.source = source;
      options.style = style().createStyle(options.style);
      vectorLayer = new VectorTileLayer(options);
      break;
    }
    default:
    {
      break;
    }
  }

  function onMoveStart(evt) {
    const mapZoom = view.getZoomForResolution(evt.frameState.viewState.resolution);
    const clusterDistance = options.source.getProperties().clusterDistance || distance;
    const clusterMaxZoom = options.source.getProperties().clusterMaxZoom || maxZoom;
    map.once('moveend', () => {
      const currentZoom = parseInt(view.getZoom(), 10);
      if (currentZoom !== mapZoom) {
        if (currentZoom >= clusterMaxZoom) {
          options.source.setDistance(0);
        } else if (currentZoom < clusterMaxZoom) {
          options.source.setDistance(clusterDistance);
        }
      }
    });
  }
  return vectorLayer;
}
