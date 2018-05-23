import featureinfotemplates from './featureinfotemplates';
import replacer from '../src/utils/replacer';
import geom from './geom';

function filterObject(obj, excludedKeys) {
  const result = {};
  obj.forEach((value, i) => {
    if (excludedKeys.indexOf(i) === -1) {
      result[i] = obj[i];
    }
  });
  return result;
}

function createUrl(prefix, suffix, url) {
  const p = prefix || '';
  const s = suffix || '';
  return p + url + s;
}

export default function(feature, layer) {
  let content = '<div><ul>';
  let attribute;
  let li = '';
  let title;
  let val;
  // If layer is configured with attributes
  if (layer.get('attributes')) {
    // If attributes is string then use template named with the string
    if (typeof layer.get('attributes') === 'string') {
      // Use attributes with the template
      li = featureinfotemplates(layer.get('attributes'), feature.getProperties());
    } else {
      for (let i = 0; i < layer.get('attributes').length; i += 1) {
        attribute = layer.get('attributes')[i];
        title = '';
        val = '';
        if (attribute.name) {
          if (feature.get(attribute.name)) {
            val = feature.get(attribute.name);
            if (attribute.title) {
              title = `<b>${attribute.title}</b>`;
            }
            if (attribute.url) {
              if (feature.get(attribute.url)) {
                const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), feature.getProperties()));
                val = `<a href="${url}" target="_blank">
                  ${feature.get(attribute.name)}
                  </a>`;
              }
            }
          }
        } else if (attribute.url) {
          if (feature.get(attribute.url)) {
            const text = attribute.html || attribute.url;
            const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), feature.getProperties()));
            val = `<a href="${url}" target="_blank">
              ${text}
              </a>`;
          }
        } else if (attribute.img) {
          if (feature.get(attribute.img)) {
            const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.img), feature.getProperties()));
            const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
            val = `<div class="o-image-container">
              <img src="${url}">${attribution}
              </div>`;
          }
        } else if (attribute.html) {
          val = replacer.replace(attribute.html, feature.getProperties(), {
            helper: geom,
            helperArg: feature.getGeometry()
          });
        }

        const cls = ` class="${attribute.cls}" ` || '';

        li += `<li${cls}>${title}${val}</li>`;
      }
    }
  } else {
    // Clean feature attributes from non-wanted properties
    const attributes = filterObject(feature.getProperties(), ['FID_', 'geometry']);
    // Use attributes with the template
    li = featureinfotemplates('default', attributes);
  }
  content += `${li}</ul></div>`;
  return content;
}
