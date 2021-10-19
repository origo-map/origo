import featureinfotemplates from './featureinfotemplates';
import replacer from './utils/replacer';
import isUrl from './utils/isurl';
import geom from './geom';

function createUrl(prefix, suffix, url) {
  const p = prefix || '';
  const s = suffix || '';
  return p + url + s;
}

function parseUrl(urlattr, feature, attribute, attributes, map, linktext) {
  let val = '';
  let url;
  if (urlattr) {
    url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(urlattr, attributes, null, map));
  } else if (isUrl(attribute.url)) {
    url = attribute.url;
  } else return '';
  const text = linktext || feature.get(attribute.name) || attribute.html || attribute.title || urlattr;
  const aTargetTitle = replacer.replace(attribute.targetTitle, attributes) || url;
  let aTarget = '_blank';
  let aCls = 'o-identify-link';
  if (attribute.target === 'modal') {
    aTarget = 'modal';
    aCls = 'o-identify-link-modal';
  } else if (attribute.target === 'modal-full') {
    aTarget = 'modal-full';
    aCls = 'o-identify-link-modal';
  } else if (attribute.target === '_self') {
    aTarget = '_self';
  } else if (attribute.target === '_top') {
    aTarget = '_top';
  } else if (attribute.target === '_parent') {
    aTarget = '_parent';
  }
  val = `<a class="${aCls}" target="${aTarget}" href="${url}" title="${aTargetTitle}">${text}</a>`;
  return val;
}

/**
 * Creates HTML containing clickable links from attribute content. Internal helper.
 * @param {any} feature The feature in question
 * @param {any} attribute The current attribute configuration to format
 * @param {any} attributes All other attribute configurations
 * @param {any} map The map
 */
function buildUrlContent(feature, attribute, attributes, map) {
  if (attribute.splitter) {
    let val = '';
    const urlArr = feature.get(attribute.url).split(attribute.splitter);
    let linkArr;
    if (attribute.linktext) {
      linkArr = feature.get(attribute.linktext).split(attribute.splitter);
    }
    if (urlArr[0] !== '') {
      urlArr.forEach((url, ix) => {
        // Assume linkText array is same size as links array.
        const linkText = linkArr ? linkArr[ix] : null;
        val += `<p>${parseUrl(url, feature, attribute, attributes, map, linkText)}</p>`;
      });
    }
    return val;
  }
  return parseUrl(feature.get(attribute.url), feature, attribute, attributes, map);
}

const getContent = {
  name(feature, attribute, attributes, map) {
    let val = '';
    let title = '';
    const featureValue = feature.get(attribute.name) === 0 ? feature.get(attribute.name).toString() : feature.get(attribute.name);
    if (featureValue) {
      val = featureValue;
      if (attribute.title) {
        title = `<b>${attribute.title}</b>`;
      }
      if (attribute.url) {
        val = buildUrlContent(feature, attribute, attributes, map);
      }
    }
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = `${title}${val}`;
    return newElement;
  },
  url(feature, attribute, attributes, map) {
    let val = '';
    // Use a common title for all links. If no splitter only one link is assumed and title is used as link text instead.
    if (attribute.title && attribute.splitter) {
      val = `<b>${attribute.title}</b>`;
    }
    val += buildUrlContent(feature, attribute, attributes, map);
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = val;
    return newElement;
  },
  img(feature, attribute, attributes, map) {
    let val = '';
    if (attribute.splitter) {
      const imgArr = feature.get(attribute.img).split(attribute.splitter);
      imgArr.forEach((img) => {
        const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(img, attributes, null, map));
        const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
        val += `<div class="o-image-container"><img src="${url}">${attribution}</div>`;
      });
    } else {
      const featGet = attribute.img ? feature.get(attribute.img) : feature.get(attribute.name);
      if (featGet) {
        const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.img), attributes, null, map));
        const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
        val = `<div class="o-image-container"><img src="${url}">${attribution}</div>`;
      }
    }
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = val;
    return newElement;
  },
  carousel(feature, attribute, attributes, map) {
    let val = '';
    let slides = '';
    if (attribute.splitter) {
      const imgArr = feature.get(attribute.carousel).split(attribute.splitter);
      if (imgArr[0] !== '') {
        imgArr.forEach((img) => {
          const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(img, attributes, null, map));
          const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
          slides += `<div class="o-image-content o-image-content${feature.ol_uid}"><img src="${url}">${attribution}</div>`;
        });
        val = `<div class="o-image-carousel o-image-carousel${feature.ol_uid}">${slides}</div>`;
      }
    } else {
      const featGet = attribute.carousel ? feature.get(attribute.carousel) : feature.get(attribute.name);
      if (featGet) {
        const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.carousel), attributes, null, map));
        const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
        val = `<div class="o-image-container"><img src="${url}">${attribution}</div>`;
      }
    }
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = val;
    return newElement;
  },
  html(feature, attribute, attributes, map) {
    const val = replacer.replace(attribute.html, attributes, {
      helper: geom,
      helperArg: feature.getGeometry()
    }, map);
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
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
  let content;
  let attribute;
  let val;
  const layerAttributes = layer.get('attributes');
  // If layer is configured with attributes
  if (layerAttributes) {
    // If attributes is string then use template named with the string
    if (typeof layerAttributes === 'string') {
      // Use attributes with the template
      const li = featureinfotemplates(layerAttributes, attributes);
      const templateList = document.createElement('ul');
      featureinfoElement.appendChild(templateList);
      templateList.innerHTML = li;
    } else {
      for (let i = 0; i < layerAttributes.length; i += 1) {
        attribute = layer.get('attributes')[i];
        val = '';
        if (attribute.template) {
          const li = featureinfotemplates(attribute.template, attributes);
          const templateList = document.createElement('ul');
          featureinfoElement.appendChild(templateList);
          templateList.innerHTML = li;
        } else if (attribute.type !== 'hidden') {
          if (attribute.name) {
            val = getContent.name(feature, attribute, attributes, map);
          } else if (attribute.url) {
            val = getContent.url(feature, attribute, attributes, map);
          } else if (attribute.img || attribute.type === 'image') {
            val = getContent.img(feature, attribute, attributes, map);
          } else if (attribute.html) {
            val = getContent.html(feature, attribute, attributes, map);
          } else if (attribute.carousel) {
            val = getContent.carousel(feature, attribute, attributes, map);
            ulList.classList.add('o-carousel-list');
          } else {
            val = customAttribute(feature, attribute, attributes, map);
          }
          if (val instanceof HTMLLIElement && val.innerHTML.length > 0) {
            ulList.appendChild(val);
          }
        }
      }
      content = featureinfoElement;
    }
  } else {
    // Use attributes with the template
    const li = featureinfotemplates('default', attributes);
    const templateList = document.createElement('ul');
    featureinfoElement.appendChild(templateList);
    templateList.innerHTML = li;
  }
  content = featureinfoElement;
  return content;
}

export { getAttributes as default, getContent };
