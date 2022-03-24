import * as LoadingStrategy from 'ol/loadingstrategy';

const RELATED_TABLES_CONFIG_ROOT = 'relatedLayers';

/**
 * Get the related tables config for a layer. Is an abstraction to avoid callers to access the config directly on the layer.
 * @param {any} layer The parent layer to get config for
 * @returns The configuration for the layer
 */
function getConfig(layer) {
  return layer.get(RELATED_TABLES_CONFIG_ROOT);
}

/**
 * Gets the PK from the parent feature. The perception of PK may differ between differen child depending on their configuration.
 * @param {any} parentLayer The layer in which the parent resides
 * @param {any} childLayerName The child layer to read configuration for
 * @param {any} feature The actual parent feature to get PK from
 * @returns {any} An object representing the PK of the feature
 */
function getId(parentLayer, childLayerName, feature) {
  const conf = parentLayer.get(RELATED_TABLES_CONFIG_ROOT).find(item => item.layerName === childLayerName);
  if (conf.PK) {
    return feature.get(conf.PK);
  }
  if (conf.stripPK || conf.stripPK === undefined) {
    return feature.getId().split('.').pop();
  }
  return feature.getId();
}

/**
 * Fetches all related objects from one child layer for a given feature
 * @param {any} parentLayer The layer in which the parent feature resides
 * @param {any} feature The parent feature
 * @param {any} childLayer The child layer to get related objects from
 * @returns {any[]} An array of OL-features with the related objects
 */
async function getChildFeatures(parentLayer, feature, childLayer) {
  const childLayerName = childLayer.get('name');
  let parentPK = getId(parentLayer, childLayerName, feature);
  // For arbitrary PK fields PK may be null or even worse undefined.
  if (!parentPK) {
    return [];
  }
  const layerconf = parentLayer.get(RELATED_TABLES_CONFIG_ROOT).find(item => item.layerName === childLayerName);
  const FKField = layerconf.FK;

  // Must escape single quotes and enclose in single quotes if PK-column is string.
  // Unfortunately we can not know this from data. We could pick first fetaure if table is not empty.
  // Can't look in parent either, as fid is always string when fid includes layer name.
  if (layerconf.FKIsString) {
    parentPK = `'${parentPK.replace(/'/g, "''")}'`;
  }

  // Make sure the features are loaded if not using strategy "all"
  const childSource = childLayer.getSource();
  if (childSource.getOptions().loadingstrategy === LoadingStrategy.bbox) {
    await childSource.ensureLoaded(`${FKField} = ${parentPK}`);
  }

  // Compare ids as strings to avoid implicit (lint) or complicated type conversions depending on column types.
  // Problem is that if wfs layer name i stripped the id is a string, but in db it might be a number. We don't know that
  // and the FK may very well be a number in the db which would progate to the feature as number.
  const childFeatures = childLayer.getSource().getFeatures().filter((f) => f.get(FKField) && (parentPK.toString() === f.get(FKField).toString()));
  return childFeatures;
}

/**
 * Sets the PK from the parent as FK in the child object.
 * @param {any} parentLayer
 * @param {any} parentFeature
 * @param {any} childLayer
 * @param {any} childFeature The feature to update.
 */
function attachChild(parentLayer, parentFeature, childLayer, childFeature) {
  const childLayerName = childLayer.get('name');
  const PK = getId(parentLayer, childLayerName, parentFeature);
  const FKField = parentLayer.get(RELATED_TABLES_CONFIG_ROOT).find(item => item.layerName === childLayerName).FK;
  childFeature.set(FKField, PK);
}

export default {
  getChildFeatures,
  attachChild,
  getConfig
};
