import featureinfotemplates from './featureinfotemplates';

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
