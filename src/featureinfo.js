import 'babel-polyfill';
import owl from 'owl.carousel';
import Overlay from 'ol/overlay';
import $ from 'jquery';
import viewer from './viewer';
import Popup from './popup';
import sidebar from './sidebar';
import maputils from './maputils';
import featurelayer from './featurelayer';
import Style from './style';
import StyleTypes from './style/styletypes';
import getFeatureInfo from './getfeatureinfo';
import sources from './utils/sources';

const style = Style();
const styleTypes = StyleTypes();

let selectionLayer;
let savedPin;
let clickEvent;
let options;
let map;
let pinning;
let pinStyle;
let selectionStyles;
let showOverlay;
let identifyTarget;
let clusterFeatureinfoLevel;
let overlay;
let hitTolerance;
let items;
let popup;

function clear() {
  selectionLayer.clear();
  sidebar.setVisibility(false);
  if (overlay) {
    viewer.removeOverlays(overlay);
  }
}

function callback(evt) {
  const currentItem = evt.item.index;
  if (currentItem !== null) {
    const clone = items[currentItem].feature.clone();
    clone.setId(items[currentItem].feature.getId());
    selectionLayer.clearAndAdd(
      clone,
      selectionStyles[items[currentItem].feature.getGeometry().getType()]
    );
    selectionLayer.setSourceLayer(items[currentItem].layer);
    if (identifyTarget === 'overlay') {
      popup.setTitle(items[currentItem].title);
    } else {
      sidebar.setTitle(items[currentItem].title);
    }
  }
}

function initCarousel(id, opt) {
  const carouselOptions = opt || {
    onChanged: callback,
    items: 1,
    nav: true,
    navText: ['<svg class="o-icon-fa-chevron-left"><use xlink:href="#fa-chevron-left"></use></svg>',
      '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>']
  };
  if (identifyTarget === 'overlay') {
    const popupHeight = $('.o-popup').outerHeight() + 20;
    $('#o-popup').height(popupHeight);
  }
  const custom = $(id).owlCarousel(carouselOptions);

  $('#o-identify-carousel > div.owl-nav > button.owl-next').on('click', (e) => {
    const feature = selectionLayer.getFeatures()[0];
    const values = feature.values_;
    delete values.geometry;
    const ul = $('#o-identify-carousel > div.owl-stage-outer > div > div.owl-item.active > div > ul');
    const liss = ul.children();
    let n = Object.keys(values);
    let q = Object.values(values);
    liss.map((item) => {
      const h = $(liss[item].innerHTML).text();
      const index = n.indexOf(h);
      if (index !== -1) n.splice(index, 1);
      if (index !== -1) q.splice(index, 1);
    });
    if (liss.length < (liss.length + n.length)) {
      q.map((o, i) => {
        ul.append(`<li><b>${n[i]}</b> : ${q[i]}</li>`);
        return o;
      });
    }
  });
  return custom;
}

function getSelectionLayer() {
  return selectionLayer.getFeatureLayer();
}

function getSelection() {
  const selection = {};
  if (selectionLayer.getFeatures()[0]) {
    selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
    selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
    selection.id = selectionLayer.getFeatures()[0].getId();
    selection.type = selectionLayer.getSourceLayer().get('type');

    if (selection.type === 'WFS') {
      selection.id = selectionLayer.getFeatures()[0].getId();
    } else {
      selection.id = `${selectionLayer.getSourceLayer().get('name')}.${selectionLayer.getFeatures()[0].getId()}`;
    }
  }
  return selection;
}

function getPin() {
  return savedPin;
}

function getHitTolerance() {
  return hitTolerance;
}

