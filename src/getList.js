import featureinfotemplates from './featureinfotemplates';

/**
 * Helper for handling jQuery objekt, to compile list.
 * @param {ol_feature_} feature
 */
export default function (feature) {
  const attributes = feature.getProperties();
  let content = '<div><ul>';
  let li = '';
  const geometryName = feature.getGeometryName();
  delete attributes[geometryName];
  li = featureinfotemplates('default', attributes);
  content += `${li}</ul></div>`;
  return content;
}
