import generateUUID from '../../utils/generateuuid';

function verifyFeatureIds(features) {
  if (features[0]) {
    if (features[0].getId() === undefined) {
      features.forEach((feature) => {
        feature.setId(generateUUID());
      });
    }
  }

  return features;
}

export default verifyFeatureIds;
