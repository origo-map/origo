import viewer from '../../viewer';
import layerCreator from '../../layercreator';

const offlineLayer = function offlineLayer() {
  function setOfflineSource(layerName, features) {
    const layer = viewer.getLayer(layerName);

    // Create a feature layer and get the source
    layer.set('type', 'OFFLINE');
    const options = layer.getProperties();
    options.type = 'FEATURE';
    options.features = features;
    options.style = options.styleName;
    const source = layerCreator(options).getSource();
    layer.setSource(source);
    return layer;
  }

  function setOnlineSource(layerName) {
    const layer = viewer.getLayer(layerName);

    // Create a layer with the online source and get the source
    layer.set('type', layer.get('onlineType'));
    const options = layer.getProperties();
    options.source = options.sourceName;
    options.style = options.styleName;
    const source = layerCreator(options).getSource();
    layer.setSource(source);
    return layer;
  }

  return {
    setOfflineSource,
    setOnlineSource
  };
};

export default offlineLayer;
