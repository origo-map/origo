import defaultTemplate from './templates/featureinfotemplate';

const templates = {};
templates.default = defaultTemplate;

function renameKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map(key => {
    const newKey = newKeys[key] || key;
    return { [newKey]: obj[key] };
  });
  return Object.assign({}, ...keyValues);
}

function featureinfotemplates(template, featureAttributes, attributeAlias) {
  const attributes = featureAttributes;
  if (attributes.url) {
    attributes.url = `<a href="${attributes.url}" target="_blank">${attributes.url}</a>`;
  }
  const renamedObj = renameKeys(attributes, attributeAlias);
  return templates[template](renamedObj);
}
export default featureinfotemplates;
