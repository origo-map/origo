import featureinfotemplates from './featureinfotemplates';
import replacer from './utils/replacer';
import isUrl from './utils/isurl';
import geom from './geom';
import attachmentclient from './utils/attachmentclient';
import relatedtables from './utils/relatedtables';

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
  } else {
    aTarget = attribute.target ? attribute.target : '_blank';
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
    let prefix = '';
    let suffix = '';
    const featureValue = feature.get(attribute.name) === 0 ? feature.get(attribute.name).toString() : feature.get(attribute.name);
    if (featureValue) {
      val = featureValue;
      if (attribute.title) {
        title = `<b>${attribute.title}</b>`;
      }
      if (attribute.prefix) {
        prefix = attribute.prefix;
      }
      if (attribute.suffix) {
        suffix = attribute.suffix;
      }
      if (attribute.formatDatetime) {
        const locale = 'locale' in attribute.formatDatetime ? attribute.formatDatetime.locale : 'default';
        const options = 'options' in attribute.formatDatetime ? attribute.formatDatetime.options : { dateStyle: 'full', timeStyle: 'long' };
        if (!Number.isNaN(Date.parse(featureValue))) {
          val = new Intl.DateTimeFormat(locale, options).format(Date.parse(featureValue));
        } else if (!Number.isNaN(new Date(featureValue).getTime())) {
          val = new Intl.DateTimeFormat(locale, options).format(new Date(featureValue));
        }
      }
      if (attribute.url) {
        val = buildUrlContent(feature, attribute, attributes, map);
      }
    }
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = `${title}${prefix}${val}${suffix}`;
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
  audio(feature, attribute, attributes, map) {
    let val = '';
    if (typeof (feature.get(attribute.audio)) !== 'undefined') {
      if (attribute.splitter) {
        const audioArr = feature.get(attribute.audio).split(attribute.splitter);
        audioArr.forEach((audio) => {
          const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(audio, attributes, null, map));
          const attribution = attribute.attribution ? `<div class="o-audio-attribution">${attribute.attribution}</div>` : '';
          val += `<div class="o-audio-container"><audio src="${url}" controls>Your browser does not support the audio tag.</audio>${attribution}</div>`;
        });
      } else {
        const featGet = attribute.audio ? feature.get(attribute.audio) : feature.get(attribute.name);
        if (featGet) {
          const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.audio), attributes, null, map));
          const attribution = attribute.attribution ? `<div class="o-audio-attribution">${attribute.attribution}</div>` : '';
          val = `<div class="o-audio-container"><audio src="${url}" controls>Your browser does not support the audio tag.</audio>${attribution}</div>`;
        }
      }
    }
    const newElement = document.createElement('li');
    if (typeof (attribute.cls) !== 'undefined') {
      newElement.classList.add(attribute.cls);
    }
    newElement.innerHTML = val;
    return newElement;
  },
  video(feature, attribute, attributes, map) {
    let val = '';
    if (typeof (feature.get(attribute.video)) !== 'undefined') {
      if (attribute.splitter) {
        const videoArr = feature.get(attribute.video).split(attribute.splitter);
        videoArr.forEach((video) => {
          const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(video, attributes, null, map));
          const attribution = attribute.attribution ? `<div class="o-video-attribution">${attribute.attribution}</div>` : '';
          val += `<div class="o-video-container"><video src="${url}" controls>Your browser does not support the video tag.</video>${attribution}</div>`;
        });
      } else {
        const featGet = attribute.video ? feature.get(attribute.video) : feature.get(attribute.name);
        if (featGet) {
          const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.video), attributes, null, map));
          const attribution = attribute.attribution ? `<div class="o-video-attribution">${attribute.attribution}</div>` : '';
          val = `<div class="o-video-container"><video src="${url}" controls>Your browser does not support the video tag.</video>${attribution}</div>`;
        }
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
/**
 * Internal helper that performs the actual content building
 * @param {any} feature
 * @param {any} layer
 * @param {any} map
 * @returns
 */
