import 'owl.carousel';
import Overlay from 'ol/overlay';
import $ from 'jquery';
import viewer from './viewer';
import Popup from './popup';
import sidebar from './sidebar';
import maputils from './maputils';
import featurelayer from './featurelayer';
import Style from './style';
import styleTypes from './style/styletypes';
import getFeatureInfo from './getfeatureinfo';

const style = Style();

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

function init(opt_options) {
  map = viewer.getMap();
  options = opt_options || {};
  const pinStyleOptions = Object.prototype.hasOwnProperty.call(options, 'pinStyle') ? options.pinStyle : styleTypes.getStyle('pin');
  const savedSelection = options.savedSelection || undefined;
  clickEvent = 'clickEvent' in options ? options.clickEvent : 'click';
  pinning = Object.prototype.hasOwnProperty.call(options, 'pinning') ? options.pinning : true;
  pinStyle = style.createStyleRule(pinStyleOptions)[0];
  savedPin = options.savedPin ? maputils.createPointFeature(opt_options.savedPin, pinStyle) : undefined;
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

function identify(items, target, coordinate) {
  clear();
  let content = items.map(i => i.content).join('');
  content = `<div id="o-identify"><div id="o-identify-carousel" class="owl-carousel owl-theme">${content}</div></div>`;
  switch (target) {
    case 'overlay':
    {
      const popup = Popup('#o-map');
      overlay = new Overlay({
        element: popup.getEl()
      });
      map.addOverlay(overlay);
      const geometry = items[0].feature.getGeometry();
      const coord = geometry.getType() === 'Point' ? geometry.getCoordinates() : coordinate;
      overlay.setPosition(coord);
      popup.setContent({
        content,
        title: items[0].title
      });
      popup.setVisibility(true);
      initCarousel('#o-identify-carousel', undefined, function callback() {
        const currentItem = this.owl.currentItem;
        selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
        popup.setTitle(items[currentItem].title);
      });
      viewer.autoPan();
      break;
    }
    case 'sidebar':
    {
      sidebar.setContent({
        content,
        title: items[0].title
      });
      sidebar.setVisibility(true);
      initCarousel('#o-identify-carousel', undefined, function callback() {
        const currentItem = this.owl.currentItem;
        selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
        sidebar.setTitle(items[currentItem].title);
      });
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

function clear() {
  selectionLayer.clear();
  sidebar.setVisibility(false);
  if (overlay) {
    viewer.removeOverlays(overlay);
  }
  console.log('Clearing selection');
}

function onEnableInteraction(e) {
  if (e.interaction === 'featureInfo') {
    setActive(true);
  } else {
    setActive(false);
  }
}

function initCarousel(id, options, cb) {
  const carouselOptions = options || {
    navigation: true, // Show next and prev buttons
    slideSpeed: 300,
    paginationSpeed: 400,
    singleItem: true,
    rewindSpeed: 200,
    navigationText: ['<svg class="o-icon-fa-chevron-left"><use xlink:href="#fa-chevron-left"></use></svg>', '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>'],
    afterAction: cb
  };
  return $(id).owlCarousel(carouselOptions);
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
