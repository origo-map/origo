import 'owl.carousel';
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
    selectionLayer.clearAndAdd(
      items[currentItem].feature.clone(),
      selectionStyles[items[currentItem].feature.getGeometry().getType()]
    );
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
  return $(id).owlCarousel(carouselOptions);
}

function getSelectionLayer() {
  return selectionLayer.getFeatureLayer();
}

function getSelection() {
  const selection = {};
  selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
  selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
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
          selectionLayer.clear();
          identify(result, identifyTarget, evt.coordinate);
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
