import defaultTemplate from './templates/featureinfotemplate';

const templates = {};
templates.default = defaultTemplate;

function featureinfotemplates(template, attributes) {
  return templates[template](attributes);
}
export default featureinfotemplates;
