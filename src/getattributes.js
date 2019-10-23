import featureinfotemplates from './featureinfotemplates';
import replacer from '../src/utils/replacer';
import geom from './geom';

function createUrl(prefix, suffix, url) {
  const p = prefix || '';
  const s = suffix || '';
  return p + url + s;
}

const getContent = {
  name(feature, attribute, attributes, map) {
    let val = '';
    let title = '';
    if (feature.get(attribute.name)) {
      const featureValue = feature.get(attribute.name) === 0 ? feature.get(attribute.name).toString() : feature.get(attribute.name);
      if (featureValue) {
        val = feature.get(attribute.name);
        if (attribute.title) {
          title = `<b>${attribute.title}</b>`;
        }
        if (attribute.url) {
          if (feature.get(attribute.url)) {
            const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), feature.getProperties(), null, map));
            val = `<a href="${url}" target="_blank">${feature.get(attribute.name)}</a>`;
          }
        }
      }
    }
    const newElement = document.createElement('li');
    newElement.classList.add(attribute.cls);
    newElement.innerHTML = `${title}${val}`;
    return newElement;
  },
  url(feature, attribute, attributes, map) {
    let val = '';
    if (feature.get(attribute.url)) {
      const text = attribute.html || attribute.url;
      const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), attributes, null, map));
      val = `<a href="${url}" target="_blank">${text}</a>`;
    }
    const newElement = document.createElement('li');
    newElement.classList.add(attribute.cls);
    newElement.innerHTML = val;
    return newElement;
  },
  img(feature, attribute, attributes, map) {
    let val = '';
    if (feature.get(attribute.img)) {
      const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.img), attributes, null, map));
      const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
      val = `<div class="o-image-container"><img src="${url}">${attribution}</div>`;
    }
    const newElement = document.createElement('li');
    newElement.classList.add(attribute.cls);
    newElement.innerHTML = val;
    return newElement;
  },
  html(feature, attribute, attributes) {
    const val = replacer.replace(attribute.html, attributes, {
      helper: geom,
      helperArg: feature.getGeometry()
    });
    const newElement = document.createElement('li');
    newElement.classList.add(attribute.cls);
    newElement.innerHTML = val;
    return newElement;
  }
};

function customAttribute(feature, attribute, attributes, map) {
  if (getContent[Object.keys(attribute)[0]]) {
    return getContent[Object.keys(attribute)[0]](feature, attribute, attributes, map);
  }
  return false;
}

function getAttributes(feature, layer, map) {
  const featureinfoElement = document.createElement('div');
  featureinfoElement.classList.add('o-identify-content');
  const ulList = document.createElement('ul');
  featureinfoElement.appendChild(ulList);
  const attributes = feature.getProperties();
  const geometryName = feature.getGeometryName();
  delete attributes[geometryName];
  let content = '<div class="o-identify-content"><ul>';
  let attribute;
  let val;
  // If layer is configured with attributes
  if (layer.get('attributes')) {
    // If attributes is string then use template named with the string
    if (typeof layer.get('attributes') === 'string') {
      // Use attributes with the template
      const li = featureinfotemplates('attributes', attributes);
      if (li instanceof HTMLLIElement) {
        ulList.appendChild(li);
      }
    } else {
      for (let i = 0; i < layer.get('attributes').length; i += 1) {
        attribute = layer.get('attributes')[i];
        val = '';
        if (attribute.type !== 'hidden') {
          if (attribute.name) {
            val = getContent.name(feature, attribute, attributes, map);
          } else if (attribute.url) {
            val = getContent.url(feature, attribute, attributes, map);
          } else if (attribute.img) {
            val = getContent.img(feature, attribute, attributes, map);
          } else if (attribute.html) {
            val = getContent.html(feature, attribute, attributes, map);
          } else {
            val = customAttribute(feature, attribute, attributes, map);
          }
          if (val instanceof HTMLLIElement) {
            ulList.appendChild(val);
          }
        }
      }
      content = featureinfoElement;
    }
  } else {
    // Use attributes with the template
    const li = featureinfotemplates('default', attributes);
    if (li instanceof HTMLLIElement) {
      ulList.appendChild(li);
    }
  }
  content = featureinfoElement;
  return content;
}

export { getAttributes as default, addAttributeType, getContent };
