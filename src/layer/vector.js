import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorImageLayer from 'ol/layer/VectorImage';
import ClusterSource from 'ol/source/Cluster';
import Style from '../style';

export default function vector(opt, src, viewer) {
  const options = opt;
  const source = src;
  const distance = 60;
  const map = viewer.getMap();
  const view = map.getView();
  let vectorLayer;
  switch (options.layerType) {
    case 'vector':
    {
      options.source = source;
      options.style = Style.createStyle({
        style: options.style,
        viewer
      });
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
      const clusterInitialDistance = viewer.getInitialZoom() > clusterMaxZoom ? 0 : clusterDistance;
      options.source = new ClusterSource({
        attributions: options.attribution,
        source,
        distance: clusterInitialDistance
      });
      options.source.setProperties({
        clusterDistance,
        clusterMaxZoom
      });
      options.style = Style.createStyle({
        style: options.style,
        clusterStyleName: options.clusterStyle,
        viewer
      });
      vectorLayer = new VectorLayer(options);
      map.on('movestart', (evt) => {
        const mapZoom = view.getZoomForResolution(evt.frameState.viewState.resolution);
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
      });
      break;
    }
    case 'image':
    {
      options.source = source;
      options.style = Style.createStyle({
        style: options.style,
        viewer
      });
      vectorLayer = new VectorImageLayer(options);
      break;
    }
    case 'vectortile':
    {
      options.source = source;
      options.declutter = true;
      const styleSettings = viewer.getStyle(options.styleName);
      const styleSetting = styleSettings[0][0];
      const styleOptions = {
        style: options.styleName,
        viewer,
        file: styleSetting.custom.file,
        source: styleSetting.custom.source,
        type: styleSetting.custom.type,
        name: styleSetting.custom.name
      };
      if ('custom' in styleSetting) {
        vectorLayer = new VectorTileLayer(Object.assign(options, { style: undefined }));
        const layerStyle = Style.createStyle(Object.assign(styleOptions, { layer: vectorLayer }));
        if (layerStyle) {
          vectorLayer.setStyle(layerStyle);
        }
      } else {
        options.style = Style.createStyle(styleOptions);
        vectorLayer = new VectorTileLayer(options);
      }
      break;
    }
    default:
    {
      break;
    }
  }
  return vectorLayer;
}
