import Overlay from 'ol/Overlay';
import BaseTileLayer from 'ol/layer/BaseTile';
import ImageLayer from 'ol/layer/Image';
import OGlide from './oglide';
import { Component, Modal } from './ui';
import Popup from './popup';
import sidebar from './sidebar';
import maputils from './maputils';
import featurelayer from './featurelayer';
import Style from './style';
import StyleTypes from './style/styletypes';
import getFeatureInfo from './getfeatureinfo';
import replacer from './utils/replacer';
import SelectedItem from './models/SelectedItem';
import attachmentclient from './utils/attachmentclient';
import getAttributes, { getContent, featureinfotemplates } from './getattributes';
import relatedtables from './utils/relatedtables';

const styleTypes = StyleTypes();

const Featureinfo = function Featureinfo(options = {}) {
  const {
    clickEvent = 'click',
    clusterFeatureinfoLevel = 1,
    hitTolerance = 0,
    pinning = true,
    pinsStyle: pinStyleOptions = styleTypes.getStyle('pin'),
    savedPin: savedPinOptions,
    savedSelection,
    selectionStyles: selectionStylesOptions,
    autoplay = false
  } = options;

  let selectionLayer;
  let identifyTarget;
  let overlay;
  let items;
  let popup;
  let viewer;
  let selectionManager;
  let textHtmlHandler;
  /** The featureinfo component itself */
  let component;

  const pinStyle = Style.createStyleRule(pinStyleOptions)[0];
  const selectionStyles = selectionStylesOptions ? Style.createGeometryStyle(selectionStylesOptions) : Style.createEditStyle();
  let savedPin = savedPinOptions ? maputils.createPointFeature(savedPinOptions, pinStyle) : undefined;
  const savedFeature = savedPin || savedSelection || undefined;
  const uiOutput = 'infowindow' in options ? options.infowindow : 'overlay';

  /** Dispatches a clearselectionevent. Should be emitted when window is closed or cleared but not when featureinfo is closed as a result of tool change. */
  const dispatchClearSelection = function dispatchClearSelection() {
    component.dispatch('clearselection', null);
  };

  /** Eventhandler for Selectionmanager's clear event.  */
  function onSelectionManagerClear() {
    // Not much do to, just dispatch event as our own.
    dispatchClearSelection();
  }

  /**
    * Clears selection in all possible infowindows (overlay, sidebar and infoWindow) and closes the windows
    * @param {any} supressEvent Set to true when closing as a result of tool change to supress sending clearselection event
    */
  const clear = function clear(supressEvent) {
    selectionLayer.clear();
    // Sidebar is static and always present.
    sidebar.setVisibility(false);
    // check needed for when sidebar or overlay are selected.
    if (overlay) {
      viewer.removeOverlays(overlay);
    }
    if (selectionManager) {
      // clearSelection will fire an cleared event, but we don't want our handler to emit a clear event as we are the one closing,
      // so we stop listening for a while.
      selectionManager.un('cleared', onSelectionManagerClear);
      // This actually closes infowindow as infowindow closes automatically when selection is empty.
      selectionManager.clearSelection();
      selectionManager.on('cleared', onSelectionManagerClear);
    }
    if (!supressEvent) {
      dispatchClearSelection();
    }
  };

  /** Callback called from overlay and sidebar when they are closed by their close buttons */
  function onInfoClosed() {
    clear(false);
  }

  function setUIoutput(v) {
    switch (uiOutput) {
      case 'infowindow':
        identifyTarget = 'infowindow';
        break;

      case 'sidebar':
        sidebar.init(v, { closeCb: onInfoClosed });
        identifyTarget = 'sidebar';
        break;

      default:
        identifyTarget = 'overlay';
        break;
    }
  }

  // FIXME: overly complex. Don't think layer can be a string anymore
  const getTitle = function getTitle(item) {
    let featureinfoTitle;
    let title;
    let layer;
    if (item.layer) {
      if (typeof item.layer === 'string') {
        // bcuz in getfeatureinfo -> getFeaturesFromRemote only name of the layer is set on the object! (old version before using SelectedItems class)
        layer = viewer.getLayer(item.layer);
      } else {
        layer = viewer.getLayer(item.layer.get('name'));
      }
    }
    // This is very strange: layer above is only a string, could not possibly have method.
    if (layer) {
      featureinfoTitle = layer.getProperties().featureinfoTitle;
    }
    if (featureinfoTitle) {
      const featureProps = item.feature.getProperties();
      title = replacer.replace(featureinfoTitle, featureProps);
      if (!title) {
        if (item instanceof SelectedItem) {
          title = item.getLayer().get('title') ? item.getLayer().get('title') : item.getLayer().get('name');
        } else {
          title = item.title ? item.title : item.name;
        }
      }
    } else if (item instanceof SelectedItem) {
      title = item.getLayer().get('title') ? item.getLayer().get('title') : item.getLayer().get('name');
    } else {
      title = item.title ? item.title : item.name;
    }
    return title;
  };

  /**
 * Dispatches an "official" api event.
 * @param {SelectedItem} item The currently selected item
 */
  const dispatchNewSelection = function dispatchNewSelection(item) {
    // Make sure it actually is a SelectedItem. At least Search can call render() without creating proper selectedItems when
    // search result is remote.
    if (item instanceof SelectedItem) {
      component.dispatch('changeselection', item);
    }
  };

  const dispatchToggleFeatureEvent = function dispatchToggleFeatureEvent(currentItem) {
    const toggleFeatureinfo = new CustomEvent('toggleFeatureinfo', {
      detail: {
        type: 'toggleFeatureinfo',
        currentItem
      }
    });
    // FIXME: should be deprecated
    document.dispatchEvent(toggleFeatureinfo);
    // Also emit an API-event
    dispatchNewSelection(currentItem);
  };

  // TODO: direct access to feature and layer should be converted to getFeature and getLayer methods on currentItem
  // Must take into consideration that search can send an item that is not a SelecedItem
  const callback = function callback(evt) {
    const currentItemIndex = evt.item.index;
    if (currentItemIndex !== null) {
      const currentItem = items[currentItemIndex];
      const clone = currentItem.feature.clone();
      clone.setId(currentItem.feature.getId());
      // FIXME: Should be taken from layer name
      clone.layerName = currentItem.name;
      selectionLayer.clearAndAdd(
        clone,
        selectionStyles[currentItem.feature.getGeometry().getType()]
      );
      const title = getTitle(currentItem);
      selectionLayer.setSourceLayer(currentItem.layer);
      if (identifyTarget === 'overlay') {
        popup.setTitle(title);
      } else if (identifyTarget === 'sidebar') {
        sidebar.setTitle(title);
      }

      dispatchToggleFeatureEvent(currentItem);
    }
  };

  const initCarousel = function initCarousel(id) {
    const { length } = Array.from(document.querySelectorAll('.o-identify-content'));
    if (!document.querySelector('.glide-content') && length > 1) {
      OGlide({
        id,
        callback
      });
    }
  };

  // FIXME: should there be anything done?
  const callbackImage = function callbackImage(evt) {
    const currentItemIndex = evt.item.index;
    if (currentItemIndex !== null) {
      // should there be anything done?
    }
  };

  const initImageCarousel = function initImageCarousel(id, oClass, carouselId, targetElement) {
    const carousel = document.getElementsByClassName(id.substring(1));
    const { length } = Array.from(carousel[0].querySelectorAll('div.o-image-content > img'));
    if (!document.querySelector(`.glide-image${carouselId}`) && length > 1) {
      OGlide({
        id,
        callback: callbackImage,
        oClass,
        glideClass: `glide-image${carouselId}`,
        autoplay,
        targetElement
      });
    }
  };

  function getSelectionLayer() {
    return selectionLayer.getFeatureLayer();
  }

  // FIXME: Can't handle selectionmanager (infowindow)
  function getSelection() {
    const selection = {};
    const firstFeature = selectionLayer.getFeatures()[0];
    if (firstFeature) {
      selection.geometryType = firstFeature.getGeometry().getType();
      selection.coordinates = firstFeature.getGeometry().getCoordinates();
      selection.id = firstFeature.getId() != null ? firstFeature.getId() : firstFeature.ol_uid;
      // FIXME: typeof layer can not be string, and if it is it would probably not have a property called type that is set to WFS
      selection.type = typeof selectionLayer.getSourceLayer() === 'string' ? selectionLayer.getFeatureLayer().type : selectionLayer.getSourceLayer().get('type');
      if (selection.type === 'WFS') {
        const idSuffix = selection.id.substring(selection.id.lastIndexOf('.') + 1, selection.id.length);
        selection.id = `${selectionLayer.getSourceLayer().get('name')}.${idSuffix}`;
      }
      if (selection.type !== 'WFS') {
        // FIXME: typeof layer can not be string
        const name = typeof selectionLayer.getSourceLayer() === 'string' ? selectionLayer.getSourceLayer() : selectionLayer.getSourceLayer().get('name');
        const id = firstFeature.getId() || selection.id;
        selection.id = `${name}.${id}`;
      }
    }
    return selection;
  }

  const getPin = function getPin() {
    return savedPin;
  };

  const getHitTolerance = function getHitTolerance() {
    return hitTolerance;
  };

  const addAttributeType = function addAttributeType(attributeType, fn) {
    getContent[attributeType] = fn;
    return getContent;
  };

  const addLinkListener = function addLinkListener(el) {
    // Check if element already has a listener
    if (el && !el.hasAttribute('onClickModal')) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targ = e.target;
        let modalStyle = '';
        switch (targ.target) {
          case 'modal-full':
          {
            modalStyle = 'max-width:unset;width:98%;height:98%;resize:both;overflow:auto;display:flex;flex-flow:column;';
            break;
          }
          default:
          {
            modalStyle = 'resize:both;overflow:auto;display:flex;flex-flow:column;';
            break;
          }
        }
        Modal({
          title: targ.title,
          content: `<iframe src="${targ.href}" class=""style="width:100%;height:99%"></iframe>`,
          target: viewer.getId(),
          style: modalStyle,
          newTabUrl: targ.href
        });
      });
      el.setAttribute('onClickModal', 'true');
    }
  };

  const addTextHtmlHandler = function addTextHtmlHandler(func) {
    textHtmlHandler = func;
  };

  /**
   * Creates temporary attributes on a feature in order for featureinfo to display attributes from related tables and
   * display attachments as links. Recursively adds attributes to related features in order to support multi level relations.
   * In order to do so, attributes are also added to the related features.
   * The hoistedAttributes array can be used to remove all attributes that have been added.
   * @param {any} parentLayer The layer that holds the feature
   * @param {any} parentFeature The feature to add attributes to
   * @param {any} hoistedAttributes An existing array that is populated with the added attributes.
   */
  async function hoistRelatedAttributes(parentLayer, parentFeature, hoistedAttributes) {
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
          const childLayer = viewer.getLayer(layerConfig.layerName);
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
    // Only returns if top level is dirty. We don't build content for related objects.
    return dirty;
  }

  /**
   * Adds content from related tables and attachments.
   * @param {any} item
   * @param {any} hoistedAttributes
   */
  async function addRelatedContent(item) {
    const hoistedAttributes = [];
    const updated = await hoistRelatedAttributes(item.getLayer(), item.getFeature(), hoistedAttributes);
    if (updated) {
      // Update content as the pseudo attributes have changed
      // Ideally this should have been made before SelectedItem was created, but that changes so much
      // in the code flow as the getAttachment is async-ish
      item.setContent(getAttributes(item.getFeature(), item.getLayer(), viewer.getMap()));
    }
    // Remove all temporary added attributes. They mess up saving edits as there are no such fields in db.
    hoistedAttributes.forEach(hoist => {
      hoist.feature.unset(hoist.attrib, true);
    });
  }

  /**
   * Internal helper that performs the actual rendering
   * @param {any} identifyItems
   * @param {any} target
   * @param {any} coordinate
   * @param {bool} ignorePan true if overlay should not be panned into view
   */
  const doRender = function doRender(identifyItems, target, coordinate, ignorePan) {
    const map = viewer.getMap();

    items = identifyItems;
    clear(false);
    // FIXME: variable is overwritten in next row
    let content = items.map((i) => i.content).join('');
    content = '<div id="o-identify"><div id="o-identify-carousel" class="flex"></div></div>';
    switch (target) {
      case 'overlay':
      {
        popup = Popup(`#${viewer.getId()}`, { closeCb: onInfoClosed });
        popup.setContent({
          content,
          title: getTitle(items[0])
        });
        const contentDiv = document.getElementById('o-identify-carousel');
        const carouselIds = [];
        items.forEach((item) => {
          carouselIds.push(item.feature.ol_uid);
          if (item.content instanceof Element) {
            contentDiv.appendChild(item.content);
          } else {
            contentDiv.innerHTML = item.content;
          }
        });
        popup.setVisibility(true);
        initCarousel('#o-identify-carousel');
        const firstFeature = items[0].feature;
        const geometry = firstFeature.getGeometry();
        const origostyle = firstFeature.get('origostyle');
        const clone = firstFeature.clone();
        clone.setId(firstFeature.getId());
        // FIXME: should be layer name, not feature name
        clone.layerName = firstFeature.name;
        selectionLayer.clearAndAdd(
          clone,
          selectionStyles[geometry.getType()]
        );
        selectionLayer.setSourceLayer(items[0].layer);
        const coord = geometry.getType() === 'Point' ? geometry.getCoordinates() : coordinate;
        carouselIds.forEach((carouselId) => {
          let targetElement;
          const elements = document.getElementsByClassName(`o-image-carousel${carouselId}`);
          Array.from(elements).forEach(element => {
            if (!element.closest('.glide__slide--clone')) {
              targetElement = element;
            }
          });
          const imageCarouselEl = document.getElementsByClassName(`o-image-carousel${carouselId}`);
          if (imageCarouselEl.length > 0) {
            initImageCarousel(`#o-image-carousel${carouselId}`, `.o-image-content${carouselId}`, carouselId, targetElement);
          }
        });
        const popupEl = popup.getEl();
        const popupHeight = document.querySelector('.o-popup').offsetHeight + 10;
        popupEl.style.height = `${popupHeight}px`;
        const overlayOptions = { element: popupEl, positioning: 'bottom-center' };
        if (!ignorePan) {
          overlayOptions.autoPan = {
            margin: 55,
            animation: {
              duration: 500
            }
          };
        }
        if (items[0].layer && items[0].layer.get('styleName')) {
          const styleName = items[0].layer.get('styleName');
          const itemStyle = viewer.getStyle(styleName);
          if (itemStyle && itemStyle[0] && itemStyle[0][0] && itemStyle[0][0].overlayOptions) {
            Object.assign(overlayOptions, itemStyle[0][0].overlayOptions);
          }
        }
        if (origostyle && origostyle.overlayOptions) {
          Object.assign(overlayOptions, origostyle.overlayOptions);
        }
        if (overlayOptions.positioning) {
          popupEl.classList.add(`popup-${overlayOptions.positioning}`);
        }
        overlay = new Overlay(overlayOptions);
        map.addOverlay(overlay);
        overlay.setPosition(coord);
        break;
      }
      case 'sidebar':
      {
        sidebar.setContent({
          content,
          title: getTitle(items[0])
        });
        const contentDiv = document.getElementById('o-identify-carousel');
        items.forEach((item) => {
          if (item.content instanceof Element) {
            contentDiv.appendChild(item.content);
          } else {
            contentDiv.innerHTML = item.content;
          }
        });
        sidebar.setVisibility(true);
        const firstFeature = items[0].feature;
        const geometry = firstFeature.getGeometry();
        const clone = firstFeature.clone();
        clone.setId(firstFeature.getId());
        // FIXME: should be layer name
        clone.layerName = firstFeature.name;
        selectionLayer.clearAndAdd(
          clone,
          selectionStyles[geometry.getType()]
        );
        selectionLayer.setSourceLayer(items[0].layer);
        initCarousel('#o-identify-carousel');
        break;
      }
      case 'infowindow':
      {
        if (items.length === 1) {
          selectionManager.addOrHighlightItem(items[0]);
        } else if (items.length > 1) {
          selectionManager.addItems(items);
        }
        break;
      }
      default:
      {
        break;
      }
    }

    const modalLinks = document.getElementsByClassName('o-identify-link-modal');
    for (let i = 0; i < modalLinks.length; i += 1) {
      addLinkListener(modalLinks[i]);
    }
    // Don't send event for infowindow. Infowindow will send an event that triggers sending the event later.
    if (target === 'overlay' || target === 'sidebar') {
      dispatchToggleFeatureEvent(items[0]);
    }
  };
  /**
   * Renders the feature info window. Consider using showInfo instead if calling using api.
   * @param {any} identifyItems Array of SelectedItems
   * @param {any} target Name of infoWindow type
   * @param {any} coordinate Coordinate where to show pop up.
   * @param {any} opts Additional options. Supported options are : ignorePan, disable auto pan to popup overlay.
   */
  const render = function render(identifyItems, target, coordinate, opts = {}) {
    // Append attachments (if any) to the SelectedItems
    const requests = [];
    identifyItems.forEach(currItem => {
      // At least search can call render without SelectedItem as Items, it just sends an object with the least possible fields render uses
      // so we need to exclude those from related tables handling, as we know nothing about them
      if (currItem instanceof SelectedItem && currItem.getLayer()) {
        // Fire off a bunch of promises that fetches attachments and related tables
        requests.push(addRelatedContent(currItem));
      }
    });
    // Wait for all requests. If there are no attachments it just calls .then() without waiting.
    Promise.all(requests)
      .catch((err) => {
        console.log(err);
        alert('Kunde inte hämta relaterade objekt. En del fält från relaterade objekt kommer att vara tomma.');
      })
      .then(() => {
        doRender(identifyItems, target, coordinate, opts.ignorePan);
      })
      .catch(err => console.log(err));
  };

  /**
  * Shows the featureinfo popup/sidebar/infowindow for the provided features. Only vector layers are supported.
  * @param {any} fidsbylayer An object containing layer names as keys with a list of feature ids for each layer
  * @param {any} opts An object containing options. Supported options are : coordinate, the coordinate where popup will be shown. If omitted first feature is used.
  *                                                                         ignorePan, do not autopan if type is overlay. Pan should be supressed if view is changed manually to avoid contradicting animations.
  * @returns nothing
  */
  const showInfo = function showInfo(fidsbylayer, opts = {}) {
    const newItems = [];
    const grouplayers = viewer.getGroupLayers();
    const map = viewer.getMap();
    const keys = Object.keys(fidsbylayer);
    keys.forEach(layername => {
      fidsbylayer[layername].forEach(currFeatureId => {
        const layer = viewer.getLayer(layername);
        const f = layer.getSource().getFeatureById(currFeatureId);
        const newItem = getFeatureInfo.createSelectedItem(f, layer, map, grouplayers);
        newItems.push(newItem);
      });
    });
    render(newItems, identifyTarget, opts.coordinate || maputils.getCenter(newItems[0].getFeature().getGeometry()), opts);
  };

  /**
  * Shows the featureinfo popup/sidebar/infowindow for the provided features and fit the view to it.
  * @param {any} featureObj An object containing layerName and feature. "feature" is either one Feature or an Array of Feature
  * @param {any} opts An object containing options. Supported options are : coordinate, the coordinate where popup will be shown. If omitted first feature is used.
  *                                                                         ignorePan, do not autopan if type is overlay. Pan should be supressed if view is changed manually to avoid contradicting animations.
  *                                                                         maxZoomLevel, max level for zooming on feature.
  * @returns nothing
  */
  const showFeatureInfo = function showFeatureInfo(featureObj, opts) {
    const thisOpts = { ...{
      ignorePan: true
    },
    ...opts };

    const newItems = [];
    const layerName = featureObj.layerName;
    const layer = viewer.getLayer(layerName);
    const map = viewer.getMap();
    const grouplayers = viewer.getGroupLayers();
    if (Array.isArray(featureObj.feature)) {
      featureObj.feature.forEach(feature => {
        const newItem = getFeatureInfo.createSelectedItem(feature, layer, map, grouplayers);
        newItems.push(newItem);
      });
    } else {
      const newItem = getFeatureInfo.createSelectedItem(featureObj.feature, layer, map, grouplayers);
      newItems.push(newItem);
    }
    if (newItems.length > 0) {
      render(newItems, identifyTarget, thisOpts.coordinate || maputils.getCenter(newItems[0].getFeature().getGeometry()), thisOpts);
      viewer.getMap().getView().fit(maputils.getExtent(newItems.map(i => i.getFeature())), { maxZoom: thisOpts.maxZoomLevel });
    }
  };

  const onClick = function onClick(evt) {
    savedPin = undefined;
    // Featurinfo in two steps. Concat serverside and clientside when serverside is finished
    const pixel = evt.pixel;
    const map = viewer.getMap();
    const coordinate = evt.coordinate;
    const clientResult = getFeatureInfo.getFeaturesAtPixel({
      coordinate,
      clusterFeatureinfoLevel,
      hitTolerance,
      map,
      pixel
    }, viewer);
    // Abort if clientResult is false
    if (clientResult !== false) {
      getFeatureInfo.getFeaturesFromRemote({
        coordinate,
        map,
        pixel
      }, viewer, textHtmlHandler)
        .then((data) => {
          const serverResult = data || [];
          const result = serverResult.concat(clientResult);
          if (result.length > 0) {
            selectionLayer.clear(false);
            render(result, identifyTarget, evt.coordinate);
          } else if (selectionLayer.getFeatures().length > 0 || (identifyTarget === 'infowindow' && selectionManager.getNumberOfSelectedItems() > 0)) {
            clear(false);
          } else if (pinning) {
            const resolution = map.getView().getResolution();
            sidebar.setVisibility(false);
            setTimeout(() => {
              if (!maputils.checkZoomChange(resolution, map.getView().getResolution())) {
                savedPin = maputils.createPointFeature(evt.coordinate, pinStyle);
                selectionLayer.addFeature(savedPin);
              }
            }, 250);
          }
        })
        .catch((error) => console.error(error));
    }
  };

  const setActive = function setActive(state) {
    const map = viewer.getMap();
    if (state) {
      map.on(clickEvent, onClick);
    } else {
      clear(true);
      map.un(clickEvent, onClick);
    }
  };

  return Component({
    name: 'featureInfo',
    clear,
    addLinkListener,
    getHitTolerance,
    getPin,
    getSelectionLayer,
    getSelection,
    addAttributeType,
    addTextHtmlHandler,
    onAdd(e) {
      // Keep a reference to "ourselves"
      component = this;
      viewer = e.target;
      const map = viewer.getMap();
      setUIoutput(viewer);
      selectionLayer = featurelayer(savedFeature, map);
      selectionManager = viewer.getSelectionManager();
      // Re dispatch selectionmanager's event as our own
      if (selectionManager) {
        selectionManager.on('highlight', evt => dispatchToggleFeatureEvent(evt));
        selectionManager.on('cleared', onSelectionManagerClear);
      }
      map.on(clickEvent, onClick);
      viewer.on('toggleClickInteraction', (detail) => {
        // This line of beauty makes feature info active if explicitly set active of another control yields active state.
        // which effectively makes this the default tool.
        if ((detail.name === 'featureinfo' && detail.active) || (detail.name !== 'featureinfo' && !detail.active)) {
          setActive(true);
        } else {
          setActive(false);
        }
      });

      // Change mouse pointer when hovering over a clickable feature
      if (viewer.getViewerOptions().featureinfoOptions.changePointerOnHover) {
        let pointerActive = true;
        document.addEventListener('enableInteraction', evt => {
          pointerActive = evt.detail.interaction !== 'editor';
          // Avoid getting stuck in pointer mode if user manages to enable editing while having pointer over a clickable feature.
          // If the user manages to disable editing while standing on a clickable feature, it will remain arrow until moved. (Sorry)
          map.getViewport().style.cursor = '';
        });

        // Check if there is a clickable feature when mouse is moved.
        map.on('pointermove', evt => {
          if (!pointerActive || evt.dragging) return;
          let cursor = '';
          const features = map.getFeaturesAtPixel(evt.pixel, { layerFilter(layer) {
            return layer.get('queryable');
          }
          });
          if (features.length > 0) {
            cursor = 'pointer';
          } else {
            const layerArray = [];
            const layerGroups = viewer.getGroupLayers();
            layerGroups.forEach(item => item.getLayersArray().forEach(element => {
              if (element.get('queryable') && element.get('visible')) { layerArray.push(element); }
            }));
            const layers = viewer.getQueryableLayers().filter(layer => layer instanceof BaseTileLayer || layer instanceof ImageLayer);
            if (layers) { layers.forEach(element => layerArray.push(element)); }
            for (let i = 0; i < layerArray.length; i += 1) {
              const layer = layerArray[i];
              const pixelVal = layer.getData(evt.pixel);
              if (pixelVal instanceof Uint8ClampedArray && pixelVal[3] > 0) {
                cursor = 'pointer';
                break;
              }
            }
          }
          map.getViewport().style.cursor = cursor;
        });
      }
    },
    render,
    showInfo,
    showFeatureInfo,
    featureinfotemplates
  });
};

export default Featureinfo;
