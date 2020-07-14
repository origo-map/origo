import defaultTemplate from './templates/featureinfotemplate';

const templates = {};
templates.default = defaultTemplate;

// #region EK-specific for featureinfo with FTL 
const textHtmlTemplate = function textHtmlTemplate(attributes) {
  return attributes.textHtml;
};
templates.textHtml = textHtmlTemplate;
//#endregion

function featureinfotemplates(template, attributes) {
  return templates[template](attributes);
}
export default featureinfotemplates;
