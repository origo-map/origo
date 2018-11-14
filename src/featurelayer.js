import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';

// create unmanaged layer
export default function (features, map) {
  let sourceLayer;
  const collection = features ? [features] : [];
  const featureLayerStore = new VectorSource({
    features: collection
  });
  const featureLayer = new VectorLayer({
    source: featureLayerStore,
    map
  });
  return {
    addFeature: function addFeature(feature) {
      featureLayerStore.addFeature(feature);
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
      return sourceLayer;
    },
    clear: function clear() {
      featureLayerStore.clear();
    },
    clearAndAdd: function clearAndAdd(feature, style) {
      featureLayerStore.clear();
      featureLayer.setStyle(style);
      featureLayerStore.addFeature(feature);
    }
  };
}