function getAttributesHelper(feature, layer, map) {
  const featureinfoElement = document.createElement('div');
  featureinfoElement.classList.add('o-identify-content');
  const ulList = document.createElement('ul');
  featureinfoElement.appendChild(ulList);
  // Create a shallow copy of properties present on the feature. Safe to manipulate keys but not values.
  const attributes = feature.getProperties();
  const geometryName = feature.getGeometryName();
  let attributeAlias = [];
  if (map) {
    attributeAlias = map.get('mapConfig').attributeAlias || [];
  }
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
      const li = featureinfotemplates.getFromTemplate(layerAttributes, attributes, attributeAlias, layer);
      const templateList = document.createElement('ul');
      featureinfoElement.appendChild(templateList);
      templateList.innerHTML = li;
    } else {
      // Assume layerAttributes is an array as it is not a string
      for (let i = 0; i < layerAttributes.length; i += 1) {
        attribute = layer.get('attributes')[i];
        val = '';
        if (attribute.template) {
          const li = featureinfotemplates.getFromTemplate(attribute.template, attributes, attributeAlias, layer);
          const templateList = document.createElement('ul');
          featureinfoElement.appendChild(templateList);
          templateList.innerHTML = li;
        } else {
          if (attribute.img || attribute.type === 'image') {
            val = getContent.img(feature, attribute, attributes, map);
          } else if (attribute.url) {
            val = getContent.url(feature, attribute, attributes, map);
          } else if (attribute.html) {
            val = getContent.html(feature, attribute, attributes, map);
          } else if (attribute.carousel) {
            val = getContent.carousel(feature, attribute, attributes, map);
            ulList.classList.add('o-carousel-list');
          } else if (attribute.name) {
            val = getContent.name(feature, attribute, attributes, map);
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
    const li = featureinfotemplates.getFromTemplate('default', attributes, attributeAlias, layer);
    const templateList = document.createElement('ul');
    featureinfoElement.appendChild(templateList);
    templateList.innerHTML = li;
  }
  content = featureinfoElement;
  return content;
}

/**
 * Creates the HTML visualization of the feature's attributes according to layer's attribute configuration.
 * Does not include async content (related tables, attachments)
 * @param {any} feature
 * @param {any} layer
 * @param {any} map
 * @returns
 */
function getAttributes(feature, layer, map) {
  // Add all hoisting attributes as actual properties on feature beacuse attributes configuration may try to use them
  // Should only happen if user calls from api and has configured async content but are using sync function to create content
  // Properties are removed when content is created because if we leave them they will exist permanently on the feature,
  // which will create a crash when editing.
  const attachments = layer.get('attachments');
  const attributesToRemove = [];
  if (attachments) {
    attachments.groups.forEach(a => {
      if (a.linkAttribute) {
        feature.set(a.linkAttribute, '');
        attributesToRemove.push(a.linkAttribute);
      }
      if (a.fileNameAttribute) {
        feature.set(a.fileNameAttribute, '');
        attributesToRemove.push(a.fileNameAttribute);
      }
    });
  }
  const relatedLayers = layer.get('relatedLayers');
  if (relatedLayers) {
    relatedLayers.forEach(currLayer => {
      if (currLayer.promoteAttribs) {
        currLayer.promoteAttribs.forEach(currAttrib => {
          feature.set(currAttrib.parentName, '');
          attributesToRemove.push(currAttrib.parentName);
        });
      }
    });
  }
  const content = getAttributesHelper(feature, layer, map);
  // remove the temporary attributes now that we're done with them
  attributesToRemove.forEach(currAttrToRemove => feature.unset(currAttrToRemove, true));
  return content;
}

/**
   * Creates temporary attributes on a feature in order for featureinfo to display attributes from related tables and
   * display attachments as links. Recursively adds attributes to related features in order to support multi level relations.
   * In order to do so, attributes are also added to the related features.
   * The hoistedAttributes array can be used to remove all attributes that have been added.
   * @param {any} parentLayer The layer that holds the feature
   * @param {any} parentFeature The feature to add attributes to
   * @param {any} hoistedAttributes An existing array that is populated with the added attributes.
   * @returns {boolean} True if layer has async content configured
   */
async function hoistRelatedAttributes(parentLayer, parentFeature, hoistedAttributes, layers) {
  // This function is async and called recursively, DO NOT USE forEach!!! (It won't work)

  let dirty = false;
  // Add attachments first but only if configured for attribute hoisting
  const attachmentsConf = parentLayer.get('attachments');
  if (attachmentsConf && attachmentsConf.groups.some(g => g.linkAttribute || g.fileNameAttribute)) {
    const ac = attachmentclient(parentLayer);
    const attachments = await ac.getAttachments(parentFeature);
    for (let i = 0; i < ac.getGroups().length; i += 1) {
      const currAttrib = ac.getGroups()[i];
      let val = '';
      let texts = '';
      if (attachments.has(currAttrib.name)) {
        const group = attachments.get(currAttrib.name);
        val = group.map(g => g.url).join(';');
        texts = group.map(g => g.filename).join(';');
      }
      if (currAttrib.linkAttribute) {
        parentFeature.set(currAttrib.linkAttribute, val);
        hoistedAttributes.push({ feature: parentFeature, attrib: currAttrib.linkAttribute });
        dirty = true;
      }
      if (currAttrib.fileNameAttribute) {
        hoistedAttributes.push({ feature: parentFeature, attrib: currAttrib.fileNameAttribute });
        parentFeature.set(currAttrib.fileNameAttribute, texts);
        dirty = true;
      }
    }
  }

  // Add related layers
  const relatedLayersConfig = relatedtables.getConfig(parentLayer);
  if (relatedLayersConfig) {
    for (let i = 0; i < relatedLayersConfig.length; i += 1) {
      const layerConfig = relatedLayersConfig[i];

      if (layerConfig.promoteAttribs) {
        // First recurse our children so we can propagate from n-level to top level
        // const childLayer = viewer.getLayer(layerConfig.layerName);
        const childLayer = layers.find(l => l.get('name') === layerConfig.layerName);
        // Function is recursice, we have to await
        // eslint-disable-next-line no-await-in-loop
        const childFeatures = await relatedtables.getChildFeatures(parentLayer, parentFeature, childLayer);
        for (let jx = 0; jx < childFeatures.length; jx += 1) {
          const childFeature = childFeatures[jx];
          // So here comes the infamous recursive call ...
          // Function is recursice, we have to await
          // eslint-disable-next-line no-await-in-loop
          await hoistRelatedAttributes(childLayer, childFeature, hoistedAttributes);
        }

        // Then actually hoist some related attributes
        for (let j = 0; j < layerConfig.promoteAttribs.length; j += 1) {
          const currAttribConf = layerConfig.promoteAttribs[j];
          const resarray = [];
          childFeatures.forEach(child => {
            // Collect the attributes from all children
            // Here one could imagine supporting more attribute types, but html is pretty simple and powerful
            if (currAttribConf.html) {
              const val = replacer.replace(currAttribConf.html, child.getProperties());
              resarray.push(val);
            }
          });
          // Then actually aggregate them. Its a two step operation so in the future we could support more aggregate functions, like min(), max() etc
          // and also to avoid appending manually and handle that pesky separator on last element.
          const sep = currAttribConf.separator ? currAttribConf.separator : '';
          const resaggregate = resarray.join(sep);
          parentFeature.set(currAttribConf.parentName, resaggregate);
          hoistedAttributes.push({ feature: parentFeature, attrib: currAttribConf.parentName });
          dirty = true;
        }
      }
    }
  }
  // Only returns true if top level is dirty. We don't build content for related objects.
  return dirty;
}

/**
 * Creates the HTML visualization of the feature's attributes according to layer's attribute configuration.
 * Includes async content (related tables, attachments)
 * @param {any} feature
 * @param {any} layer
 * @param {any} map
 */
async function getAttributesAsync(feature, layer, map) {
  const hoistedAttributes = [];
  const layers = map.getLayers().getArray();
  // Add the temporary attributes with their values
  await hoistRelatedAttributes(layer, feature, hoistedAttributes, layers);
  const content = getAttributesHelper(feature, layer, map);

  // Remove all temporary added attributes. They mess up saving edits as there are no such fields in db.
  hoistedAttributes.forEach(hoist => {
    hoist.feature.unset(hoist.attrib, true);
  });
  return content;
}

export default getAttributes;
export { getContent, featureinfotemplates, getAttributesAsync };