function identify(identifyItems, target, coordinate) {
  items = identifyItems;
  clear();
  let content = items.map(i => i.content).join('');
  content = `<div id="o-identify"><div id="o-identify-carousel" class="owl-carousel owl-theme">${content}</div></div>`;
  switch (target) {
    case 'overlay':
    {
      popup = Popup('#o-map');
      popup.setContent({
        content,
        title: items[0].title
      });
      popup.setVisibility(true);

      initCarousel('#o-identify-carousel');
      const popupHeight = $('.o-popup').outerHeight() + 20;
      $('#o-popup').height(popupHeight);
      overlay = new Overlay({
        element: popup.getEl(),
        autoPan: true,
        autoPanAnimation: {
          duration: 500
        },
        autoPanMargin: 40,
        positioning: 'bottom-center'
      });
      const geometry = items[0].feature.getGeometry();
      const coord = geometry.getType() === 'Point' ? geometry.getCoordinates() : coordinate;
      map.addOverlay(overlay);
      overlay.setPosition(coord);
      break;
    }
    case 'sidebar':
    {
      sidebar.setContent({
        content,
        title: items[0].title
      });
      sidebar.setVisibility(true);
      initCarousel('#o-identify-carousel');
      break;
    }
    default:
    {
      break;
    }
  }
}

function onClick(evt) {
  savedPin = undefined;
  // Featurinfo in two steps. Concat serverside and clientside when serverside is finished
  const clientResult = getFeatureInfo.getFeaturesAtPixel(evt, clusterFeatureinfoLevel);
  // Abort if clientResult is false
  if (clientResult !== false) {
    getFeatureInfo.getFeaturesFromRemote(evt)
      .done((data) => {
        const serverResult = data || [];
        const result = serverResult.concat(clientResult);
        if (result.length > 0) {
          const resultSource = result[0].feature.sources;
          if (typeof resultSource !== 'undefined' || resultSource.length === 0) {
            if (result.length > 1) {
              sources.updateResult(result, identifyTarget, evt.coordinate, selectionLayer, identify);
              sources.updateResults(result, identifyTarget, evt.coordinate, selectionLayer, identify);
            } else {
              sources.updateResult(result, identifyTarget, evt.coordinate, selectionLayer, identify);
            }
          } else {
            selectionLayer.clear();
            identify(result, identifyTarget, evt.coordinate);
          }
        } else if (selectionLayer.getFeatures().length > 0) {
          clear();
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
      });
  }
}

function setActive(state) {
  if (state) {
    map.on(clickEvent, onClick);
  } else {
    clear();
    map.un(clickEvent, onClick);
  }
}

function onEnableInteraction(e) {
  if (e.interaction === 'featureInfo') {
    setActive(true);
  } else {
    setActive(false);
  }
}

function init(optOptions) {
  map = viewer.getMap();
  options = optOptions || {};
  const pinStyleOptions = Object.prototype.hasOwnProperty.call(options, 'pinStyle') ? options.pinStyle : styleTypes.getStyle('pin');
  const savedSelection = options.savedSelection || undefined;
  clickEvent = 'clickEvent' in options ? options.clickEvent : 'click';
  pinning = Object.prototype.hasOwnProperty.call(options, 'pinning') ? options.pinning : true;
  pinStyle = style.createStyleRule(pinStyleOptions)[0];
  savedPin = options.savedPin ? maputils.createPointFeature(options.savedPin, pinStyle) : undefined;
  selectionStyles = 'selectionStyles' in options ? style.createGeometryStyle(options.selectionStyles) : style.createEditStyle();
  const savedFeature = savedPin || savedSelection || undefined;
  selectionLayer = featurelayer(savedFeature, map);
  showOverlay = Object.prototype.hasOwnProperty.call(options, 'overlay') ? options.overlay : true;

  if (showOverlay) {
    identifyTarget = 'overlay';
  } else {
    sidebar.init();
    identifyTarget = 'sidebar';
  }

  clusterFeatureinfoLevel = Object.prototype.hasOwnProperty.call(options, 'clusterFeatureinfoLevel') ? options.clusterFeatureinfoLevel : 1;
  hitTolerance = Object.prototype.hasOwnProperty.call(options, 'hitTolerance') ? options.hitTolerance : 0;

  map.on(clickEvent, onClick);
  $(document).on('enableInteraction', onEnableInteraction);
}

export default {
  init,
  clear,
  getSelectionLayer,
  getSelection,
  getPin,
  getHitTolerance,
  identify
};
