import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

// create unmanaged layer
export default function (features, map) {
  let sourceLayer;
  const collection = features ? [features] : [];
  const featureLayerStore = new VectorSource({
    features: collection
  });
  const featureLayer = new VectorLayer({
    source: featureLayerStore,
    map,
    zIndex:1
  });
  return {
    addFeature: function addFeature(feature) {
      featureLayerStore.addFeature(feature);
    },
    removeFeature: function removeFeature(feature) {
      featureLayerStore.removeFeature(feature);
    },
    setSourceLayer: function setSourceLayer(layer) {
      sourceLayer = layer;
    },
    getFeatures: function getFeatures() {
      return featureLayerStore.getFeatures();
    },
    getFeatureLayer: function getFeatureLayer() {
      return featureLayer;
    },
    getFeatureStore: function getFeatureStore() {
      return featureLayerStore;
    },
    getSourceLayer: function getSourceLayer() {
      if (sourceLayer) {
        return sourceLayer;
      }
      const layerName = featureLayerStore.getFeatures()[0].layerName;
      if (layerName) {
        featureLayer.set('name', layerName);
      } else {
        featureLayer.set('name', 'unmanaged');
      }
      return featureLayer;
    },
    clear: function clear() {
      featureLayerStore.clear();
    },
    clearAndAdd: function clearAndAdd(feature, style) {
      featureLayerStore.clear();
      featureLayer.setStyle(style);
      featureLayerStore.addFeature(feature);
    },
    setStyle: function setStyle(style) {
      featureLayer.setStyle(style);
    }
  };
}
