import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';

// create unmanaged layer
export default function(features, map) {
  var collection = features ? [features] : [];
  var featureLayerStore = new VectorSource({
    features: collection
  });
  var featureLayer = new VectorLayer({
    source: featureLayerStore,
    map: map
  });
  return {
    addFeature: function addFeature(feature) {
      featureLayerStore.addFeature(feature);
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
    clear: function clear() {
      featureLayerStore.clear();
    },
    clearAndAdd: function clearAndAdd(feature, style) {
      featureLayerStore.clear();
      featureLayer.setStyle(style);
      featureLayerStore.addFeature(feature);
    }
  }
}
