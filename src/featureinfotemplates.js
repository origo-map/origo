import defaultTemplate from './templates/featureinfotemplate';
import templateHelpers from './utils/templatehelpers';

const templates = {};
templates.default = defaultTemplate;

function addFeatureinfotemplate(name, fn) {
  templates[name] = fn;
  return true;
}

function renameKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map(key => {
    const newKey = newKeys[key] || key;
    return { [newKey]: obj[key] };
  });
  return Object.assign({}, ...keyValues);
}

function getFromTemplate(template, featureAttributes, attributeAlias) {
  const attributes = featureAttributes;
  if (attributes.url) {
    attributes.url = `<a href="${attributes.url}" target="_blank">${attributes.url}</a>`;
  }
  const renamedObj = renameKeys(attributes, attributeAlias);
  return templates[template](renamedObj);
}

export default { getFromTemplate, addFeatureinfotemplate, templateHelpers };
